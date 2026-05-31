"""
CET PDF Content Extraction Pipeline
====================================
Input:  8 PDFs from Documents/CET/V12_Deliverables/
Output: Structured JSON in data/extracted/ (subjects.json, chapters.json, sections.json)
Deps:   pip install pymupdf (optional: nltk for enhanced analysis)

Usage:  python scripts/extract_pdf_content.py
        python scripts/extract_pdf_content.py --pdf-dir "path/to/pdfs" --out-dir "path/to/output"

The pipeline:
  1. Opens each PDF and extracts text page by page using PyMuPDF (fitz)
  2. Detects chapter boundaries via patterns like "Chapter X", "Ch. X"
  3. Detects sections (numbered subsections like 1.1, 1.2) within chapters
  4. Classifies text blocks into types: text, definition, example, formula, practice
  5. Computes word counts and estimated reading times
  6. Outputs JSON files matching the CET LMS data schema
"""

import json
import os
import re
import argparse
import sys


# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

PDF_DIR = os.path.join("Documents", "CET", "V12_Deliverables")
OUT_DIR = os.path.join("data", "extracted")

SUBJECTS = [
    {"id": "math",       "name": "Mathematics",        "file": "CET_Math_V12.pdf",       "chapters": (1, 9),
     "emoji": "\U0001f522", "color": "oklch(0.60 0.18 250)", "icon": "function-square"},
    {"id": "science",    "name": "Science",            "file": "CET_Science_V12.pdf",    "chapters": (10, 16),
     "emoji": "\U0001f52c", "color": "oklch(0.65 0.22 145)", "icon": "flask"},
    {"id": "english",    "name": "English",            "file": "CET_English_V12.pdf",    "chapters": (17, 24),
     "emoji": "\U0001f4dd", "color": "oklch(0.70 0.20 75)",  "icon": "book-open"},
    {"id": "filipino",   "name": "Filipino",           "file": "CET_Filipino_V12.pdf",   "chapters": (25, 29),
     "emoji": "\U0001f1f5\U0001f1ed", "color": "oklch(0.60 0.20 15)",  "icon": "globe"},
    {"id": "abstract",   "name": "Abstract Reasoning", "file": "CET_Abstract_V12.pdf",   "chapters": (30, 34),
     "emoji": "\U0001f9e9", "color": "oklch(0.55 0.18 290)", "icon": "grid"},
    {"id": "geninfo",    "name": "General Information", "file": "CET_GenInfo_V12.pdf",   "chapters": (35, 41),
     "emoji": "\U0001f30f", "color": "oklch(0.60 0.16 340)", "icon": "compass"},
    {"id": "examspec",   "name": "Exam-Specific",      "file": "CET_ExamSpecific_V12.pdf", "chapters": (42, 44),
     "emoji": "\U0001f3af", "color": "oklch(0.62 0.18 190)", "icon": "target"},
    {"id": "specialized","name": "Specialized Topics",  "file": "CET_Specialized_V12.pdf", "chapters": (45, 47),
     "emoji": "\u26a1", "color": "oklch(0.62 0.20 55)",  "icon": "zap"},
]

# Chapter title overrides (for cleaner names than extracted text)
CHAPTER_TITLES = {
    "math": {
        1: "The Language of Numbers",
        2: "Variables",
        3: "Algebra",
        4: "Functions",
        5: "Geometry",
        6: "Trigonometry",
        7: "Advanced Algebra & Precalculus",
        8: "Calculus",
        9: "Statistics & Probability",
    },
    "science": {
        10: "Biology I: Cells, Genetics, Evolution",
        11: "Biology II: Body Systems, Ecology",
        12: "Chemistry I: Atomic Structure",
        13: "Chemistry II: Reactions, Stoichiometry",
        14: "Physics I: Mechanics, Energy",
        15: "Physics II: Waves, Optics, Electricity",
        16: "Integrated Science",
    },
    "english": {
        17: "Grammar I: Parts of Speech",
        18: "Grammar II: Syntax & Errors",
        19: "Vocabulary I: High-Frequency Words",
        20: "Vocabulary II: Advanced Words",
        21: "Reading Comprehension",
        22: "Verbal Reasoning",
        23: "Language Proficiency",
        24: "Test-Taking Skills",
    },
    "filipino": {
        25: "Balarila I: Bahagi ng Pananalita",
        26: "Balarila II: Paksa, Pandiwa at Pokus",
        27: "Talasalitaan at mga Idioma",
        28: "Pagbasa: Reading Comprehension at Pagsusuri",
        29: "Kasanayang Pangwika",
    },
    "abstract": {
        30: "Pattern Recognition",
        31: "Logical Reasoning",
        32: "Spatial Reasoning",
        33: "Mechanical Reasoning",
        34: "IQ Tests & Comprehensive Review",
    },
    "geninfo": {
        35: "PH History I: Ancient Times to 1898",
        36: "PH History II: 1898 to Present",
        37: "PH Government & Constitution",
        38: "PH Geography & Resources",
        39: "World History",
        40: "General Science Review",
        41: "Current Events & Contemporary Issues",
    },
    "examspec": {
        42: "CET Format & Strategies",
        43: "Stress Management & Last-Minute Tips",
        44: "Subject-Specific Tips & Tricks",
    },
    "specialized": {
        45: "Academic Strands: STEM, ABM, HUMSS, GAS",
        46: "College Programs: Engineering, Business, Arts",
        47: "TVL, Sports & Arts Track",
    },
}


