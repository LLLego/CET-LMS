#!/usr/bin/env python3
"""
Question generator v2 — produces understanding-based questions with plausible distractors.
Pulls distractors from same-subject definitions (not generic templates).
Target: 40-60 questions per chapter across 3 difficulty levels.
"""
import json
import random
import re
import hashlib

random.seed(42)

# ─── Load data ───
with open('data/textbook_data.json') as f:
    textbook = json.load(f)

with open('data/quiz_data.json') as f:
    existing = json.load(f)

# ─── Extract structured content from textbook ───
def extract_concepts(chapter):
    """Extract definitions, examples, formulas, and key facts from a chapter."""
    definitions = []
    examples = []
    formulas = []
    facts = []
    
    for sec in chapter.get('sections', []):
        sec_title = sec.get('title', '')
        for block in sec.get('blocks', []):
            btype = block.get('type', '')
            if btype == 'definition':
                term = block.get('term', '').strip()
                value = block.get('value', '').strip()
                if term and value and len(term) > 1 and len(value) > 5:
                    definitions.append({
                        'term': term,
                        'value': value,
                        'section': sec_title,
                    })
            elif btype == 'example':
                value = block.get('value', '').strip()
                if value and len(value) > 10:
                    examples.append({'value': value, 'section': sec_title})
            elif btype == 'formula':
                value = block.get('value', '').strip()
                if value and len(value) > 2:
                    formulas.append({'value': value, 'section': sec_title})
            else:
                # Extract key facts from regular text blocks
                text = block.get('value', block.get('text', '')).strip()
                if text and len(text) > 30 and len(text) < 200:
                    # Look for factual statements
                    if any(kw in text.lower() for kw in [
                        'is called', 'is known as', 'refers to', 'means',
                        'consists of', 'composed of', 'contains',
                        'always', 'never', 'must', 'cannot',
                        'was founded', 'was established', 'first',
                        'the main', 'the primary', 'the most important',
                    ]):
                        facts.append({'content': text, 'section': sec_title})
    
    return definitions, examples, formulas, facts

# ─── Build distractor pools per subject ───
def build_distractor_pool(definitions, current_term):
    """Get plausible distractors from other definitions in same subject."""
    pool = [d['value'] for d in definitions if d['term'].lower() != current_term.lower()]
    random.shuffle(pool)
    return pool

def pick_distractors(pool, correct, count=3, min_len_ratio=0.4, max_len_ratio=2.5):
    """Pick distractors that are similar length to correct answer."""
    correct_len = len(correct)
    good = []
    for item in pool:
        ratio = len(item) / max(correct_len, 1)
        if min_len_ratio <= ratio <= max_len_ratio and item != correct:
            good.append(item)
        if len(good) >= count * 3:  # Over-collect for variety
            break
    
    if len(good) < count:
        # Relax length constraint
        good = [item for item in pool if item != correct][:count * 2]
    
    random.shuffle(good)
    return good[:count]

# ─── Question generators ───

def make_definition_recall(definition, distractor_pool, difficulty):
    """'What is X?' — but with real distractors from same subject."""
    term = definition['term']
    value = definition['value']
    
    if len(value) > 150:
        return None  # Too long for an option
    
    distractors = pick_distractors(distractor_pool, value)
    if len(distractors) < 3:
        return None
    
    if difficulty == 'easy':
        q = f"What is {term}?"
    elif difficulty == 'medium':
        q = f"Which of the following correctly defines '{term}'?"
    else:
        q = f"Among the choices, which accurately describes '{term}'?"
    
    opts = [value] + distractors[:3]
    random.shuffle(opts)
    
    return {
        'q': q,
        'opts': opts,
        'ans': opts.index(value),
        'difficulty': difficulty,
        'explanation': f"{term} is defined as: {value}",
    }

def make_fill_blank(definition, distractor_pool, difficulty):
    """'____ is defined as [definition]. What fills the blank?'"""
    term = definition['term']
    value = definition['value']
    
    if len(term) > 40 or len(value) < 15:
        return None
    
    # Pick distractors: other terms from same subject
    other_terms = [d['term'] for d in distractor_pool if d['term'].lower() != term.lower()]
    random.shuffle(other_terms)
    if len(other_terms) < 3:
        return None
    
    distractors = other_terms[:3]
    
    if difficulty == 'easy':
        q = f"'{value[:80]}{'...' if len(value) > 80 else ''}' — What term is being described?"
    elif difficulty == 'medium':
        q = f"Complete: ___ is defined as '{value[:80]}{'...' if len(value) > 80 else ''}'"
    else:
        q = f"Which term matches this description: '{value[:80]}{'...' if len(value) > 80 else ''}'?"
    
    opts = [term] + distractors
    random.shuffle(opts)
    
    return {
        'q': q,
        'opts': opts,
        'ans': opts.index(term),
        'difficulty': difficulty,
        'explanation': f"'{term}' is defined as: {value}",
    }

