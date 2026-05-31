"""
CET Auto-Flashcard Generator
=============================
Input:  data/extracted/sections.json (from extract_pdf_content.py)
Output: data/extracted/flashcards.json — flashcard decks organized by subject and chapter

The generator uses several strategies:
  1. Definition blocks → Direct term/definition flashcards
  2. Formula blocks → Formula flashcards (front: formula name, back: expression)
  3. Text blocks → Extract key terms via heuristics (capitalized terms, quoted phrases)
  4. Example blocks → Concept flashcards from worked examples

Usage:  python scripts/extract_flashcards.py
        python scripts/extract_flashcards.py --sections-path data/extracted/sections.json
"""

import json
import os
import re
import hashlib
import argparse
from collections import defaultdict


# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

SECTIONS_PATH = os.path.join("data", "extracted", "sections.json")
OUT_DIR = os.path.join("data", "extracted")

# Patterns for detecting key terms in text blocks
CAPITALIZED_TERM = re.compile(r'\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b')
QUOTED_TERM = re.compile(r'"([^"]{3,})"')
PARENTHESIZED_TERM = re.compile(r'\(([A-Z][a-z]+(?: [A-Z][a-z]+)*)\)')
ABBREVIATION_TERM = re.compile(r'\b([A-Z]{2,})\b')

# Words that signal a definition in prose
DEFINITION_SIGNALS = [
    r'refers?\s+to', r'is\s+defined\s+as', r'means?\s+that',
    r'can\s+be\s+described\s+as', r'is\s+known\s+as',
    r'is\s+called', r'is\s+termed', r"also\s+known\s+as",
    r"is\s+a\s+(method|technique|process|type|kind|form|way|system|approach)",
    r"is\s+the\s+(process|study|practice|art|science|field|area|branch)",
]


# ──────────────────────────────────────────────
# Flashcard Generation Strategies
# ──────────────────────────────────────────────

def extract_definition_flashcards(block):
    """
    Generate a flashcard from a definition block.
    Front = term, Back = definition value.
    """
    term = block.get("term", "")
    value = block.get("value", "")
    if not term or not value:
        return None

    # Strip the term prefix from the value for a cleaner back
    clean_value = value
    for prefix in [f"{term} is ", f"{term} are ", f"{term} refers to ", f"{term} means ", f"{term}: "]:
        if clean_value.lower().startswith(prefix.lower()):
            clean_value = clean_value[len(prefix):].strip()
            break

    return {
        "front": term,
        "back": clean_value,
        "source": "definition",
        "difficulty": "easy",
    }


def extract_formula_flashcards(block):
    """
    Generate a flashcard from a formula block.
    Front = formula name (extracted from nearby text or first part), Back = formula expression.
    """
    value = block.get("value", "")
    if not value:
        return None

    # Try to extract a name from the formula
    name_match = re.match(r"^([A-Za-z]+(?:'s)?\s+[A-Za-z]+)\s*[:=]", value)
    if name_match:
        return {
            "front": name_match.group(1).strip(),
            "back": value,
            "source": "formula",
            "difficulty": "medium",
        }

    # Check for "If X = Y" patterns
    if_match = re.match(r'^If\s+(.+?),?\s*:\s*(.+)$', value, re.IGNORECASE)
    if if_match:
        return {
            "front": if_match.group(1).strip(),
            "back": if_match.group(2).strip(),
            "source": "formula",
            "difficulty": "medium",
        }

    # For standalone formulas, use "Formula" as front
    cleaned = value.strip(" :=-–")
    if len(cleaned) > 5:
        front = re.sub(r'\s*=\s*.*$', '', cleaned).strip()
        back = cleaned
        return {
            "front": front if front and len(front) > 2 else "Formula",
            "back": back,
            "source": "formula",
            "difficulty": "medium",
        }

    return None


