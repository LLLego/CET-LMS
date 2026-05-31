#!/usr/bin/env python3
"""
Merge Content Updates — Recalculate Word Counts
================================================
After content expansion for math chapters 3, 7, 8, recalculates:
1. Section word_counts from actual content in textbook_data.json (source of truth)
2. Syncs those word_counts into sections.json
3. Chapter word_counts (sum of section word_counts) in chapters.json
4. estimated_read_minutes in chapters.json (word_count / 200 wpm)

Usage:
    python3 scripts/merge-content-updates.py [--dry-run]
"""

import json
import re
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
EXTRACTED_DIR = DATA_DIR / "extracted"

SECTIONS_FILE = EXTRACTED_DIR / "sections.json"
CHAPTERS_FILE = EXTRACTED_DIR / "chapters.json"
TEXTBOOK_FILE = DATA_DIR / "textbook_data.json"

# Chapters that need word count recalculation (after content expansion)
TARGET_CHAPTER_NUMBERS = [3, 7, 8]
TARGET_CHAPTER_IDS = [f"chmath-{n}" for n in TARGET_CHAPTER_NUMBERS]
WORDS_PER_MINUTE = 200  # Average reading speed


def count_words_in_text(text: str) -> int:
    """Count words in a string, stripping markdown/latex artifacts."""
    if not text:
        return 0
    # Remove markdown bold/italic markers
    text = re.sub(r'\*+', '', text)
    # Remove LaTeX inline math markers
    text = re.sub(r'\$', '', text)
    # Split on whitespace and count non-empty tokens
    words = [w for w in text.split() if w.strip()]
    return len(words)


def count_blocks_words(blocks: list) -> int:
    """Count total words in textbook_data.json blocks array.
    
    Blocks can have:
      - value: str (simple text)
      - value: list of {type, value} items (nested content)
    """
    total = 0
    for block in blocks:
        value = block.get("value", "")
        if isinstance(value, str):
            total += count_words_in_text(value)
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    total += count_words_in_text(item.get("value", ""))
                elif isinstance(item, str):
                    total += count_words_in_text(item)
    return total


def count_content_words(content: list) -> int:
    """Count total words in sections.json content array."""
    total = 0
    for block in content:
        value = block.get("value", "")
        if isinstance(value, str):
            total += count_words_in_text(value)
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, dict):
                    total += count_words_in_text(item.get("value", ""))
                elif isinstance(item, str):
                    total += count_words_in_text(item)
    return total


def load_json(path: Path) -> dict | list:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path: Path, data, dry_run: bool = False):
    if dry_run:
        print(f"  [DRY RUN] Would write {path}")
        return
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  ✓ Wrote {path}")


