"""
CET Auto-Question Generator
============================
Input:  data/extracted/sections.json (from extract_pdf_content.py)
Output: data/extracted/questions.json — multiple-choice questions auto-generated
        from textbook content using heuristics and NLP patterns.

The generator uses several strategies:
  1. Definition → Question: "What is the term for...?"
  2. Fact with number → Question: "How many/What is...?"
  3. Statement of fact → "Which of the following is true/false...?"
  4. Comparison → "Which is the correct comparison...?"
  5. List enumeration → "Which is NOT...?"

Usage:  python scripts/extract_questions.py
        python scripts/extract_questions.py --sections-path data/extracted/sections.json
"""

import json
import os
import re
import hashlib
import argparse
import random


# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

SECTIONS_PATH = os.path.join("data", "extracted", "sections.json")
QUESTIONS_PATH = os.path.join("data", "extracted", "questions.json")
OUT_DIR = os.path.join("data", "extracted")

# Difficulty thresholds (by content type)
DIFFICULTY_MAP = {
    "definition": "easy",
    "fact": "medium",
    "numerical": "medium",
    "concept": "medium",
    "comparison": "hard",
    "inference": "hard",
}

# Common distractor patterns
NUMERIC_DISTRACTORS = {
    "half": ["double", "triple", "same"],
    "double": ["half", "triple", "quadruple"],
    "increase": ["decrease", "remain constant", "fluctuate"],
    "decrease": ["increase", "remain constant", "fluctuate"],
    "positive": ["negative", "zero", "undefined"],
    "negative": ["positive", "zero", "undefined"],
}


# ──────────────────────────────────────────────
# Question Generation Strategies
# ──────────────────────────────────────────────

def generate_definition_question(block, section_context):
    """
    Generate a question from a definition block.
    Strategy: "What is the term for [definition]?"

    Example:
      Input: {"type": "definition", "term": "Mitosis", "value": "Cell division producing 2 identical daughter cells"}
      Output: "What is the term for 'cell division producing 2 identical daughter cells'?"
    """
    term = block.get("term", "")
    value = block.get("value", "")

    if not term or not value:
        return None

    # Extract the definition part (remove the term prefix)
    def_text = value
    for prefix in [f"{term} is ", f"{term} are ", f"{term} refers to ", f"{term}: "]:
        if def_text.lower().startswith(prefix.lower()):
            def_text = def_text[len(prefix):].strip().rstrip(".")
            break

    if len(def_text) < 10:
        return None

    # Get distractors from sibling sections or nearby definitions
    distractors = _generate_distractors_for_term(term, section_context, count=3)
    if len(distractors) < 3:
        return None

    # Format question
    question_text = f"What is the term for '{def_text}'?"
    options = _shuffle_options([
        {"text": term, "isCorrect": True},
        *[{"text": d, "isCorrect": False} for d in distractors[:3]],
    ])

    return {
        "source_type": "auto-generated",
        "difficulty": "easy",
        "type": "definition",
        "term": term,
        "question": question_text,
        "options": options,
        "explanation": f"{term}: {value}",
    }


def generate_fact_question(text, section_context):
    """
    Generate a question from a factual statement.
    Strategies:
      - If contains a number → "How many/What is..." question
      - If contains a comparison → "Which is correct" question
      - Otherwise → "Which statement is true/false" question
    """
    text = text.strip()
    if len(text) < 30 or len(text) > 300:
        return None

    # Check for numbered facts
    number_match = re.search(r'\b(\d+)\s+(percent|%|times|years|days|hours|meters|kilometers|miles|grams|liters|cells|chromosomes|genes|people|islands|provinces|chapters|sections|parts|types|kinds|categories|groups|classes|steps|phases|stages|levels|layers|branches|forms|versions|editions|volumes)\b', text, re.IGNORECASE)
    if number_match:
        return _generate_numerical_question(text, number_match, section_context)

    # Check for comparative statements
    if re.search(r'\b(more than|less than|greater than|larger than|smaller than|faster than|slower than|higher than|lower than|earlier than|later than|before|after|precedes|follows)\b', text, re.IGNORECASE):
        return _generate_comparison_question(text, section_context)

    # Check for list/enumeration patterns
    if re.search(r'\b(there are|consists of|includes|comprises|classified into|divided into|categorized as)\b', text, re.IGNORECASE):
        return _generate_enumeration_question(text, section_context)

    # Default: true/false statement
    return _generate_true_false_question(text, section_context)


