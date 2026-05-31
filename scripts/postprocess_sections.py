#!/usr/bin/env python3
"""
Post-process extracted sections.json to fix:
1. Mark sub-headings BEFORE merging
2. Merge sentence fragments into proper paragraphs
3. Deduplicate definition terms in values
4. Merge standalone "Examples"/"Note" headers with next block
5. Reorder sections within chapters by section_number

Run: python3 scripts/postprocess_sections.py
"""

import json
import re
import shutil
from pathlib import Path
from collections import defaultdict

DATA_DIR = Path(__file__).parent.parent / "data" / "extracted"
SECTIONS_FILE = DATA_DIR / "sections.json"


def is_sentence_fragment(text):
    """Check if text ends mid-sentence."""
    text = text.strip()
    if not text:
        return False
    return text[-1] not in '.!?:;…—)]"\''


def is_heading_candidate(text):
    """Check if a text line looks like a sub-heading."""
    text = text.strip()
    if not text or len(text) > 70 or len(text) < 8:
        return False
    if text[0].isupper() and text[-1] not in '.!?:;,':
        lower = text.lower()
        skip_first = ['the', 'a', 'an', 'and', 'but', 'or', 'so', 'yet', 'for', 'nor',
                       'in', 'on', 'at', 'to', 'of', 'with', 'by', 'from', 'as', 'into',
                       'if', 'when', 'while', 'because', 'since', 'although', 'unless',
                       'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
                       'we', 'you', 'he', 'she', 'his', 'her', 'our', 'your',
                       'vs', 'e.g', 'i.e', 'note', 'tip', 'hint', 'let', 'now',
                       'here', 'there', 'just', 'also', 'still', 'even', 'not',
                       'which', 'what', 'who', 'how', 'why', 'every', 'each',
                       'property', 'details', 'key', 'famous']
        first_word = lower.split()[0].rstrip('.')
        if first_word in skip_first:
            return False
        words = text.split()
        if 2 <= len(words) <= 8:
            capitalized = sum(1 for w in words if w[0].isupper() or w in ('—', '-', '(', '&', '×', '÷'))
            if capitalized / len(words) > 0.6:
                return True
        if len(words) <= 4 and len(text) < 35:
            return True
    return False


def mark_headings_first(blocks):
    """Mark heading candidates before any merging."""
    for block in blocks:
        if block['type'] == 'text':
            val = block.get('value', '').strip()
            if is_heading_candidate(val):
                block['_is_heading'] = True
    return blocks


def merge_fragments(blocks):
    """Merge consecutive text blocks that are sentence fragments."""
    if not blocks:
        return blocks
    
    merged = [blocks[0]]
    
    for block in blocks[1:]:
        prev = merged[-1]
        
        # Don't merge into headings
        if prev.get('_is_heading'):
            merged.append(block)
            continue
        
        # Don't merge headings into anything
        if block.get('_is_heading'):
            merged.append(block)
            continue
        
        # Merge consecutive text fragments
        if block['type'] == 'text' and prev['type'] == 'text':
            prev_val = prev.get('value', '').strip()
            curr_val = block.get('value', '').strip()
            
            if prev_val and curr_val and is_sentence_fragment(prev_val):
                prev['value'] = prev_val + ' ' + curr_val
                continue
        
        merged.append(block)
    
    return merged


def finalize_headings(blocks):
    """Convert marked heading candidates to heading type."""
    for block in blocks:
        if block.get('_is_heading'):
            block['type'] = 'heading'
            del block['_is_heading']
        elif '_is_heading' in block:
            del block['_is_heading']
    return blocks


def fix_false_positive_definitions(blocks):
    """Convert false-positive definitions back to text."""
    result = []
    for block in blocks:
        if block['type'] == 'definition':
            term = block.get('term', '').strip()
            value = block.get('value', '').strip()
            
            # False positive if term is too long
            if len(term.split()) > 6:
                combined = f'{term}: {value}' if value else term
                result.append({'type': 'text', 'value': combined})
                continue
            
            # False positive if term starts with conjunction/preposition
            first = term.split()[0].lower() if term.split() else ''
            if first in ('and', 'but', 'or', 'so', 'yet', 'for', 'nor', 'vs',
                         'because', 'since', 'although', 'when', 'while', 'if',
                         'just', 'also', 'still', 'even', 'here', 'there', 'now',
                         'which', 'what', 'who', 'how', 'why', 'every', 'each',
                         'property', 'details', 'key', 'famous'):
                combined = f'{term}: {value}' if value else term
                result.append({'type': 'text', 'value': combined})
                continue
            
            # False positive if term is a table cell fragment
            if term in ('What they', 'Why they exist', 'Key rule', 'Famous ones',
                       'Property Details', 'Details', 'Example', 'What they are'):
                combined = f'{term}: {value}' if value else term
                result.append({'type': 'text', 'value': combined})
                continue
        
        result.append(block)
    
    return result