# ──────────────────────────────────────────────
# Content Block Classification
# ──────────────────────────────────────────────

# Patterns for classifying text blocks
DEFINITION_PATTERNS = [
    re.compile(r'^(?:the\s+)?([A-Z][A-Za-z\s\-]+?)\s+(?:is|are|refers to|means|can be defined as)', re.IGNORECASE),
    re.compile(r'^([A-Z][A-Za-z\s\-]+?):\s+(?:A|An|The)\s', re.IGNORECASE),
]

EXAMPLE_HEADERS = [
    "example", "sample", "illustration", "for instance", "e.g.",
]

FORMULA_PATTERNS = [
    re.compile(r'^[\s$]*[A-Za-z]+\s*[=:=]\s*'),      # Variable = expression
    re.compile(r'^[\s$]*[A-Za-z]+\s*\([^)]+\)\s*[=:=]'),  # f(x) = ...
    re.compile(r'^(?:If|Where|Note:|Rule|Formula)\s*:'),   # Headers
    re.compile(r'^\s*[\\$]'),                               # LaTeX math delimiters
]

PRACTICE_HEADERS = [
    "practice", "exercise", "problem", "question", "homework", "try it",
]

SECTION_HEADER_PATTERN = re.compile(r'^\s*(?:#{1,3}\s+)?(\d+\.\d+)\s+(.+)$')
CHAPTER_HEADER_PATTERN = re.compile(r'(?:Chapter|Ch\.?)\s*(\d+)\s*[:\-–]\s*(.+)$', re.IGNORECASE)
CHAPTER_HEADER_ALT = re.compile(r'#\s*Chapter\s*(\d+)\s*[:\-–]\s*(.+)$', re.IGNORECASE)
CHAPTER_NUMBER_ONLY = re.compile(r'(?:Chapter|Ch\.?)\s*(\d+)', re.IGNORECASE)


def classify_block(line, next_line=None):
    """
    Classify a line of text into a content block type.

    Returns a dict with 'type' and the appropriate keys:
      - text: {type: 'text', value: str}
      - definition: {type: 'definition', term: str, value: str}
      - example: {type: 'example', value: str}
      - formula: {type: 'formula', value: str}
      - practice: {type: 'practice', value: str}
      - (fallback) text
    """
    stripped = line.strip()

    if not stripped or len(stripped) < 5:
        return None

    # Check for definition patterns
    for pat in DEFINITION_PATTERNS:
        m = pat.search(stripped)
        if m:
            term = m.group(1).strip()
            return {"type": "definition", "term": term, "value": stripped}

    # Check for formula patterns
    for pat in FORMULA_PATTERNS:
        if pat.match(stripped):
            return {"type": "formula", "value": stripped}

    # Check for example patterns
    lower = stripped.lower()
    for h in EXAMPLE_HEADERS:
        if lower.startswith(h) and len(h) > 3:
            return {"type": "example", "value": stripped}
    if "example" in lower and (stripped.startswith("Example") or stripped.startswith("E.g.")):
        return {"type": "example", "value": stripped}

    # Check for practice patterns
    for h in PRACTICE_HEADERS:
        if lower.startswith(h) and len(h) > 3:
            return {"type": "practice", "value": stripped}
    if re.match(r'^\d+\.\s+', stripped) and any(kw in lower for kw in ["solve", "find", "calculate", "determine", "evaluate", "simplify"]):
        return {"type": "practice", "value": stripped}

    # Default: plain text
    return {"type": "text", "value": stripped}