def make_application(definition, all_definitions, difficulty):
    """Application: 'Which of the following is an example of X?'"""
    term = definition['term']
    value = definition['value']
    
    # Find other definitions that could be confused
    related = [d for d in all_definitions if d['term'].lower() != term.lower()]
    if len(related) < 3:
        return None
    
    random.shuffle(related)
    
    if difficulty == 'easy':
        q = f"Which of the following is an example of {term}?"
        # Correct: restate the definition in example form
        correct = f"{term}: {value[:60]}{'...' if len(value) > 60 else ''}"
        distractors = [f"{r['term']}: {r['value'][:60]}{'...' if len(r['value']) > 60 else ''}" for r in related[:3]]
    elif difficulty == 'medium':
        q = f"A student encounters '{value[:50]}...' — which concept does this illustrate?"
        correct = term
        distractors = [r['term'] for r in related[:3]]
    else:
        q = f"Which concept is best illustrated by the following: '{value[:60]}{'...' if len(value) > 60 else ''}'?"
        correct = term
        distractors = [r['term'] for r in related[:3]]
    
    if len(distractors) < 3:
        return None
    
    opts = [correct] + distractors[:3]
    random.shuffle(opts)
    
    return {
        'q': q,
        'opts': opts,
        'ans': opts.index(correct),
        'difficulty': difficulty,
        'explanation': f"This describes {term}: {value}",
    }

def make_which_is_not(definition, all_definitions, difficulty):
    """'Which of the following is NOT a characteristic of X?'"""
    term = definition['term']
    value = definition['value']
    
    related = [d for d in all_definitions if d['term'].lower() != term.lower()]
    if len(related) < 1:
        return None
    
    # The correct answer (NOT X) comes from a different concept
    not_x = random.choice(related)
    
    if difficulty == 'easy':
        q = f"Which of the following is NOT related to {term}?"
        correct = f"{not_x['term']}: {not_x['value'][:60]}"
        distractors = [
            f"A characteristic of {term}",
            f"Part of the definition of {term}",
            f"Commonly associated with {term}",
        ]
    elif difficulty == 'medium':
        q = f"Which statement does NOT accurately describe {term}?"
        correct = f"{not_x['value'][:80]}"
        distractors = [
            value[:80],
            f"{term} is commonly used in this context",
            f"This relates to the core meaning of {term}",
        ]
    else:
        q = f"All of the following are true about {term} EXCEPT:"
        correct = f"{not_x['value'][:80]}"
        distractors = [
            value[:80],
            f"{term} is defined in the context of {definition.get('section', 'this topic')}",
            f"The concept of {term} is fundamental to understanding this chapter",
        ]
    
    opts = [correct] + distractors[:3]
    random.shuffle(opts)
    
    return {
        'q': q,
        'opts': opts,
        'ans': opts.index(correct),
        'difficulty': difficulty,
        'explanation': f"{not_x['term']} is a separate concept. {term} is defined as: {value}",
    }

def make_formula_question(formula, all_formulas, difficulty):
    """Questions about formulas."""
    value = formula['value']
    
    if len(value) > 120 or len(value) < 5:
        return None
    
    other_formulas = [f['value'] for f in all_formulas if f['value'] != value]
    random.shuffle(other_formulas)
    if len(other_formulas) < 3:
        return None
    
    distractors = other_formulas[:3]
    
    if difficulty == 'easy':
        q = f"Which of the following is the correct formula or rule?"
        correct = value
    elif difficulty == 'medium':
        q = f"A student needs to apply a formula. Which one is correct?"
        correct = value
    else:
        q = f"Which formula or mathematical statement is accurate?"
        correct = value
    
    opts = [correct] + distractors
    random.shuffle(opts)
    
    return {
        'q': q,
        'opts': opts,
        'ans': opts.index(correct),
        'difficulty': difficulty,
        'explanation': f"The correct formula/rule is: {value}",
    }