def extract_text_flashcards(block, subject_id, chapter_id):
    """
    Scan text blocks for key terms and generate flashcards.
    Uses heuristics like capitalized terms, quoted phrases, and definition signals.
    """
    text = block.get("value", "")
    if not text or len(text) < 20:
        return []

    flashcards = []

    # Strategy 1: Look for "X is Y" definition patterns within text
    for pattern in DEFINITION_SIGNALS:
        matches = re.finditer(
            r'([A-Z][A-Za-z\s\-]{2,40}?)'
            + pattern
            + r'([^.!?]+[.!?])',
            text,
            re.IGNORECASE,
        )
        for m in matches:
            term = m.group(1).strip()
            definition = (m.group(0).strip()
                          .replace(m.group(1), "____")
                          .replace("  ", " "))
            if len(term) > 2 and len(definition) > 10:
                flashcards.append({
                    "front": term,
                    "back": definition,
                    "source": "text_extraction",
                    "difficulty": "medium",
                })

    # Strategy 2: Extract quoted terms with nearby context
    quoted = QUOTED_TERM.findall(text)
    for q in quoted:
        if len(q) > 3 and len(q) < 80:
            # Try to get context before the quote
            context_match = re.search(
                rf'([A-Za-z\s]+)\s*["""]{re.escape(q)}["""]',
                text,
            )
            back = context_match.group(1).strip() if context_match else f"'{q}'"
            if back and back != q:
                flashcards.append({
                    "front": q,
                    "back": back,
                    "source": "text_extraction",
                    "difficulty": "medium",
                })

    # Strategy 3: Extract significant capitalized terms
    terms = CAPITALIZED_TERM.findall(text)
    # Filter to likely educational terms (2+ words, or single words 5+ chars)
    significant_terms = [
        t for t in terms
        if ' ' in t or (len(t) >= 5 and t not in (
            "However", "Therefore", "Furthermore", "Additionally",
            "Moreover", "Nevertheless", "Consequently", "Meanwhile",
            "First", "Second", "Third", "Finally",
        ))
    ]

    # Remove duplicates and already-seen terms
    seen = set()
    unique_terms = []
    for t in significant_terms:
        low = t.lower()
        if low not in seen:
            seen.add(low)
            unique_terms.append(t)

    # Keep only the most significant-looking terms
    for term in unique_terms[:3]:  # Limit to 3 per text block
        # Try to find a definitional context for the term
        context = _find_term_context(term, text)
        if context:
            flashcards.append({
                "front": term,
                "back": context,
                "source": "text_extraction",
                "difficulty": "hard",
            })

    return flashcards