def merge_short_blocks(blocks, min_chars=40):
    """
    Merge consecutive text blocks that are very short into a single block.
    This prevents tiny fragments from becoming separate blocks.
    """
    if not blocks:
        return blocks

    merged = []
    buffer = []

    for block in blocks:
        if block["type"] == "text" and len(block.get("value", "")) < min_chars:
            buffer.append(block["value"])
        else:
            if buffer:
                merged.append({"type": "text", "value": " ".join(buffer)})
                buffer = []
            merged.append(block)

    if buffer:
        merged.append({"type": "text", "value": " ".join(buffer)})

    return merged


def extract_section_blocks(text):
    """
    Extract content blocks from section text.

    Splits text into paragraphs/lines and classifies each one.
    Then merges short text fragments into coherent blocks.
    """
    lines = text.split("\n")
    blocks = []

    for i, line in enumerate(lines):
        next_line = lines[i + 1] if i + 1 < len(lines) else None
        block = classify_block(line, next_line)
        if block:
            blocks.append(block)

    # Merge short text blocks
    blocks = merge_short_blocks(blocks)

    return blocks


# ──────────────────────────────────────────────
# PDF Text Extraction (with graceful fallback)
# ──────────────────────────────────────────────

def extract_text_with_fitz(pdf_path):
    """Extract text from PDF using PyMuPDF (fitz). Returns list of {page, text}."""
    import fitz
    doc = fitz.open(pdf_path)
    pages = []
    for page_num, page in enumerate(doc, 1):
        text = page.get_text("text")
        pages.append({"page": page_num, "text": text.strip()})
    doc.close()
    return pages