def make_example_based(example, all_definitions, difficulty):
    """Questions using examples from the textbook."""
    value = example['value']
    
    if len(value) > 150 or len(value) < 15:
        return None
    
    # Try to match this example to a definition
    matched_def = None
    for d in all_definitions:
        if d['term'].lower() in value.lower() or any(
            word in value.lower() for word in d['term'].lower().split() if len(word) > 3
        ):
            matched_def = d
            break
    
    if not matched_def:
        return None
    
    other_defs = [d for d in all_definitions if d['term'] != matched_def['term']]
    random.shuffle(other_defs)
    if len(other_defs) < 3:
        return None
    
    if difficulty == 'easy':
        q = f"The following is an example of which concept? '{value[:80]}...'"
        correct = matched_def['term']
        distractors = [d['term'] for d in other_defs[:3]]
    elif difficulty == 'medium':
        q = f"Given this example: '{value[:80]}...' — which definition applies?"
        correct = f"{matched_def['term']}: {matched_def['value'][:60]}"
        distractors = [f"{d['term']}: {d['value'][:60]}" for d in other_defs[:3]]
    else:
        q = f"A student sees this in a problem: '{value[:80]}...' — what concept should they identify?"
        correct = matched_def['term']
        distractors = [d['term'] for d in other_defs[:3]]
    
    opts = [correct] + distractors[:3]
    random.shuffle(opts)
    
    return {
        'q': q,
        'opts': opts,
        'ans': opts.index(correct),
        'difficulty': difficulty,
        'explanation': f"This example illustrates {matched_def['term']}: {matched_def['value']}",
    }

# ─── Main generation ───
print("Generating questions v2...")
new_data = {}
stats = {'total_new': 0, 'total_kept': 0}

for subject, chapters in textbook.items():
    new_data[subject] = {}
    
    # Build subject-level definition pool for distractors
    all_subj_defs = []
    all_subj_formulas = []
    all_subj_examples = []
    for ch in chapters:
        defs, exs, fmrs, _ = extract_concepts(ch)
        all_subj_defs.extend(defs)
        all_subj_formulas.extend(fmrs)
        all_subj_examples.extend(exs)
    
    for chapter in chapters:
        ch_id = f"ch{subject}-{chapter['id']}"
        defs, examples, formulas, facts = extract_concepts(chapter)
        
        # Keep existing good questions
        existing_qs = []
        if subject in existing and ch_id in existing[subject]:
            existing_qs = existing[subject][ch_id].get('quizzes', [])
        
        existing_count = len(existing_qs)
        
        # Generate new questions
        new_questions = []
        
        # Distractor pool: definitions from OTHER chapters in same subject
        other_defs = [d for d in all_subj_defs if d not in defs]
        chapter_distractor_pool = defs + other_defs
        
        for diff in ['easy', 'medium', 'hard']:
            # Definition recall questions
            for d in defs:
                q = make_definition_recall(d, chapter_distractor_pool, diff)
                if q and not any(q['q'] == eq['q'] for eq in existing_qs + new_questions):
                    new_questions.append(q)
            
            # Fill-in-the-blank questions
            for d in defs:
                q = make_fill_blank(d, defs, diff)
                if q and not any(q['q'] == eq['q'] for eq in existing_qs + new_questions):
                    new_questions.append(q)
            
            # Application questions
            for d in defs:
                q = make_application(d, all_subj_defs, diff)
                if q and not any(q['q'] == eq['q'] for eq in existing_qs + new_questions):
                    new_questions.append(q)
            
            # Which-is-NOT questions
            for d in defs:
                q = make_which_is_not(d, all_subj_defs, diff)
                if q and not any(q['q'] == eq['q'] for eq in existing_qs + new_questions):
                    new_questions.append(q)
            
            # Formula questions
            for f in formulas:
                q = make_formula_question(f, all_subj_formulas, diff)
                if q and not any(q['q'] == eq['q'] for eq in existing_qs + new_questions):
                    new_questions.append(q)
            
            # Example-based questions
            for ex in examples:
                q = make_example_based(ex, all_subj_defs, diff)
                if q and not any(q['q'] == eq['q'] for eq in existing_qs + new_questions):
                    new_questions.append(q)
        
        # Merge existing + new
        all_qs = existing_qs + new_questions
        
        # Deduplicate
        seen = set()
        unique = []
        for q in all_qs:
            key = q.get('q', '').strip()
            if key and key not in seen:
                seen.add(key)
                unique.append(q)
        
        new_data[subject][ch_id] = {
            'name': chapter.get('title', ch_id),
            'quizzes': unique,
        }
        
        stats['total_new'] += len(new_questions)
        stats['total_kept'] += existing_count
        
        diff_counts = {}
        for q in unique:
            d = q.get('difficulty', 'unknown')
            diff_counts[d] = diff_counts.get(d, 0) + 1
        
        print(f"  {subject}/{ch_id}: {len(unique)} total ({existing_count} existing + {len(new_questions)} new) {diff_counts}")

# ─── Save ───
with open('data/quiz_data.json', 'w') as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

# ─── Summary ───
total_final = sum(
    len(ch['quizzes'])
    for subj in new_data.values()
    for ch in subj.values()
)
print(f"\n=== SUMMARY ===")
print(f"Existing questions kept: {stats['total_kept']}")
print(f"New questions generated: {stats['total_new']}")
print(f"Total after merge: {total_final}")
print(f"\nSaved to data/quiz_data.json")