def main():
    dry_run = "--dry-run" in sys.argv

    if dry_run:
        print("=== DRY RUN MODE ===\n")

    # ─── Load data ───────────────────────────────────────────────────────────
    print("Loading data files...")
    sections = load_json(SECTIONS_FILE)
    chapters = load_json(CHAPTERS_FILE)
    textbook = load_json(TEXTBOOK_FILE)

    math_chapters = textbook.get("math", [])

    # ─── Step 1: Count words from textbook_data.json (source of truth) ──────
    print("\n[Step 1] Counting words from textbook_data.json (expanded content)...")
    # Maps: (chapter_num, section_id) -> word_count
    textbook_section_wc = {}
    chapter_totals = {}

    for ch in math_chapters:
        ch_num = ch.get("id")
        if ch_num not in TARGET_CHAPTER_NUMBERS:
            continue

        ch_total = 0
        for sec in ch.get("sections", []):
            sec_id = sec.get("id", "")
            blocks = sec.get("blocks", [])
            wc = count_blocks_words(blocks)
            key = (ch_num, sec_id)

            # Accumulate (sections can have duplicate IDs, take the max or sum first occurrence)
            if key not in textbook_section_wc:
                textbook_section_wc[key] = wc
            else:
                # If duplicate section ID, sum the word counts
                textbook_section_wc[key] += wc

            ch_total += wc

        chapter_totals[ch_num] = ch_total
        print(f"  Chapter {ch_num}: {ch_total} words total")

    # Show per-section breakdown
    for (ch_num, sec_id), wc in sorted(textbook_section_wc.items()):
        if ch_num in TARGET_CHAPTER_NUMBERS:
            print(f"    Sec {sec_id}: {wc} words")

    # ─── Step 2: Sync section word_counts into sections.json ────────────────
    print("\n[Step 2] Syncing section word_counts into sections.json...")
    updated_sections = 0
    for section in sections:
        ch_id = section.get("chapter_id", "")
        if ch_id not in TARGET_CHAPTER_IDS:
            continue

        # Extract chapter number from chapter_id (e.g., "chmath-3" -> 3)
        ch_num = int(ch_id.split("-")[-1])
        sec_num = section.get("section_number", "")
        key = (ch_num, sec_num)

        if key in textbook_section_wc:
            old_wc = section.get("word_count", 0)
            new_wc = textbook_section_wc[key]
            if old_wc != new_wc:
                print(f"  {section['id']}: {old_wc} → {new_wc} words")
                section["word_count"] = new_wc
                updated_sections += 1
            # Remove from lookup so we only match once
            del textbook_section_wc[key]

    if updated_sections == 0:
        print("  No section changes needed")
    else:
        print(f"  Updated {updated_sections} sections in sections.json")

    # ─── Step 3: Update chapters.json ───────────────────────────────────────
    print("\n[Step 3] Updating chapters.json...")
    for chapter in chapters:
        ch_id = chapter.get("id", "")
        if ch_id not in TARGET_CHAPTER_IDS:
            continue

        ch_num = chapter.get("number", "?")
        old_wc = chapter.get("word_count", 0)
        old_erm = chapter.get("estimated_read_minutes", 0)

        new_wc = chapter_totals.get(ch_num, old_wc)
        new_erm = max(1, round(new_wc / WORDS_PER_MINUTE))

        chapter["word_count"] = new_wc
        chapter["estimated_read_minutes"] = new_erm

        print(f"  Chapter {ch_num}: word_count {old_wc} → {new_wc}, "
              f"read_minutes {old_erm} → {new_erm}")

    # ─── Step 4: Recalculate textbook_data.json section word_counts ─────────
    # (Recount from actual content to ensure stored counts match)
    print("\n[Step 4] Verifying textbook_data.json section word_counts...")
    td_updates = 0
    for ch in math_chapters:
        ch_num = ch.get("id")
        if ch_num not in TARGET_CHAPTER_NUMBERS:
            continue
        for sec in ch.get("sections", []):
            blocks = sec.get("blocks", [])
            actual_wc = count_blocks_words(blocks)
            stored_wc = sec.get("word_count", 0)
            if actual_wc != stored_wc:
                print(f"  Ch{ch_num} Sec{sec['id']}: {stored_wc} → {actual_wc} words")
                sec["word_count"] = actual_wc
                td_updates += 1

    if td_updates == 0:
        print("  All textbook_data.json section word_counts are accurate")
    else:
        print(f"  Corrected {td_updates} sections in textbook_data.json")

    # ─── Step 5: Write files ────────────────────────────────────────────────
    print("\n[Step 5] Writing updated files...")
    save_json(SECTIONS_FILE, sections, dry_run)
    save_json(CHAPTERS_FILE, chapters, dry_run)
    save_json(TEXTBOOK_FILE, textbook, dry_run)

    # ─── Summary ─────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for ch_num in TARGET_CHAPTER_NUMBERS:
        wc = chapter_totals.get(ch_num, 0)
        erm = max(1, round(wc / WORDS_PER_MINUTE))
        print(f"  Chapter {ch_num}: {wc} words, ~{erm} min read")
    print("=" * 60)

    if dry_run:
        print("\n(No files were modified — dry run)")
    else:
        print("\n✅ All files updated successfully.")


if __name__ == "__main__":
    main()