def _generate_numerical_question(text, match, context):
    """Generate a 'how many/what is' question from a numerical fact."""
    number = match.group(1)
    unit = match.group(2)

    # Extract the subject of the sentence
    subject_match = re.match(r'^([^,]+?)\s+(?:has|is|are|was|were|contains|include|includes|consists of)\s', text, re.IGNORECASE)
    subject = subject_match.group(1).strip() if subject_match else "it"

    question_text = f"How many {unit} does {subject} have?"
    # Clean up question
    question_text = re.sub(r'\s+', ' ', question_text).strip()

    # Generate distractors: nearby numbers ±1, ±2, ×2
    num = int(number)
    distractors = _generate_numeric_distractors(num, count=3)
    if not distractors:
        return None

    options = _shuffle_options([
        {"text": f"{num} {unit}" if unit not in ("percent", "%") else f"{num}%", "isCorrect": True},
        *[{"text": f"{d} {unit}" if unit not in ("percent", "%") else f"{d}%", "isCorrect": False} for d in distractors],
    ])

    return {
        "source_type": "auto-generated",
        "difficulty": "medium",
        "type": "numerical",
        "question": question_text,
        "options": options,
        "explanation": text,
    }


def _generate_comparison_question(text, context):
    """Generate a comparison question."""
    # Extract the comparative relationship
    match = re.search(r'(.+?)\s+is\s+(more|less|greater|smaller|faster|slower|higher|lower)\s+than\s+(.+)', text, re.IGNORECASE)
    if not match:
        return None

    a = match.group(1).strip()
    relation = match.group(2).lower()
    b = match.group(3).strip().rstrip(".")

    relation_words = {
        "more": "greater",
        "less": "smaller",
        "greater": "greater",
        "smaller": "smaller",
        "faster": "faster",
        "slower": "slower",
        "higher": "higher",
        "lower": "lower",
    }
    opposite = {
        "greater": "smaller",
        "smaller": "greater",
        "faster": "slower",
        "slower": "faster",
        "higher": "lower",
        "lower": "higher",
    }

    word = relation_words.get(relation, relation)
    opp = opposite.get(word, word)

    question_text = f"Which of the following is correct about {a} and {b}?"

    options = _shuffle_options([
        {"text": f"{a} is {word} than {b}", "isCorrect": True},
        {"text": f"{a} is {opp} than {b}", "isCorrect": False},
        {"text": f"{b} is {word} than {a}", "isCorrect": False},
        {"text": f"{a} is equal to {b}", "isCorrect": False},
    ])

    return {
        "source_type": "auto-generated",
        "difficulty": "hard",
        "type": "comparison",
        "question": question_text,
        "options": options,
        "explanation": text,
    }


def _generate_enumeration_question(text, context):
    """Generate a 'which is NOT' question from an enumeration."""
    # Extract the items being listed
    items_match = re.search(r'(?:includes|comprises|classified into|divided into|categorized as|are)\s+(.+?)(?:\.|and)', text, re.IGNORECASE)
    if not items_match:
        return None

    items_text = items_match.group(1)
    # Extract individual items
    items = [i.strip().rstrip(",") for i in re.split(r'[,;]', items_text) if i.strip()]
    items = [i for i in items if len(i) > 3 and len(i) < 50]

    if len(items) < 3:
        return None

    # Pick one item to be the "which is NOT" answer
    items_copy = items.copy()
    random.shuffle(items_copy)
    correct_item = items_copy[0]
    other_items = items_copy[1:4] if len(items_copy) >= 4 else items_copy[1:]
    fake_item = _generate_fake_item(correct_item, context)

    # Build the question
    category_match = re.match(r'^([^.]+?)\s+(?:includes|comprises|classified into|divided into|categorized as|are)\s', text, re.IGNORECASE)
    category = category_match.group(1).strip() if category_match else "the following"

    question_text = f"Which of the following is NOT one of {category}?"
    options = _shuffle_options([
        *[{"text": item, "isCorrect": False} for item in other_items[:3]],
        {"text": fake_item, "isCorrect": True},
    ])

    return {
        "source_type": "auto-generated",
        "difficulty": "medium",
        "type": "enumeration",
        "question": question_text,
        "options": options,
        "explanation": f"The correct categories are: {', '.join(items)}",
    }


def _generate_true_false_question(text, context):
    """Generate a 'which statement is true' question."""
    # Extract a key claim from the text
    sentences = re.split(r'(?<=[.!?])\s+', text)
    if not sentences:
        return None

    # Pick a sentence with good length
    good_sentences = [s for s in sentences if 20 < len(s) < 120]
    if not good_sentences:
        return None

    true_stmt = random.choice(good_sentences).strip().rstrip(".!?")

    # Generate false statements by negating or altering key parts
    false_stmts = _generate_false_statements(true_stmt, context, count=3)

    options = _shuffle_options([
        {"text": true_stmt, "isCorrect": True},
        *[{"text": f, "isCorrect": False} for f in false_stmts],
    ])

    return {
        "source_type": "auto-generated",
        "difficulty": "medium",
        "type": "true_false",
        "question": "Which of the following statements is TRUE?",
        "options": options,
        "explanation": true_stmt,
    }