def _find_term_context(term, text):
    """Try to find a definitional context for a term within the text."""
    # Look for X is|are|refers_to patterns near the term
    patterns = [
        rf'{re.escape(term)}\s+(?:is|are|refers?\s+to|means?|can be defined as)\s+([^.!?]+)',
        rf'([^.!?]+?)\s+is\s+(?:called|known as|termed)\s+{re.escape(term)}',
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            definition = m.group(1).strip() if m.lastindex >= 1 else text[:100]
            return f"{term}: {definition}"

    # Fallback: return surrounding sentence
    sent_match = re.search(rf'[^.!?]*\b{re.escape(term)}\b[^.!?]*[.!?]', text)
    if sent_match:
        return sent_match.group(0).strip()

    return None


def extract_example_flashcards(block):
    """
    Extract concepts from example blocks.
    Examples often illustrate a rule or concept — record the concept.
    """
    value = block.get("value", "")
    if not value or len(value) < 15:
        return None

    # Look for "Example of X" patterns
    example_match = re.match(
        r'Example[s]?\s+(?:of|:)\s+(.+?)[.:]',
        value,
        re.IGNORECASE,
    )
    if example_match:
        concept = example_match.group(1).strip()
        return {
            "front": f"Example: {concept}",
            "back": value,
            "source": "example",
            "difficulty": "medium",
        }

    # If the example contains a key takeaway
    short_value = value[:150]
    return {
        "front": "Concept",
        "back": short_value,
        "source": "example",
        "difficulty": "medium",
    }


# ──────────────────────────────────────────────
# Output Generation
# ──────────────────────────────────────────────

def build_decks(sections):
    """
    Process all sections and organize flashcards into decks by subject and chapter.

    Returns a dict with 'decks' (list) and 'flashcards' (list).
    """
    all_flashcards = []
    seen_pairs = set()  # Dedup by (front_lower, back_lower)

    # Group by subject then chapter for deck organization
    subject_chapter_cards = defaultdict(lambda: defaultdict(list))

    for section in sections:
        content = section.get("content", [])
        if not content:
            continue

        subject_id = section.get("subject_id", "unknown")
        chapter_id = section.get("chapter_id", "unknown")

        for block in content:
            btype = block.get("type", "")
            cards = []

            if btype == "definition":
                card = extract_definition_flashcards(block)
                if card:
                    cards.append(card)

            elif btype == "formula":
                card = extract_formula_flashcards(block)
                if card:
                    cards.append(card)

            elif btype == "example":
                card = extract_example_flashcards(block)
                if card:
                    cards.append(card)

            elif btype == "text":
                extracted = extract_text_flashcards(block, subject_id, chapter_id)
                for card in extracted:
                    card["front"] = card.get("front", "Term").strip()[:100]
                    card["back"] = card.get("back", "").strip()[:300]
                    cards.append(card)

            # Deduplicate and add metadata
            for card in cards:
                dedup_key = (card["front"].lower(), card["back"][:60].lower())
                if dedup_key not in seen_pairs:
                    seen_pairs.add(dedup_key)

                    card["id"] = f"fc-{hashlib.md5(dedup_key[0].encode()).hexdigest()[:8]}"
                    card["subject_id"] = subject_id
                    card["chapter_id"] = chapter_id
                    card["section_id"] = section.get("id", "")

                    all_flashcards.append(card)
                    subject_chapter_cards[subject_id][chapter_id].append(card)

    # Build decks
    decks = []
    for subject_id in sorted(subject_chapter_cards.keys()):
        for chapter_id in sorted(subject_chapter_cards[subject_id].keys()):
            cards = subject_chapter_cards[subject_id][chapter_id]
            deck_name = f"{subject_id} - {chapter_id}"
            decks.append({
                "id": f"deck-{subject_id}-{chapter_id}",
                "name": deck_name,
                "subject_id": subject_id,
                "chapter_id": chapter_id,
                "card_count": len(cards),
                "difficulty_distribution": {
                    "easy": sum(1 for c in cards if c.get("difficulty") == "easy"),
                    "medium": sum(1 for c in cards if c.get("difficulty") == "medium"),
                    "hard": sum(1 for c in cards if c.get("difficulty") == "hard"),
                },
                "cards": cards,
            })

    # Also create per-subject mega-decks
    subject_decks = build_subject_decks(all_flashcards, subject_chapter_cards)

    return {
        "decks": decks + subject_decks,
        "flashcards": all_flashcards,
    }


def build_subject_decks(all_flashcards, subject_chapter_cards):
    """Build per-subject mega-decks containing all cards for a subject."""
    subject_decks = []
    subject_groups = defaultdict(list)

    for card in all_flashcards:
        subject_groups[card["subject_id"]].append(card)

    for subject_id, cards in sorted(subject_groups.items()):
        chapter_count = len(subject_chapter_cards.get(subject_id, {}))
        subject_decks.append({
            "id": f"deck-{subject_id}-all",
            "name": f"{subject_id.title()} - All Chapters",
            "subject_id": subject_id,
            "chapter_id": "all",
            "card_count": len(cards),
            "difficulty_distribution": {
                "easy": sum(1 for c in cards if c.get("difficulty") == "easy"),
                "medium": sum(1 for c in cards if c.get("difficulty") == "medium"),
                "hard": sum(1 for c in cards if c.get("difficulty") == "hard"),
            },
            "cards": cards,
        })

    return subject_decks


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="CET Auto-Flashcard Generator — generates flashcards from extracted textbook content"
    )
    parser.add_argument(
        "--sections-path",
        default=SECTIONS_PATH,
        help="Path to sections.json (default: data/extracted/sections.json)",
    )
    parser.add_argument(
        "--out-dir",
        default=OUT_DIR,
        help="Output directory (default: data/extracted)",
    )
    args = parser.parse_args()

    # Resolve paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    sections_path = args.sections_path if os.path.isabs(args.sections_path) else os.path.join(project_root, args.sections_path)
    out_dir = args.out_dir if os.path.isabs(args.out_dir) else os.path.join(project_root, args.out_dir)

    print("=" * 60)
    print("  CET Auto-Flashcard Generator")
    print("=" * 60)

    # Load sections
    if not os.path.exists(sections_path):
        print(f"\n  [ERROR] Sections file not found: {sections_path}")
        print(f"  [INFO] Run extract_pdf_content.py first to generate sections.json")
        return

    with open(sections_path, "r", encoding="utf-8") as f:
        sections = json.load(f)

    print(f"\n  Loaded {len(sections)} sections from {sections_path}")

    # Generate flashcards
    result = build_decks(sections)
    flashcards = result["flashcards"]
    decks = result["decks"]

    print(f"  Generated {len(flashcards)} flashcards across {len(decks)} decks")

    # Write output
    os.makedirs(out_dir, exist_ok=True)
    output_path = os.path.join(out_dir, "flashcards.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({
            "decks": decks,
            "flashcards": flashcards,
        }, f, indent=2, ensure_ascii=False)

    print(f"  Wrote {output_path}")

    # Summary
    from collections import Counter
    subject_counts = Counter(c.get("subject_id", "unknown") for c in flashcards)
    source_counts = Counter(c.get("source", "unknown") for c in flashcards)

    print(f"\n  Flashcards by subject:")
    for sid, count in sorted(subject_counts.items()):
        print(f"    {sid}: {count} flashcards")

    print(f"\n  Flashcards by source:")
    for src, count in sorted(source_counts.items()):
        print(f"    {src}: {count} flashcards")

    print(f"\n  {'=' * 56}")
    print(f"  COMPLETE — Generated {len(flashcards)} flashcards in {len(decks)} decks")
    print(f"  {'=' * 56}")


if __name__ == "__main__":
    main()