def deduplicate_definitions(blocks):
    """Remove the duplicated term from definition values."""
    for block in blocks:
        if block['type'] == 'definition':
            term = block.get('term', '').strip()
            value = block.get('value', '').strip()
            if term and value.startswith(term):
                remainder = value[len(term):].lstrip(': ')
                if remainder:
                    block['value'] = remainder
    return blocks


def merge_standalone_headers(blocks):
    """Merge standalone 'Examples', 'Note', 'Tip' headers with next block."""
    if not blocks:
        return blocks
    
    result = []
    i = 0
    while i < len(blocks):
        block = blocks[i]
        val = block.get('value', '').strip()
        
        # Check if this is a standalone header with no real content
        if block['type'] in ('example', 'note', 'tip') and len(val) < 15:
            if i + 1 < len(blocks):
                next_block = blocks[i + 1]
                next_val = next_block.get('value', '').strip()
                merged_val = f"{val}: {next_val}" if next_val else val
                result.append({'type': block['type'], 'value': merged_val})
                i += 2
                continue
        
        result.append(block)
        i += 1
    
    return result


def process_section(section):
    """Process a single section's content blocks."""
    blocks = section.get('content', [])
    if not blocks:
        return section
    
    # Step 0: Mark headings FIRST (before merging eats them)
    blocks = mark_headings_first(blocks)
    
    # Step 1: Merge sentence fragments (respects heading marks)
    blocks = merge_fragments(blocks)
    
    # Step 2: Finalize heading markers
    blocks = finalize_headings(blocks)
    
    # Step 3: Fix false-positive definitions
    blocks = fix_false_positive_definitions(blocks)
    
    # Step 4: Deduplicate remaining definitions
    blocks = deduplicate_definitions(blocks)
    
    # Step 5: Merge standalone headers
    blocks = merge_standalone_headers(blocks)
    
    # Step 6: Clean up empty blocks
    blocks = [b for b in blocks if (b.get('value', '') or b.get('term', ''))]
    
    section['content'] = blocks
    return section


def main():
    if not SECTIONS_FILE.exists():
        print(f"Error: {SECTIONS_FILE} not found")
        return
    
    # Backup
    backup_file = SECTIONS_FILE.with_suffix('.json.pre_merge_bak')
    if not backup_file.exists():
        shutil.copy2(SECTIONS_FILE, backup_file)
        print(f"Backed up to {backup_file}")
    
    with open(SECTIONS_FILE) as f:
        sections = json.load(f)
    
    print(f"Processing {len(sections)} sections...")
    
    total_before = sum(len(s.get('content', [])) for s in sections)
    
    for section in sections:
        process_section(section)
    
    total_after = sum(len(s.get('content', [])) for s in sections)
    print(f"Blocks: {total_before} → {total_after} ({total_before - total_after} removed, {((total_before - total_after) / total_before * 100):.0f}% reduction)")
    
    # Sort sections within each chapter
    by_chapter = defaultdict(list)
    for s in sections:
        by_chapter[s['chapter_id']].append(s)
    
    sorted_sections = []
    for ch_id in sorted(by_chapter.keys()):
        ch_sections = sorted(by_chapter[ch_id], key=lambda s: s.get('section_number', ''))
        sorted_sections.extend(ch_sections)
    
    # Recalculate word counts
    for section in sorted_sections:
        blocks = section.get('content', [])
        words = sum(len((b.get('value', '') or '').split()) for b in blocks)
        section['word_count'] = words
    
    with open(SECTIONS_FILE, 'w') as f:
        json.dump(sorted_sections, f, indent=2, ensure_ascii=False)
    
    print(f"Saved to {SECTIONS_FILE}")
    
    # Show stats
    type_counts = defaultdict(int)
    for s in sorted_sections:
        for b in s.get('content', []):
            type_counts[b.get('type', '?')] += 1
    print(f"\nBlock type counts:")
    for t, c in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {c}")
    
    # Show sample of math section 1.1
    ch1 = [s for s in sorted_sections if s.get('chapter_id') == 'chmath-1']
    if ch1:
        ch1.sort(key=lambda s: s.get('section_number', ''))
        sec = ch1[0]
        blocks = sec.get('content', [])
        print(f"\nSample — {sec['title']} ({len(blocks)} blocks):")
        for i, b in enumerate(blocks[:20]):
            btype = b.get('type', '?')
            val = (b.get('value', '') or '')[:100]
            term = b.get('term', '')
            prefix = f'TERM:[{term}] ' if term else ''
            print(f"  [{i}] {btype}: {prefix}{val}")


if __name__ == '__main__':
    main()