# ──────────────────────────────────────────────
# Distractor Generation
# ──────────────────────────────────────────────

def _generate_distractors_for_term(correct_term, context, count=3):
    """Generate plausible distractor terms from context."""
    # Collect all terms from context
    all_terms = []
    for section in context.get("nearby_sections", []):
        for block in section.get("content", []):
            if block.get("type") == "definition":
                t = block.get("term", "")
                if t and t.lower() != correct_term.lower():
                    all_terms.append(t)

    # Remove duplicates, shuffle, pick 'count'
    all_terms = list(dict.fromkeys(all_terms))  # preserve order, remove duplicates
    random.shuffle(all_terms)

    if len(all_terms) >= count:
        return all_terms[:count]

    # Fallback: generate semantically related terms
    fallbacks = [
        f"{correct_term} Theory",
        f"Proto-{correct_term}",
        f"Pseudo-{correct_term}",
        f"Reverse {correct_term}",
        f"Modified {correct_term}",
        f"{correct_term} Process",
    ]
    return (all_terms + fallbacks)[:count]


def _generate_numeric_distractors(correct_num, count=3):
    """Generate plausible numeric distractors."""
    distractors = set()
    offsets = [1, 2, -1, -2, correct_num * 2, correct_num // 2 if correct_num > 1 else None]
    for offset in offsets:
        if offset is not None:
            d = correct_num + offset if isinstance(offset, int) else offset
            if d != correct_num and d >= 0:
                distractors.add(d)
        if len(distractors) >= count + 2:
            break

    # Convert to list and pick 'count'
    dist_list = list(distractors)
    random.shuffle(dist_list)
    return dist_list[:count]


def _generate_false_statements(true_stmt, context, count=3):
    """Generate false versions of a true statement."""
    false_stmts = []

    # Strategy 1: Negate the verb
    neg_match = re.search(r'\b(is|are|was|were|has|have|had|does|do|did|can|could|will|would|shall|should|may|might|must)\b', true_stmt, re.IGNORECASE)
    if neg_match:
        verb = neg_match.group(1)
        negated = {
            "is": "is not", "are": "are not", "was": "was not", "were": "were not",
            "has": "has not", "have": "have not", "had": "had not",
            "does": "does not", "do": "do not", "did": "did not",
            "can": "cannot", "could": "could not", "will": "will not",
            "would": "would not", "shall": "shall not", "should": "should not",
            "may": "may not", "might": "might not", "must": "must not",
        }
        if verb.lower() in negated:
            false_stmts.append(true_stmt.replace(verb, negated[verb.lower()], 1))

    # Strategy 2: Swap a keyword with an antonym
    antonym_pairs = [
        (r'\bincrease[sd]?\b', 'decrease'), (r'\bdecrease[sd]?\b', 'increase'),
        (r'\bpositive\b', 'negative'), (r'\bnegative\b', 'positive'),
        (r'\blargest\b', 'smallest'), (r'\bsmallest\b', 'largest'),
        (r'\bgreatest\b', 'least'), (r'\bleast\b', 'greatest'),
        (r'\bmost\b', 'fewest'), (r'\bfewest\b', 'most'),
        (r'\binside\b', 'outside'), (r'\boutside\b', 'inside'),
        (r'\babove\b', 'below'), (r'\bbelow\b', 'above'),
    ]
    for pattern, replacement in antonym_pairs:
        if re.search(pattern, true_stmt, re.IGNORECASE) and len(false_stmts) < count:
            false_stmt = re.sub(pattern, replacement, true_stmt, count=1, flags=re.IGNORECASE)
            if false_stmt != true_stmt:
                false_stmts.append(false_stmt)

    # Strategy 3: Change a number
    num_match = re.search(r'\b\d+\b', true_stmt)
    if num_match and len(false_stmts) < count:
        num = int(num_match.group())
        alt_num = num + random.choice([1, 2, -1, 10, -10])
        if alt_num >= 0:
            false_stmts.append(true_stmt.replace(str(num), str(alt_num), 1))

    # Fill remaining with generic false statements
    generic_false = [
        f"The opposite of {true_stmt.lower()}",
        f"This statement is contradicted by current research",
        f"This is a common misconception about the topic",
    ]
    while len(false_stmts) < count:
        idx = len(false_stmts)
        if idx < len(generic_false):
            false_stmts.append(generic_false[idx])
        else:
            false_stmts.append(f"None of the above statements are true")

    return false_stmts[:count]


def _generate_fake_item(correct_item, context):
    """Generate a plausible fake item for 'which is NOT' questions."""
    # Try to find a related but incorrect term from context
    for section in context.get("nearby_sections", []):
        for block in section.get("content", []):
            if block.get("type") == "definition":
                t = block.get("term", "")
                if t and t.lower() != correct_item.lower():
                    return f"Fake {t}"

    return "None of the above"


def _shuffle_options(options):
    """Shuffle options while preserving the isCorrect flag."""
    random.shuffle(options)
    for i, opt in enumerate(options):
        opt["id"] = chr(97 + i)  # a, b, c, d
    return options


# ──────────────────────────────────────────────
# Content Processing
# ──────────────────────────────────────────────

def process_sections(sections):
    """
    Process all sections and generate questions.
    Returns a list of question dicts.
    """
    questions = []
    seen_questions = set()  # Deduplication

    for section in sections:
        content = section.get("content", [])
        if not content:
            continue

        # Build context from nearby sections (for distractor generation)
        # Uses first 5 + last 5 sections for global term pool
        context = {
            "nearby_sections": (sections[:5] + sections[-5:]) if len(sections) > 10 else sections,
        }

        for i, block in enumerate(content):
            q = None

            if block["type"] == "definition":
                q = generate_definition_question(block, context)
            elif block["type"] == "text":
                q = generate_fact_question(block.get("value", ""), context)
            elif block["type"] == "example":
                # Examples can be turned into concept questions
                q = generate_fact_question(block.get("value", ""), context)
            elif block["type"] == "formula" and not block.get("value", "").startswith("\\"):
                # Only generate from textual formulas, not diagram references
                q = generate_fact_question(block.get("value", ""), context)

            if q:
                # Add metadata
                q["subject_id"] = section.get("subject_id", "")
                q["chapter_id"] = section.get("chapter_id", "")
                q["section_id"] = section.get("id", "")

                # Generate unique ID
                id_str = f"{q['subject_id']}-{q.get('type', 'auto')}-{i}"
                q["id"] = f"q-auto-{hashlib.md5(id_str.encode()).hexdigest()[:8]}"

                # Deduplicate
                question_key = q["question"][:60]
                if question_key not in seen_questions:
                    seen_questions.add(question_key)
                    questions.append(q)

    return questions


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="CET Auto-Question Generator — generates MCQs from extracted textbook content"
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
    parser.add_argument(
        "--max-questions",
        type=int,
        default=0,
        help="Maximum questions per subject (0 = unlimited)",
    )
    args = parser.parse_args()

    # Resolve paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    sections_path = args.sections_path if os.path.isabs(args.sections_path) else os.path.join(project_root, args.sections_path)
    out_dir = args.out_dir if os.path.isabs(args.out_dir) else os.path.join(project_root, args.out_dir)

    print("=" * 60)
    print("  CET Auto-Question Generator")
    print("=" * 60)

    # Load sections
    if not os.path.exists(sections_path):
        print(f"\n  [ERROR] Sections file not found: {sections_path}")
        print(f"  [INFO] Run extract_pdf_content.py first to generate sections.json")
        return

    with open(sections_path, "r", encoding="utf-8") as f:
        sections = json.load(f)

    print(f"\n  Loaded {len(sections)} sections from {sections_path}")

    # Generate questions
    questions = process_sections(sections)

    # Apply per-subject limit if set
    if args.max_questions > 0:
        from collections import defaultdict
        subject_counts = defaultdict(int)
        filtered = []
        for q in questions:
            sid = q.get("subject_id", "")
            if subject_counts[sid] < args.max_questions:
                filtered.append(q)
                subject_counts[sid] += 1
        questions = filtered

    print(f"  Generated {len(questions)} questions")

    # Write output
    os.makedirs(out_dir, exist_ok=True)
    output_path = os.path.join(out_dir, "questions.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

    print(f"  Wrote {output_path}")

    # Summary by subject
    from collections import Counter
    subject_counts = Counter(q.get("subject_id", "unknown") for q in questions)
    print(f"\n  Questions by subject:")
    for sid, count in sorted(subject_counts.items()):
        print(f"    {sid}: {count} questions")

    print(f"\n  {'=' * 56}")
    print(f"  COMPLETE — Generated {len(questions)} auto-questions")
    print(f"  {'=' * 56}")


if __name__ == "__main__":
    main()