def extract_text_fallback(pdf_path):
    """
    Minimal fallback if PyMuPDF is not available.
    Reads the raw PDF and extracts text between parentheses/streams.
    This is lossy but better than nothing.
    """
    print(f"  [WARN] PyMuPDF not available. Using basic text extraction for {os.path.basename(pdf_path)}.")
    print(f"  [WARN] Install with: pip install pymupdf")
    pages = []
    try:
        with open(pdf_path, "rb") as f:
            raw = f.read()
        # Try to extract text between parentheses in PDF content streams
        text_parts = []
        in_text = False
        for match in re.finditer(rb'\((.*?)\)', raw):
            try:
                text = match.group(1).decode("latin-1")
                if len(text) > 3 and any(c.isalpha() for c in text):
                    text_parts.append(text)
            except (UnicodeDecodeError, IndexError):
                pass

        full_text = " ".join(text_parts)
        # Split into approximate pages (PDF object boundaries)
        page_markers = list(re.finditer(rb'/Type\s*/Page[^/]*/Parent', raw))
        if page_markers:
            chunk_size = max(1, len(text_parts) // max(1, len(page_markers)))
            for i in range(0, len(text_parts), chunk_size):
                chunk = " ".join(text_parts[i:i + chunk_size])
                pages.append({"page": len(pages) + 1, "text": chunk})
        else:
            pages.append({"page": 1, "text": full_text})
    except Exception as e:
        print(f"  [ERROR] Fallback extraction failed: {e}")
        pages.append({"page": 1, "text": ""})

    return pages


def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF. Tries PyMuPDF first, falls back to basic extraction."""
    try:
        return extract_text_with_fitz(pdf_path)
    except ImportError:
        return extract_text_fallback(pdf_path)
    except Exception as e:
        print(f"  [ERROR] Failed to extract text from {pdf_path}: {e}")
        return extract_text_fallback(pdf_path)


# ──────────────────────────────────────────────
# Chapter & Section Detection
# ──────────────────────────────────────────────

def detect_chapters_and_sections(pages, subject_id, expected_range):
    """
    Detect chapters and sections from extracted PDF pages.

    Returns list of chapter dicts with nested sections.
    """
    chapters = []
    current_chapter = None
    chapter_num = expected_range[0]

    for page in pages:
        text = page["text"]
        lines = text.split("\n")

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue

            # Try to match chapter headers
            match = CHAPTER_HEADER_PATTERN.search(stripped)
            if not match:
                match = CHAPTER_HEADER_ALT.search(stripped)
            if not match:
                match = CHAPTER_NUMBER_ONLY.search(stripped)
                if match:
                    num = int(match.group(1))
                    if expected_range[0] <= num <= expected_range[1]:
                        # Use the line as title, or use predefined title
                        title_line = stripped.replace(f"Chapter {num}", "").replace(f"Ch. {num}", "").strip(" :–-—")
                        if title_line:
                            match = (num, title_line)

            if match:
                if isinstance(match, re.Match):
                    num = int(match.group(1))
                    title = match.group(2).strip() if match.lastindex >= 2 else stripped
                else:
                    num, title_raw = match
                    title = title_raw

                # Validate chapter number is within expected range
                if expected_range[0] <= num <= expected_range[1]:
                    # Save previous chapter
                    if current_chapter:
                        current_chapter["end_page"] = page["page"]
                        chapters.append(current_chapter)

                    # Use predefined title if available
                    predefined = CHAPTER_TITLES.get(subject_id, {}).get(num)
                    if predefined:
                        title = predefined

                    current_chapter = {
                        "number": num,
                        "title": title,
                        "start_page": page["page"],
                        "end_page": None,
                        "sections": [],
                        "text_blocks": [],
                        "raw_text": [],
                    }
                    chapter_num = num

            # Detect sections within the current chapter
            if current_chapter:
                sec_match = SECTION_HEADER_PATTERN.match(stripped)
                if sec_match:
                    sec_num = sec_match.group(1)
                    sec_title = sec_match.group(2).strip()
                    current_chapter["sections"].append({
                        "number": sec_num,
                        "title": sec_title,
                        "page": page["page"],
                        "content": [],
                        "lines": [],
                    })
                else:
                    # Accumulate text into current section or chapter
                    if current_chapter["sections"]:
                        current_chapter["sections"][-1]["lines"].append(stripped)
                    current_chapter["raw_text"].append(stripped)

    # Save the last chapter
    if current_chapter:
        current_chapter["end_page"] = pages[-1]["page"]
        chapters.append(current_chapter)

    return chapters


def build_content_blocks(chapters):
    """
    Process detected chapters and convert raw text lines into structured content blocks.
    Updates chapter section contents in-place.
    """
    for ch in chapters:
        for section in ch.get("sections", []):
            section_text = "\n".join(section.get("lines", []))
            blocks = extract_section_blocks(section_text)
            section["content"] = blocks
            section["word_count"] = len(section_text.split())

            # Extract key terms from definition blocks
            key_terms = []
            for block in blocks:
                if block["type"] == "definition":
                    key_terms.append(block.get("term", ""))
            section["key_terms"] = key_terms

        # If no sections were detected, create one from the chapter's raw text
        if not ch["sections"] and ch.get("raw_text"):
            section = {
                "number": f"{ch['number']}.1",
                "title": ch["title"],
                "page": ch["start_page"],
                "content": extract_section_blocks("\n".join(ch["raw_text"])),
                "lines": ch["raw_text"],
                "word_count": len(" ".join(ch["raw_text"]).split()),
                "key_terms": [],
            }
            ch["sections"] = [section]


# ──────────────────────────────────────────────
# Output Generation
# ──────────────────────────────────────────────

def build_subjects(pages_by_subject):
    """Build the subjects.json output."""
    subjects_out = []
    for subj in SUBJECTS:
        pages = pages_by_subject.get(subj["id"], [])
        subjects_out.append({
            "id": subj["id"],
            "name": subj["name"],
            "file": subj["file"],
            "page_count": len(pages),
            "chapter_count": subj["chapters"][1] - subj["chapters"][0] + 1,
            "emoji": subj["emoji"],
            "color": subj["color"],
            "icon": subj["icon"],
        })
    return subjects_out


def build_chapters(chapters_by_subject):
    """Build the chapters.json output."""
    chapters_out = []
    for subj_id, chapters in chapters_by_subject.items():
        for ch in chapters:
            ch_out = {
                "id": f"ch{subj_id}-{ch['number']}",
                "subject_id": subj_id,
                "number": ch["number"],
                "title": ch["title"],
                "page_start": ch["start_page"],
                "page_end": ch["end_page"],
                "sections": [
                    {
                        "number": s["number"],
                        "title": s["title"],
                        "id": f"sec{subj_id}-{ch['number']}-{s['number'].replace('.', '-')}",
                    }
                    for s in ch.get("sections", [])
                ],
                "word_count": sum(s.get("word_count", 0) for s in ch.get("sections", [])),
                "estimated_read_minutes": max(
                    1,
                    sum(s.get("word_count", 0) for s in ch.get("sections", [])) // 250
                ),
            }
            chapters_out.append(ch_out)
    return chapters_out


def build_sections(chapters_by_subject):
    """Build the sections.json output with full content blocks."""
    sections_out = []
    for subj_id, chapters in chapters_by_subject.items():
        for ch in chapters:
            for section in ch.get("sections", []):
                section_out = {
                    "id": f"sec{subj_id}-{ch['number']}-{section['number'].replace('.', '-')}",
                    "subject_id": subj_id,
                    "chapter_id": f"ch{subj_id}-{ch['number']}",
                    "section_number": section["number"],
                    "title": section["title"],
                    "content": section.get("content", []),
                    "key_terms": section.get("key_terms", []),
                    "word_count": section.get("word_count", 0),
                }
                sections_out.append(section_out)
    return sections_out


def write_json(data, filepath, label=""):
    """Write data as pretty-printed JSON, creating directories as needed."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  [OK] Wrote {label}: {filepath} ({len(data)} items)")


# ──────────────────────────────────────────────
# Main Pipeline
# ──────────────────────────────────────────────

def process_all_pdfs(pdf_dir=None, out_dir=None):
    """Main pipeline: extract all PDFs → detect structure → write JSON outputs."""
    if pdf_dir is None:
        pdf_dir = PDF_DIR
    if out_dir is None:
        out_dir = OUT_DIR

    pdf_dir = os.path.abspath(pdf_dir)
    out_dir = os.path.abspath(out_dir)

    # Resolve relative to project root (script location up 2 levels)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    pdf_dir_resolved = pdf_dir if os.path.isabs(pdf_dir) else os.path.join(project_root, pdf_dir)
    out_dir_resolved = out_dir if os.path.isabs(out_dir) else os.path.join(project_root, out_dir)

    print("=" * 60)
    print("  CET PDF Content Extraction Pipeline")
    print("=" * 60)
    print(f"\n  PDF directory: {pdf_dir_resolved}")
    print(f"  Output directory: {out_dir_resolved}")
    print()

    pages_by_subject = {}
    chapters_by_subject = {}

    for subj in SUBJECTS:
        pdf_path = os.path.join(pdf_dir_resolved, subj["file"])
        print(f"  [{subj['emoji']}] Processing {subj['name']} ({subj['file']})...")

        if not os.path.exists(pdf_path):
            print(f"    [SKIP] File not found: {pdf_path}")
            pages_by_subject[subj["id"]] = []
            chapters_by_subject[subj["id"]] = []
            continue

        # Step 1: Extract text from PDF
        pages = extract_text_from_pdf(pdf_path)
        pages_by_subject[subj["id"]] = pages
        print(f"    Extracted {len(pages)} pages ({sum(len(p['text']) for p in pages)} chars)")

        # Step 2: Detect chapters and sections
        chapters = detect_chapters_and_sections(pages, subj["id"], subj["chapters"])
        print(f"    Detected {len(chapters)} chapters")

        # Step 3: Build content blocks
        build_content_blocks(chapters)
        total_sections = sum(len(ch.get("sections", [])) for ch in chapters)
        print(f"    Built {total_sections} sections with content blocks")

        chapters_by_subject[subj["id"]] = chapters

    # Step 4: Build and write output JSON
    print(f"\n  {'=' * 56}")
    print(f"  Generating output files...")
    print()

    subjects_data = build_subjects(pages_by_subject)
    write_json(subjects_data, os.path.join(out_dir_resolved, "subjects.json"), "subjects")

    chapters_data = build_chapters(chapters_by_subject)
    write_json(chapters_data, os.path.join(out_dir_resolved, "chapters.json"), "chapters")

    sections_data = build_sections(chapters_by_subject)
    write_json(sections_data, os.path.join(out_dir_resolved, "sections.json"), "sections")

    # Summary
    print(f"\n  {'=' * 56}")
    print(f"  PIPELINE COMPLETE")
    print(f"  {'=' * 56}")
    print(f"  Subjects:  {len(subjects_data)}")
    print(f"  Chapters:  {len(chapters_data)}")
    total_sections = sum(
        len(ch.get("sections", []))
        for chapters in chapters_by_subject.values()
        for ch in chapters
    )
    print(f"  Sections:  {total_sections}")
    print(f"  Output:    {out_dir_resolved}")
    print(f"  {'=' * 56}")

    return subjects_data, chapters_data, sections_data


def main():
    parser = argparse.ArgumentParser(
        description="CET PDF Content Extraction Pipeline — converts PDF textbooks to structured JSON"
    )
    parser.add_argument(
        "--pdf-dir",
        default=PDF_DIR,
        help=f"Directory containing the 8 CET PDFs (default: {PDF_DIR})",
    )
    parser.add_argument(
        "--out-dir",
        default=OUT_DIR,
        help=f"Output directory for JSON files (default: {OUT_DIR})",
    )
    args = parser.parse_args()

    process_all_pdfs(pdf_dir=args.pdf_dir, out_dir=args.out_dir)


if __name__ == "__main__":
    main()
