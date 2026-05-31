# CET LMS — Complete Rebuild Specification (v2)

> **Design DNA:** Notion's clean minimalism × Duolingo's playful engagement
> **Core Innovation:** PDF content extraction pipeline → real textbook content powers everything
> **Tech:** Pure vanilla JS modules + CSS custom properties + Web Audio API

---

## Overview

Build a premium Learning Management System for CET (College Entrance Test) review. This combines **Notion's typographic clarity, generous whitespace, soft borders, and muted neutrals** with **Duolingo's vibrant accent colors, satisfying micro-animations, gamified streaks, and celebratory feedback loops**.

The app is powered by real content — 8 V12 textbook PDFs (605 pages across 8 subjects, located at `Documents/CET/V12_Deliverables/`) extracted into structured JSON that drives the textbook reader, contextual quizzes, auto-generated flashcards, and full-text search.

**Project Location:** `F:\Projects\cet_app\`

### Core Requirements

1. **Modular architecture** — Separate files for CSS, JS modules, and JSON data. No single-file monoliths.
2. **No build tools** — Pure vanilla JS with ES modules (`type="module"`), import maps, CSS custom properties. Must work via any static server (python -m http.server, live-server, npx serve).
3. **Notion × Duolingo design** — Clean, minimal, typographically rich + vibrant, playful, gamified.
4. **Fully responsive** — Desktop-first with flawless tablet and mobile experience.
5. **Light/Dark toggle** — Smooth CSS transition, respects system preference on first visit.
6. **Sound effects** — Web Audio API for procedural chimes, no audio files required.
7. **Offline-capable** — All data persists via localStorage with migration support.

---

## Table of Contents

1. [File Structure](#part-1-file-structure)
2. [Content Extraction Pipeline](#part-2-content-extraction-pipeline)
3. [Design System — Notion × Duolingo](#part-3-design-system--notion--duolingo)
4. [Component Specifications](#part-4-component-specifications)
5. [Page Specifications](#part-5-page-specifications)
6. [Sound System](#part-6-sound-system-jsaudiojs)
7. [Gamification & XP System](#part-7-gamification--xp-system)
8. [Achievement System](#part-8-achievement-system)
9. [Theme System](#part-9-theme-system-jsthemes)
10. [Router](#part-10-router-jsrouterjs)
11. [Keyboard Shortcuts](#part-11-keyboard-shortcuts)
12. [Responsive Breakpoints](#part-12-responsive-breakpoints)
13. [Accessibility](#part-13-accessibility)
14. [Build Order](#part-14-build-order)

---

## Part 1: File Structure

```
F:\Projects\cet_app\
├── index.html                        # Entry point — minimal shell + import map
├── manifest.json                     # PWA manifest (optional, for installability)
│
├── css/
│   ├── reset.css                     # Modern CSS reset (Josh Comeau or Andy Bell)
│   ├── variables.css                 # Design tokens — ALL colors, spacing, radii, shadows
│   ├── typography.css                # Font faces, sizes, weights, line heights
│   ├── layout.css                    # App shell grid, sidebar + main content
│   ├── components.css                # Reusable: buttons, cards, inputs, badges, toasts, modals
│   ├── animations.css                # All keyframe definitions + transition presets
│   ├── utilities.css                 # Helper classes (sr-only, truncate, etc.)
│   │
│   └── pages/
│       ├── dashboard.css
│       ├── subjects.css
│       ├── reader.css                # Textbook reader — long-form reading styles
│       ├── quiz.css
│       ├── flashcards.css
│       ├── timer.css
│       └── progress.css
│
├── js/
│   ├── app.js                        # Entry point — init store, router, theme, audio
│   ├── router.js                     # Hash-based SPA router with page transitions
│   ├── store.js                      # Reactive state management (Proxy-based)
│   ├── db.js                         # localStorage abstraction layer + data migration
│   ├── audio.js                      # Web Audio API — procedural sound effects
│   ├── utils.js                      # Debounce, throttle, shuffle, formatDate, etc.
│   ├── theme.js                      # Light/dark mode manager
│   │
│   ├── components/
│   │   ├── Sidebar.js                # Navigation sidebar + bottom tabs (mobile)
│   │   ├── StatsCard.js              # Animated counter (counts up on enter)
│   │   ├── SubjectCard.js            # Subject card with SVG progress ring
│   │   ├── ProgressRing.js           # Reusable SVG circular progress (stroke-dasharray)
│   │   ├── QuizQuestion.js           # Duolingo-style question card + feedback animation
│   │   ├── Flashcard.js              # 3D CSS flip card with perspective transform
│   │   ├── TimerDisplay.js           # SVG circular countdown timer
│   │   ├── TextbookReader.js         # Renders extracted content as readable pages
│   │   ├── SearchOverlay.js          # Cmd+K-style command palette search
│   │   ├── Toast.js                  # Stackable toast notification system
│   │   ├── Modal.js                  # Overlay modal with backdrop blur
│   │   ├── AchievementToast.js       # Celebration toast with sparkle animation
│   │   ├── StreakDisplay.js          # Flame-animated streak counter
│   │   ├── XPBar.js                  # XP progress bar with level badge
│   │   └── ActivityHeatmap.js        # GitHub-style 365-day activity grid
│   │
│   └── pages/
│       ├── DashboardPage.js          # Dashboard controller
│       ├── SubjectsPage.js           # Subject grid controller
│       ├── SubjectDetailPage.js      # Chapter list + progress per subject
│       ├── ReaderPage.js             # Textbook reading mode controller
│       ├── QuizPage.js               # Quiz engine controller
│       ├── FlashcardsPage.js         # Flashcard deck controller
│       ├── TimerPage.js              # Study timer controller
│       └── ProgressPage.js           # Statistics + achievements controller
│
├── data/
│   ├── extracted/                    # GENERATED by Python pipeline — do not edit manually
│   │   ├── subjects.json
│   │   ├── chapters.json
│   │   ├── sections.json
│   │   ├── questions.json
│   │   └── flashcards.json
│   │
│   └── curated/                      # Hand-written data — edit freely
│       ├── achievements.json
│       └── settings-defaults.json
│
├── scripts/
│   ├── extract_pdf_content.py        # Main PDF → structured JSON pipeline
│   ├── extract_questions.py          # NLP-based question generation from text
│   ├── extract_flashcards.py         # Key term extraction
│   └── requirements.txt              # PyMuPDF, nltk, etc.
│
├── assets/
│   ├── icons/                        # SVG icon set (lucide-style, 1.5px stroke)
│   └── fonts/                        # Inter variable font (self-hosted woff2)
│
└── CET_LMS_BUILD_PROMPT.md           # This file — the build specification
```

---

## Part 2: Content Extraction Pipeline

### 2.1 Purpose

This pipeline transforms 8 PDF textbooks into structured JSON that the web app consumes. **This is the core innovation** — it makes the app a real study tool with actual textbook content, not a generic quiz app.

### 2.2 Input

8 PDFs in `Documents/CET/V12_Deliverables/`:

| PDF | Pages | Chapters |
|-----|-------|----------|
| `CET_Math_V12.pdf` | 192 | 1–9 |
| `CET_Science_V12.pdf` | 93 | 10–16 |
| `CET_English_V12.pdf` | 102 | 17–24 |
| `CET_Filipino_V12.pdf` | 37 | 25–29 |
| `CET_Abstract_V12.pdf` | 50 | 30–34 |
| `CET_GenInfo_V12.pdf` | 70 | 35–41 |
| `CET_ExamSpecific_V12.pdf` | 32 | 42–44 |
| `CET_Specialized_V12.pdf` | 29 | 45–47 |
| **TOTAL** | **605 pages** | **47 chapters** |

### 2.3 Python Script: extract_pdf_content.py

```python
"""
CET PDF Content Extraction Pipeline
====================================
Input:  8 PDFs from Documents/CET/V12_Deliverables/
Output: Structured JSON in data/extracted/
Deps:   pip install pymupdf nltk

Usage:  python scripts/extract_pdf_content.py
"""

import json, os, re
import fitz  # PyMuPDF

PDF_DIR = "Documents/CET/V12_Deliverables"
OUT_DIR = "data/extracted"
SUBJECTS = [
    {"id": "math",       "name": "Mathematics",        "file": "CET_Math_V12.pdf",       "chapters": (1, 9)},
    {"id": "science",    "name": "Science",            "file": "CET_Science_V12.pdf",    "chapters": (10, 16)},
    {"id": "english",    "name": "English",            "file": "CET_English_V12.pdf",    "chapters": (17, 24)},
    {"id": "filipino",   "name": "Filipino",           "file": "CET_Filipino_V12.pdf",   "chapters": (25, 29)},
    {"id": "abstract",   "name": "Abstract Reasoning", "file": "CET_Abstract_V12.pdf",   "chapters": (30, 34)},
    {"id": "geninfo",    "name": "General Information", "file": "CET_GenInfo_V12.pdf",   "chapters": (35, 41)},
    {"id": "examspec",   "name": "Exam-Specific",      "file": "CET_ExamSpecific_V12.pdf", "chapters": (42, 44)},
    {"id": "specialized","name": "Specialized Topics",  "file": "CET_Specialized_V12.pdf", "chapters": (45, 47)},
]


def extract_text_from_pdf(pdf_path):
    """Extract all text from a PDF, preserving page numbers."""
    doc = fitz.open(pdf_path)
    pages = []
    for page_num, page in enumerate(doc, 1):
        text = page.get_text("text")
        pages.append({"page": page_num, "text": text.strip()})
    doc.close()
    return pages


def detect_chapters(pages):
    """Detect chapter boundaries using patterns like 'Chapter X', 'Ch. X', etc."""
    chapter_pattern = re.compile(r'(?:Chapter|Ch\.?)\s*(\d+)', re.IGNORECASE)
    chapters = []
    current_chapter = None
    
    for page in pages:
        lines = page["text"].split("\n")
        for line in lines:
            match = chapter_pattern.search(line)
            if match:
                num = int(match.group(1))
                title = line.strip()
                if current_chapter:
                    current_chapter["end_page"] = page["page"] - 1
                current_chapter = {
                    "number": num,
                    "title": title,
                    "start_page": page["page"],
                    "end_page": None,
                    "sections": [],
                    "key_terms": [],
                    "content_blocks": []
                }
                chapters.append(current_chapter)
            elif current_chapter:
                # Detect sections (numbered subsections like 1.1, 1.2)
                section_match = re.match(r'^\s*(\d+\.\d+)\s+(.+)$', line)
                if section_match:
                    current_chapter["sections"].append({
                        "number": section_match.group(1),
                        "title": section_match.group(2).strip(),
                        "page": page["page"],
                        "content": []
                    })
    
    if current_chapter:
        current_chapter["end_page"] = pages[-1]["page"]
    
    return chapters


def extract_key_terms(text):
    """Extract potential key terms (bold text markers, defined terms)."""
    # Look for patterns like "Term — definition" or "Term is..."
    term_patterns = [
        r'([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s*(?:—|–|-|is|are|refers to)\s',
        r'called\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)',
    ]
    terms = []
    for pattern in term_patterns:
        matches = re.findall(pattern, text)
        terms.extend(matches)
    return list(set(terms))


def build_question(text, chapter_num, section_num):
    """
    Generate multiple-choice questions from textbook content.
    Uses heuristics:
    - Sentences with numbers → convert to "How many/What is" questions
    - Definitions → convert to "Which term" questions
    - Statements of fact → convert to "Which is true" questions
    """
    questions = []
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    for i, sent in enumerate(sentences):
        sent = sent.strip()
        if not sent or len(sent) < 30:
            continue
        
        # Check if this looks like a testable statement
        has_number = bool(re.search(r'\d+', sent))
        has_definition = any(w in sent.lower() for w in ['is called', 'refers to', 'is defined as', 'means'])
        is_list_item = sent.startswith('-') or sent.startswith('•')
        
        if has_definition and len(sent) < 200:
            # Extract the term being defined
            term_match = re.match(r'^([A-Z][^,]+?)\s+(?:is|are|refers to)', sent)
            if term_match:
                term = term_match.group(1).strip()
                questions.append({
                    "source_type": "auto-generated",
                    "source_sentence": sent,
                    "difficulty": "easy",
                    "type": "definition",
                    "term": term,
                    "question": f"What is the term for \"{sent.split(' is ')[-1].strip('.')}\"?",
                    "answer": term,
                })
    
    return questions


def extract_flashcard_terms(chapters):
    """Extract key terms and their definitions for flashcards."""
    flashcards = []
    for ch in chapters:
        seen_terms = set()
        for section in ch.get("sections", []):
            text = " ".join(section.get("content", []))
            terms = extract_key_terms(text)
            for term in terms:
                if term not in seen_terms and len(term) > 3:
                    seen_terms.add(term)
                    # Try to find the definition sentence
                    def_match = re.search(
                        re.escape(term) + r'\s+(?:is|are|refers to)\s+([^.!]+[.!])',
                        text
                    )
                    definition = def_match.group(1) if def_match else "See textbook chapter for definition."
                    flashcards.append({
                        "term": term,
                        "definition": definition.strip(),
                        "chapter": ch["number"],
                    })
    return flashcards


def process_all_pdfs():
    os.makedirs(OUT_DIR, exist_ok=True)
    all_subjects = []
    all_chapters = []
    all_sections = []
    all_questions = []
    all_flashcards = []
    
    for subj in SUBJECTS:
        pdf_path = os.path.join(PDF_DIR, subj["file"])
        print(f"Processing {subj['file']}...")
        
        pages = extract_text_from_pdf(pdf_path)
        chapters = detect_chapters(pages)
        
        # Extract content per chapter/section
        for ch in chapters:
            # Get text for this chapter
            ch_pages = [p for p in pages if ch["start_page"] <= p["page"] <= (ch["end_page"] or pages[-1]["page"])]
            ch_text = " ".join(p["text"] for p in ch_pages)
            
            ch_obj = {
                "id": f"ch{subj['id']}-{ch['number']}",
                "subject_id": subj["id"],
                "number": ch["number"],
                "title": ch["title"],
                "page_start": ch["start_page"],
                "page_end": ch["end_page"],
                "sections": [],
                "word_count": len(ch_text.split()),
                "estimated_read_minutes": max(1, len(ch_text.split()) // 250),
            }
            
            for section in ch.get("sections", []):
                sec_obj = {
                    "id": f"sec{subj['id']}-{ch['number']}-{section['number'].replace('.', '-')}",
                    "subject_id": subj["id"],
                    "chapter_id": ch_obj["id"],
                    "section_number": section["number"],
                    "title": section["title"],
                    "content": [],  # Populated from page text
                    "key_terms": [],
                }
                ch_obj["sections"].append(sec_obj)
                all_sections.append(sec_obj)
            
            all_chapters.append(ch_obj)
            
            # Generate questions
            qs = build_question(ch_text, ch["number"], None)
            for q in qs:
                q["subject_id"] = subj["id"]
                q["chapter_id"] = ch_obj["id"]
                all_questions.append(q)
        
        # Generate flashcards
        fcs = extract_flashcard_terms(chapters)
        for fc in fcs:
            fc["subject_id"] = subj["id"]
            all_flashcards.append(fc)
        
        all_subjects.append({
            "id": subj["id"],
            "name": subj["name"],
            "file": subj["file"],
            "page_count": len(pages),
            "chapter_count": len(chapters),
        })
    
    # Write output files
    with open(os.path.join(OUT_DIR, "subjects.json"), "w", encoding="utf-8") as f:
        json.dump(all_subjects, f, indent=2, ensure_ascii=False)
    with open(os.path.join(OUT_DIR, "chapters.json"), "w", encoding="utf-8") as f:
        json.dump(all_chapters, f, indent=2, ensure_ascii=False)
    with open(os.path.join(OUT_DIR, "sections.json"), "w", encoding="utf-8") as f:
        json.dump(all_sections, f, indent=2, ensure_ascii=False)
    with open(os.path.join(OUT_DIR, "questions.json"), "w", encoding="utf-8") as f:
        json.dump(all_questions, f, indent=2, ensure_ascii=False)
    with open(os.path.join(OUT_DIR, "flashcards.json"), "w", encoding="utf-8") as f:
        json.dump(all_flashcards, f, indent=2, ensure_ascii=False)
    
    print(f"Done! Generated {len(all_subjects)} subjects, {len(all_chapters)} chapters, "
          f"{len(all_sections)} sections, {len(all_questions)} questions, {len(all_flashcards)} flashcards")


if __name__ == "__main__":
    process_all_pdfs()
```

### 2.4 Output JSON Schemas

#### data/extracted/subjects.json
```json
[
  {
    "id": "math",
    "name": "Mathematics",
    "file": "CET_Math_V12.pdf",
    "page_count": 192,
    "chapter_count": 9,
    "emoji": "🔢",
    "color": "oklch(0.60 0.20 240)",
    "icon": "function-square"
  }
]
```

#### data/extracted/chapters.json
```json
[
  {
    "id": "chmath-1",
    "subject_id": "math",
    "number": 1,
    "title": "Chapter 1: The Language of Numbers",
    "page_start": 1,
    "page_end": 22,
    "sections": [
      {
        "number": "1.1",
        "title": "Number Systems",
        "id": "secmath-1-1-1"
      }
    ],
    "word_count": 3850,
    "estimated_read_minutes": 15
  }
]
```

#### data/extracted/sections.json
```json
[
  {
    "id": "secmath-1-1-1",
    "subject_id": "math",
    "chapter_id": "chmath-1",
    "section_number": "1.1",
    "title": "Number Systems",
    "content": [
      {"type": "text", "value": "Numbers are the foundation of mathematics..."},
      {"type": "definition", "term": "Natural Numbers", "value": "Counting numbers: 1, 2, 3, ..."},
      {"type": "example", "value": "Example 1.1: Identify the number sets for 5..."},
      {"type": "formula", "value": "a + b = b + a"}
    ],
    "key_terms": ["Natural Numbers", "Whole Numbers", "Integers", "Rational Numbers"],
    "word_count": 450
  }
]
```

#### data/extracted/questions.json
```json
[
  {
    "id": "q-auto-math-001",
    "source_type": "auto-generated",
    "subject_id": "math",
    "chapter_id": "chmath-1",
    "difficulty": "easy",
    "type": "definition",
    "question": "What is the term for \"the set of positive counting numbers 1, 2, 3, ...\"?",
    "options": [
      {"id": "a", "text": "Natural Numbers", "isCorrect": true},
      {"id": "b", "text": "Whole Numbers"},
      {"id": "c", "text": "Integers"},
      {"id": "d", "text": "Rational Numbers"}
    ],
    "explanation": "Natural numbers are the counting numbers: 1, 2, 3, ...",
    "page_ref": 3
  }
]
```

#### data/extracted/flashcards.json
```json
[
  {
    "term": "Natural Numbers",
    "definition": "The set of positive counting numbers: 1, 2, 3, ...",
    "subject_id": "math",
    "chapter_id": "chmath-1"
  }
]
```

---

## Part 3: Design System — Notion × Duolingo

### 3.1 Design Philosophy

| **Notion Influence** | **Duolingo Influence** |
|---|---|
| Clean, muted neutrals | Vibrant accent colors that pop |
| Inter typography, generous line-height | Playful micro-animations |
| Soft 4-6px border radii | Satisfying feedback (scale, bounce) |
| Generous whitespace, content-first | Gamification: streaks, XP, achievements |
| Minimal chrome, receding UI | Celebration moments (confetti on 100%) |
| Semantic color naming | Reward animations on completion |
| Subtle hover states | Progress rings with color transitions |
| Constrained-width reading | Bouncy spring easings |

### 3.2 Color Palette

```css
/* ===== LIGHT THEME (Notion-inspired warmth) ===== */
[data-theme="light"] {
  --bg: oklch(0.97 0.005 85);               /* #fbfbf9 warm white */
  --bg-surface: oklch(0.95 0.005 85);        /* #f1f1ef card bg */
  --bg-elevated: oklch(1 0 0);               /* Pure white for modals */
  --bg-hover: oklch(0.92 0.01 85);           /* Hover state */
  --border: oklch(0.88 0.01 85);             /* #e0e0de */
  --border-hover: oklch(0.80 0.01 85);       /* #cececa */
  --text: oklch(0.25 0.01 85);               /* #37352f (Notion) */
  --text-secondary: oklch(0.50 0.01 85);     /* #787774 */
  --text-tertiary: oklch(0.65 0.01 85);      /* #9b9a97 */
}

/* ===== DARK THEME (deep + warm) ===== */
[data-theme="dark"] {
  --bg: oklch(0.12 0.01 85);                 /* #1a1a17 */
  --bg-surface: oklch(0.16 0.01 85);         /* #242420 */
  --bg-elevated: oklch(0.20 0.01 85);        /* #2d2d28 */
  --bg-hover: oklch(0.24 0.01 85);
  --border: oklch(0.28 0.01 85);
  --border-hover: oklch(0.35 0.01 85);
  --text: oklch(0.92 0.01 85);
  --text-secondary: oklch(0.68 0.01 85);
  --text-tertiary: oklch(0.50 0.01 85);
}

/* ===== BRAND (both themes) ===== */
--color-primary: oklch(0.65 0.20 145);        /* Duolingo green #58CC02 */
--color-primary-hover: oklch(0.70 0.20 145);
--color-primary-active: oklch(0.60 0.20 145);
--color-primary-glow: oklch(0.65 0.20 145 / 0.15);

--color-secondary: oklch(0.60 0.18 240);      /* Duolingo feather blue */
--color-secondary-glow: oklch(0.60 0.18 240 / 0.15);

/* Feedback */
--color-success: oklch(0.65 0.22 145);
--color-success-bg: oklch(0.65 0.22 145 / 0.10);
--color-error: oklch(0.60 0.22 25);
--color-error-bg: oklch(0.60 0.22 25 / 0.10);
--color-warning: oklch(0.72 0.20 75);

/* Subject accent colors (for progress rings, cards) */
--color-math: oklch(0.60 0.18 250);           /* Blue */
--color-science: oklch(0.65 0.22 145);        /* Green */
--color-english: oklch(0.70 0.20 75);         /* Gold */
--color-filipino: oklch(0.60 0.20 15);        /* Red */
--color-abstract: oklch(0.55 0.18 290);       /* Purple */
--color-geninfo: oklch(0.60 0.16 340);        /* Pink */
--color-examspec: oklch(0.62 0.18 190);       /* Teal */
--color-specialized: oklch(0.62 0.20 55);     /* Orange */
```

### 3.3 Typography

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-serif: 'Georgia', 'Noto Serif', serif;      /* Long-form reading */
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;

/* Sizes */
--text-xs: 0.75rem;     /* 12px - labels */
--text-sm: 0.875rem;    /* 14px - secondary */
--text-base: 1rem;      /* 16px - body */
--text-lg: 1.125rem;    /* 18px - large body */
--text-xl: 1.25rem;     /* 20px - sub-headings */
--text-2xl: 1.5rem;     /* 24px - section headings */
--text-3xl: 1.875rem;   /* 30px - page titles */
--text-4xl: 2.25rem;    /* 36px - hero numbers */
--text-5xl: 3rem;       /* 48px - achievement unlocked */

--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;

--leading-tight: 1.2;
--leading-normal: 1.5;
--leading-relaxed: 1.75;  /* Textbook reading */
```

### 3.4 Spacing

```css
/* 4px base unit */
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px BASE */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```

### 3.5 Borders & Shadows

```css
--radius-sm: 4px;        /* Tags, small elements */
--radius-md: 6px;        /* Buttons, cards (Notion default) */
--radius-lg: 10px;       /* Modals, flashcards */
--radius-xl: 16px;       /* Large containers */
--radius-full: 9999px;   /* Pills, avatars */

--shadow-sm: 0 1px 2px oklch(0 0 0 / 0.04);
--shadow-md: 0 4px 12px oklch(0 0 0 / 0.06);
--shadow-lg: 0 8px 32px oklch(0 0 0 / 0.08);
--shadow-xl: 0 16px 48px oklch(0 0 0 / 0.10);
```

### 3.6 Animations & Easing

```css
/* Durations */
--duration-fast: 200ms;
--duration-normal: 350ms;
--duration-slow: 500ms;
--duration-celebrate: 800ms;

/* Easing */
--ease-snappy: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);   /* Duolingo-style */
--ease-spring: cubic-bezier(0.18, 0.89, 0.32, 1.28); /* Celebrations */
--ease-smooth: cubic-bezier(0.65, 0, 0.35, 1);

/* Required Keyframes */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
@keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
@keyframes pulseGlow { 0%,100% { box-shadow: 0 0 8px var(--color-primary-glow); } 50% { box-shadow: 0 0 20px var(--color-primary-glow); } }
@keyframes streakFire { 0%,100% { transform: scaleY(1); filter: brightness(1); } 50% { transform: scaleY(1.05); filter: brightness(1.2); } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes confettiFall { /* Particles falling from viewport top */ }
```

---

## Part 4: Component Specifications

### 4.1 Sidebar

- **Desktop:** Fixed left (260px), full viewport height, Notion-style nav
- **Tablet:** Collapses to icon-only (64px), tooltips on hover
- **Mobile:** Becomes bottom tab bar (5 icons) + overlay drawer for full nav
- **Active state:** Left accent bar (subject/accent color) + subtle background tint
- **Footer:** Streak with flame emoji, theme toggle (sun/moon icon), settings gear
- **Transitions:** Width change animated 250ms ease-snappy

### 4.2 StatsCard

- Counts up from 0 to target number when it enters viewport
- Uses `requestAnimationFrame` for smooth animation (not setInterval)
- Icon + animated number + label text
- No background color — uses Notion's border-only card approach
- Number color matches semantic meaning (green = success, blue = info, gold = streak)

### 4.3 SubjectCard

- Notion block layout: emoji icon, name, chapter count, progress ring
- **SVG Progress Ring:** stroke-dasharray + stroke-dashoffset, animated on mount
  - Uses each subject's accent color
  - < 30% = red, 30-70% = yellow, > 70% = green
- Hover: card lifts 2px (translateY), border glows with subject color
- Click: popIn animation (Duolingo bounce)
- Action button changes: "Start" (green) → "Continue" (blue) → "Review" (muted)

### 4.4 QuizQuestion (Duolingo-Style)

**The quiz experience should feel like Duolingo — satisfying, vibrant, emotionally engaging.**

**Layout:**
```
┌──────────────────────────────────────────┐
│ ✏️ Mathematics Quiz                      │
│ Question 4 of 20               12:34 left │
│ ●●●○○○○○○○  (clickable dots)             │
├──────────────────────────────────────────┤
│                                          │
│ What is the slope of a horizontal line?  │
│                                          │
│ ┌─────────────────────────────────┐      │
│ │   A    0                        │      │
│ ├─────────────────────────────────┤      │
│ │   B    1                        │      │
│ ├─────────────────────────────────┤      │
│ │   C    Undefined                │      │
│ ├─────────────────────────────────┤      │
│ │   D    Infinity                 │      │
│ └─────────────────────────────────┘      │
│                                          │
│ ─────────────────────────────────────    │
│ Hint: Think rise over run...             │
└──────────────────────────────────────────┘
```

**Interaction flow (Duolingo-inspired):**
1. Options appear with staggered fade-in (50ms delay each, top to bottom)
2. On click/hover: option border highlights with subject color, subtle background
3. **After selection (0.5s dramatic pause):**
   - **Correct:** Option turns green, checkmark SVG strokes in, card scale(1.02) pop, "Correct!" label slides down, ascending chime plays, auto-advance after 1.5s
   - **Wrong:** Option turns red, shake animation (120ms * 3), correct answer highlights green with checkmark, "Incorrect" label + explanation slides down, soft descending tone, auto-advance after 2.5s
4. Progress dots at top: unanswered = hollow, answered = filled with color, current = pulsing

### 4.5 Flashcard

- **Front:** Large centered term in text-2xl, subtle "Tap to flip" hint at bottom (text-tertiary)
- **Back:** Definition in text-base with leading-relaxed for readability
- **3D Flip:** CSS perspective on container, rotateY(180deg) on card, 400ms ease-out
- **Controls:** 4 buttons below card
  - ◀ Previous (gray) — with arrow-left icon
  - ✓ Know (green, primary color) — card animates out left, new card in from right, ascending chime
  - ⟳ Review (orange, warning color) — card out right, queued for end, descending tone
  - ▶ Next (gray) — simple next card
- **Progress bar:** Thin bar below controls, fills with subject color
- **Counter:** "Card 7 of 25 · Mathematics"
- **Keyboard:** Space = flip, ← → = navigate, K = Know, R = Review

### 4.6 TextbookReader

**The heart of the app.** Renders extracted PDF content as a beautiful reading experience.

**Layout:**
```
┌──────────────────────────────────────────────┐
│ ← Back to Subject Detail              A+ A-  │
├──────┬───────────────────────────────────────┤
│ Ch 1 │ The Language of Numbers               │
│  ├─1.1│                                       │
│  │ ███│ Numbers are the foundation of        │
│  ├─1.2│ mathematics... There are several      │
│  │   │ types of number systems that we use.   │
│  ├─1.3│                                       │
│  │   │ Natural Numbers ██████████              │
│  │   │ The set of positive counting numbers   │
│  │   │ 1, 2, 3, ...                           │
│  │   │                                       │
│      │ Example 1.1: Identify the number      │
│      │ sets for the value 5...               │
│      │ ┌───────────────────────────────┐     │
│      │ │ 📝 Test Your Understanding     │     │
│      │ │ Take a 3-question quiz on this │     │
│      │ │ section →                      │     │
│      │ └───────────────────────────────┘     │
├──────┴───────────────────────────────────────┤
│ ████████████████████████░░░░░░░  45% read    │
└──────────────────────────────────────────────┘
```

**Features:**
- Two-panel: collapsible chapter outline sidebar + reading pane
- **Content blocks** render differently: text in Inter, formulas in serif italic, examples in callout boxes (Notion gray style), definitions with inline highlight + tooltip popover on hover
- **Reading progress:** Thin bar across top, percentage counter, auto-saves position
- **Font size controls:** A+/A- buttons in toolbar, adjusts --text-base dynamically
- **Section-end quick quiz button** generates 3-5 questions from that section
- **Search within chapter:** Cmd+F overlay with highlighted results
- **Bookmark sections:** Star icon in chapter outline, saved to localStorage

### 4.7 ProgressRing

- SVG circle (viewBox="0 0 120 120")
- Background circle (stroke: var(--border), 8px width)
- Foreground circle (stroke: subject color, 8px width, stroke-dasharray/stroke-dashoffset)
- Percentage text centered inside (text-2xl, weight-bold)
- Animated on mount: stroke-dashoffset transitions from circumference to target over 800ms

### 4.8 Toast

- Slides down from top-right with bounce ease
- Icon + message text, auto-dismiss after 3s
- Stackable (up to 3 visible), older toasts pushed up
- Types: `success` (green), `error` (red), `info` (blue), `achievement` (gold + sparkle)

### 4.9 AchievementToast

- Larger, more dramatic than normal toast
- Scale-bounce entrance animation (popIn, 500ms)
- Gold/gradient background with subtle sparkle particles (CSS pseudo-elements)
- Achievement icon (large emoji), title (bold), description, XP awarded
- Auto-dismiss after 5s with gentle fade
- Plays achievement fanfare sound

### 4.10 SearchOverlay

- Cmd+K / Ctrl+K or "/" to open
- Full-screen overlay with backdrop blur (Notion cmd-palette style)
- Input field auto-focused, results update as you type (debounced 150ms)
- Results grouped: Subjects → Chapters → Sections → Questions → Flashcards
- Each result shows: subject badge, chapter title, matched text snippet with highlighted term
- Arrow keys to navigate, Enter to select, Esc to close

---

## Part 5: Page Specifications

### 5.1 Dashboard (`#dashboard`)

**Layout:**
```
┌──────────────────────────────────────────────┐
│ Welcome back, [Name]!     🔥 5-day streak    │
│ You're on a roll! Keep studying!              │
├──────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │  12  │ │  75% │ │ 168  │ │  23  │         │
│ │Streak│ │Accur.│ │Quest.│ │Sess. │         │
│ └──────┘ └──────┘ └──────┘ └──────┘         │
├──────────────────────────────────────────────┤
│ 📌 Quick Resume                               │
│ ┌─────────────────────────────────────────┐   │
│ │ Continue: Science — Question 8 of 25   │   │
│ │ You were on a roll!  🔥                │   │
│ └─────────────────────────────────────────┘   │
├──────────────────────────────────────────────┤
│ 📚 Your Subjects                              │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │  🔢  │ │  🔬  │ │  📝  │ │  🇵🇭  │         │
│ │ Math │ │ Sci  │ │ Eng  │ │ Fil  │         │
│ │ 45%  │ │ 60%  │ │ 20%  │ │ 0%   │         │
│ └──────┘ └──────┘ └──────┘ └──────┘         │
├──────────────────────────────────────────────┤
│ 📊 This Week                                  │
│ ████████████████░░░░  Mon  45m               │
│ ████████████████████  Tue  60m               │
│ ██░░░░░░░░░░░░░░░░░░  Wed  5m                │
└──────────────────────────────────────────────┘
```

- **Greeting:** Time-based ("Good morning/afternoon/evening") + user name (editable)
- **Stats row:** 4 cards with animated counters using requestAnimationFrame
- **Quick Resume:** Shows last in-progress quiz or chapter, one-click continue
- **Subject grid:** 4 subject cards with progress rings, sorted by last studied
- **Weekly chart:** CSS bar chart (7 bars, height proportional to minutes studied)

### 5.2 Subjects (`#subjects`)

- 4-column responsive grid of all 8 subjects
- Each card: emoji icon, subject name, chapter count, progress ring, action button
- Filter bar at top: text search to filter subjects
- Sorted: most progress first (to encourage completion)

### 5.3 Subject Detail (`#subject/{id}`)

- Back button + subject header (icon, name, large progress ring, stats)
- Chapter list with accordion expand/collapse
- Each chapter row: number badge, title, progress bar, "Read" button, "Quiz" button
- Chapter progress determined by: % of sections read + % of questions answered
- Sort: next unread chapter first, then by chapter number

### 5.4 Textbook Reader (`#reader/{subjectId}/{chapterId}`)

- Two-panel layout (collapsible outline + reading pane)
- Outline shows all sections with checkmarks (read) and stars (bookmarked)
- Content renders different block types with distinct styling:
  - **Text:** Inter 16px, leading-relaxed
  - **Definition:** Highlighted background, dotted underline, click for tooltip
  - **Example:** Notion gray callout box with "📝 Example" header
  - **Formula:** Georgia italic, centered if display math
  - **Practice Problem:** Sepia-toned box with "✏️ Practice" header
- Reading progress bar at top, auto-saves scroll position
- Font size controls (A+ / A-) in sticky toolbar
- "Test Your Understanding" button at section end → generates mini-quiz
- Search button (magnifying glass) opens SearchOverlay

### 5.5 Quiz Mode (`#quiz`)

**Pre-quiz screen:**
- Subject selector (styled dropdown or card grid)
- Chapter selector (optional — "All chapters" or specific)
- Mode toggle: Timed (30s per question) vs. Practice (unlimited)
- "Start Quiz" button (large, primary green)

**During quiz (Duolingo-style):**
- Question number + progress dots at top (clickable = navigable)
- Timer display (if timed mode) with color shift (green → yellow → red)
- Large question text in text-xl
- 4 answer options as large tappable cards
- Feedback animation + sound on answer
- Auto-advance (configurable delay)
- Hint button (lightbulb icon, reveals progressive hints)

**Results screen:**
```
┌──────────────────────────────────────────────┐
│ 🎉 Quiz Complete!                             │
│                                              │
│          ╭──────────────────╮                 │
│         ╱   16/20  🏆 B+    ╲                │
│        │       80%           │                │
│         ╲                  ╱                 │
│          ╰──────────────────╯                 │
│                                              │
│ Time: 8:32 · Accuracy: 80% · +45 XP  🔥     │
│                                              │
│ [Retry]  [Review Answers]  [Next Subject]    │
├──────────────────────────────────────────────┤
│ Question Review                               │
│ ✅ Q1: Correct   (Commutative Property)       │
│ ❌ Q2: Your: C · Correct: B (Slope formula)   │
│ ✅ Q3: Correct                                │
│ ...                                           │
└──────────────────────────────────────────────┘
```

- **Score ring:** SVG animated ring with letter grade inside (A: 90%+, B: 80%+, C: 70%+, D: 60%+, F: <60%)
- **Confetti:** On 100% score, CSS confetti particles animate for 2 seconds
- **XP awarded:** displayed with count-up animation
- **Review section:** expandable list of all questions with correct answers and explanations

### 5.6 Flashcards (`#flashcards`)

- Subject selector at top
- Large centered card with 3D flip animation
- Progress bar and counter below card
- Known/Review/Previous/Next buttons
- "Know" marks card as known → shown less often (spaced repetition via localStorage)
- "Review" queues card for end of session
- After deck completion: "🎉 Deck Complete! 18 Known · 7 to Review" with celebration

### 5.7 Study Timer (`#timer`)

- Large SVG circular countdown (default 25 minutes)
- Pulsing glow when running
- Focus/Break mode toggle (25min / 5min)
- Subject dropdown to tag the session
- Start/Pause/Reset controls
- Session log: today's sessions (time, subject, duration)
- Desktop notification + sound on completion
- Auto-logs to store on completion

### 5.8 Progress (`#progress`)

```
┌──────────────────────────────────────────────┐
│ 📈 Progress                                   │
│                                              │
│ ┌────────┬────────┬────────┬────────┐        │
│ │ Overall│ Questions│ Streak │ Sessions│      │
│ │  72%   │   168   │  🔥 5  │   23    │      │
│ └────────┴────────┴────────┴────────┘        │
│                                              │
│ Subject Breakdown                             │
│ 🔢 Math             45%  ████░░░░░░░░        │
│ 🔬 Science          60%  ██████░░░░░░        │
│ 📝 English          20%  ██░░░░░░░░░░        │
│ ...                                           │
│                                              │
│ Activity (past 365 days)                      │
│  [365-day heatmap grid with color intensity   │
│   by number of questions answered per day]    │
│                                              │
│ 🏆 Achievements (8 / 20 unlocked)             │
│  [🎯] [📚] [🔥] [💯] [❓] [❓]               │
│  unlocked = full color, locked = gray + "???" │
│                                              │
│ Recent Sessions                               │
│ May 20  Mathematics Quiz           15m       │
│ May 19  Science Flashcards         10m       │
│ May 18  General Info Reading       25m       │
└──────────────────────────────────────────────┘
```

- **365-day activity heatmap** — GitHub-style contribution grid
  - CSS grid of 53 columns × 7 rows
  - Color intensity: 0 = empty, 1-5 = light, 5-20 = medium, 20+ = dark
  - Scrollable horizontally, tooltip on hover showing date + count
- **Weakest subject indicator** — "⚠️ Abstract Reasoning needs attention — 0 questions answered"
- **Weekly trend** — "This week: 2.5x more than last week! 📈"
- **Data management** — Export data as JSON, clear all data (with confirmation modal)
- **Level/XP display** — Current level badge, XP bar, XP to next level

---

## Part 6: Sound System (js/audio.js)

```javascript
/**
 * Procedural sound effects using Web Audio API.
 * No audio files needed — all sounds generated at runtime.
 * Initialized on first user interaction (click/tap/keydown).
 */
const Audio = {
  ctx: null,
  muted: false,
  volume: 0.3,

  /** Initialize AudioContext on first user gesture */
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },

  /** Ensure context is running (browser policy) */
  _ensure() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.muted) return false;
    return true;
  },

  /** Play a tone with frequency, duration, waveform type, and volume envelope */
  _tone(freq, duration = 0.2, type = 'sine', vol = 0.3, attack = 0.02, release = 0.1) {
    if (!this._ensure()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + attack);
    gain.gain.setValueAtTime(vol, now + duration - release);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  },

  /** Play multiple tones simultaneously (chord) */
  _chord(freqs, duration = 0.4, type = 'sine', vol = 0.2) {
    freqs.forEach(f => this._tone(f, duration, type, vol / freqs.length));
  },

  /** Correct answer: Rising C major chord — C4, E4, G4 (happy, satisfying) */
  playCorrect() {
    this._chord([261.63, 329.63, 392.00], 0.5, 'sine', 0.3);
  },

  /** Wrong answer: Soft minor descending — E4, C4 (gentle, not punishing) */
  playIncorrect() {
    setTimeout(() => this._tone(329.63, 0.3, 'triangle', 0.2), 0);
    setTimeout(() => this._tone(261.63, 0.3, 'triangle', 0.15), 150);
  },

  /** Card flip: Quick filtered noise sweep */
  playFlip() {
    if (!this._ensure()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    
    osc.type = 'triangle';
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(500, now + 0.08);
    filter.Q.value = 2;
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    
    osc.connect(filter).connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  },

  /** Timer complete: Ascending arpeggio — C5 → E5 → G5 → C6 */
  playTimerComplete() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => this._tone(freq, 0.3, 'sine', 0.25), i * 150);
    });
  },

  /** Achievement unlocked: Bright fanfare with harmonics */
  playAchievement() {
    // C4 chord + delayed C5 melody
    this._chord([261.63, 329.63, 392.00], 0.8, 'sine', 0.25);
    setTimeout(() => this._chord([523.25, 659.25, 783.99], 0.6, 'triangle', 0.15), 300);
  },

  /** Button click: Subtle short tick */
  playClick() {
    if (!this._ensure()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  },

  /** Page transition: Soft ambient whoosh */
  playTransition() {
    if (!this._ensure()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sine';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.2);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(filter).connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  },

  /** Mute/unmute toggle */
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },

  /** Set volume (0.0 - 1.0) */
  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
  },
};
```

---

## Part 7: Gamification & XP System

### 7.1 XP Points

| Action | XP Awarded | Notes |
|--------|-----------|-------|
| Answer a question correctly | +10 XP | +5 bonus for speed (under 10s) |
| Complete a quiz | +25 XP | Bonus: +10 XP per perfect subject |
| Read a chapter section | +5 XP | Per section read |
| Complete a flashcard deck | +15 XP | |
| Study session (per 30 min) | +30 XP | Logged via timer |
| Maintain streak (per day) | +5 × streak_days | Scaling reward |
| Achievement unlocked | +50–200 XP | Varies by achievement rarity |

### 7.2 Level System

| Level | XP Required | Title |
|-------|------------|-------|
| 1 | 0 | Beginner |
| 2 | 100 | Scholar |
| 3 | 300 | Knowledge Seeker |
| 4 | 600 | Dedicated |
| 5 | 1000 | CET Warrior |
| 6 | 1500 | Honor Student |
| 7 | 2100 | Math Wizard |
| 8 | 2800 | Science Pro |
| 9 | 3600 | Quiz Master |
| 10 | 4500 | CET Champion |

Formula for level N XP required: `XP(N) = 50 × N × (N - 1)`

### 7.3 Streak System

- Streak = consecutive days with at least one study action (answer question, read chapter, study session)
- **Streak Freeze:** If streak ≥ 3 days, one missed day per 7-day streak is forgiven automatically
- **Streak milestones:** 3, 7, 14, 30, 60, 100, 365 days — each unlocks an achievement
- Visual: Flame emoji + number, fire animation intensifies with streak length
  - 1-3 days: small flame 🔥
  - 4-13 days: medium flame with glow
  - 14-29 days: large flame with pulse animation
  - 30+ days: extra large flame with sparkle particles

### 7.4 Level/XP Display (XPBar Component)

- Badge showing current level number and title
- XP progress bar (filled portion = XP earned this level, total = XP needed for next level)
- "1,200 / 1,500 XP to Level 6" text below
- Animated fill when XP is awarded (count-up animation)

---

## Part 8: Achievement System

### 8.1 Achievement Definitions

```json
[
  {
    "id": "first-quiz",
    "title": "First Steps",
    "description": "Complete your first quiz",
    "icon": "🎯",
    "xpReward": 50,
    "condition": { "type": "quizCount", "value": 1 },
    "rarity": "common"
  },
  {
    "id": "answer-50",
    "title": "Knowledge Seeker",
    "description": "Answer 50 questions total",
    "icon": "📚",
    "xpReward": 100,
    "condition": { "type": "totalAnswers", "value": 50 },
    "rarity": "common"
  },
  {
    "id": "answer-500",
    "title": "Walking Encyclopedia",
    "description": "Answer 500 questions total",
    "icon": "📖",
    "xpReward": 200,
    "condition": { "type": "totalAnswers", "value": 500 },
    "rarity": "rare"
  },
  {
    "id": "streak-7",
    "title": "Weekly Warrior",
    "description": "Maintain a 7-day study streak",
    "icon": "🔥",
    "xpReward": 100,
    "condition": { "type": "streak", "value": 7 },
    "rarity": "common"
  },
  {
    "id": "streak-30",
    "title": "Monthly Master",
    "description": "Maintain a 30-day study streak",
    "icon": "🔥",
    "xpReward": 200,
    "condition": { "type": "streak", "value": 30 },
    "rarity": "rare"
  },
  {
    "id": "streak-100",
    "title": "Century Streak",
    "description": "Maintain a 100-day study streak",
    "icon": "💎",
    "xpReward": 500,
    "condition": { "type": "streak", "value": 100 },
    "rarity": "legendary"
  },
  {
    "id": "perfect-quiz-math",
    "title": "Math Genius",
    "description": "Get 100% on a Mathematics quiz",
    "icon": "🔢",
    "xpReward": 100,
    "condition": { "type": "perfectSubject", "value": "math" },
    "rarity": "rare"
  },
  {
    "id": "perfect-quiz-all",
    "title": "Flawless Victory",
    "description": "Get 100% on every subject's quiz",
    "icon": "💯",
    "xpReward": 500,
    "condition": { "type": "allPerfectQuizzes" },
    "rarity": "legendary"
  },
  {
    "id": "complete-subject",
    "title": "Subject Master",
    "description": "Complete all questions in one subject",
    "icon": "🏆",
    "xpReward": 150,
    "condition": { "type": "subjectComplete" },
    "rarity": "rare"
  },
  {
    "id": "timer-10-hours",
    "title": "Dedicated Scholar",
    "description": "Study for 10 hours total",
    "icon": "⏱️",
    "xpReward": 150,
    "condition": { "type": "totalStudyHours", "value": 10 },
    "rarity": "rare"
  },
  {
    "id": "all-subjects-started",
    "title": "Explorer",
    "description": "Answer at least 1 question in every subject",
    "icon": "🧭",
    "xpReward": 75,
    "condition": { "type": "allSubjectsStarted" },
    "rarity": "common"
  }
]
```

### 8.2 Achievement Checking Logic

- Check achievements after every meaningful action (quiz complete, streak update, timer complete)
- Compare current state against achievement conditions
- If newly unlocked: trigger AchievementToast, play sound, award XP
- Store unlocked achievement IDs in `state.achievements.unlocked`
- Tracking progress: `state.achievements.progress[achievementId] = { current, target }`

### 8.3 Visual Presentation

- **Locked achievements:** Gray silhouette icon with "???" label, semi-transparent
- **Unlocked achievements:** Full color icon, subtle glow, unlocked date shown
- **In progress:** Shows progress bar (e.g., "42/50 questions answered")
- **Grid layout:** 4-5 columns, cards with icon, title, progress

---

## Part 9: Theme System (js/theme.js)

```javascript
const Theme = {
  current: 'dark',

  /** Get preferred theme: localStorage > system preference > dark */
  getPreferred() {
    const saved = localStorage.getItem('cet-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark'; // Default
  },

  /** Apply theme */
  set(theme) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cet-theme', theme);
    // Update toggle button icon
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  },

  /** Toggle between light and dark */
  toggle() {
    this.set(this.current === 'dark' ? 'light' : 'dark');
  },

  /** Initialize on page load */
  init() {
    this.set(this.getPreferred());
    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('cet-theme')) {
        this.set(e.matches ? 'dark' : 'light');
      }
    });
  },
};

// CSS: Add to variables.css
// * { transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease; }
// But exclude transitions on page load to avoid flash:
// .preload * { transition: none !important; }
// Remove .preload class after 100ms
```

---

## Part 10: Router (js/router.js)

```javascript
/**
 * Hash-based SPA router with page transitions.
 * Routes: #dashboard, #subjects, #subject/{id}, #reader/{subjId}/{chId},
 *          #quiz, #flashcards, #timer, #progress
 */
const Router = {
  currentPage: null,
  routes: {},

  /** Register a route handler */
  register(path, handler) {
    this.routes[path] = handler;
  },

  /** Navigate to a route */
  navigate(path, params = {}) {
    const hash = '#' + path;
    window.location.hash = hash;
  },

  /** Handle hash changes */
  _onHashChange() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const [path, ...rest] = hash.split('/');
    
    // Extract params
    const params = {};
    if (path === 'subject' && rest[0]) params.id = rest[0];
    if (path === 'reader' && rest[0]) { params.subjectId = rest[0]; params.chapterId = rest[1]; }
    
    this._transition(path, params);
  },

  /** Transition between pages with animation */
  _transition(newPath, params) {
    const currentEl = document.querySelector('.page.active');
    const handler = this.routes[newPath];
    
    if (!handler) { this.navigate('dashboard'); return; }
    
    // Fade out current page
    if (currentEl) {
      currentEl.style.opacity = '0';
      currentEl.style.transform = 'translateY(8px)';
      setTimeout(() => {
        currentEl.classList.remove('active');
        currentEl.style.opacity = '';
        currentEl.style.transform = '';
      }, 150);
    }
    
    // Render + fade in new page
    setTimeout(() => {
      handler(params);
      const newEl = document.getElementById('page-' + newPath);
      if (newEl) {
        newEl.classList.add('active');
        newEl.style.opacity = '0';
        requestAnimationFrame(() => {
          newEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
          newEl.style.opacity = '1';
          newEl.style.transform = 'translateY(0)';
        });
      }
      this.currentPage = newPath;
    }, 180);
  },

  /** Initialize */
  init() {
    window.addEventListener('hashchange', () => this._onHashChange());
    // Handle initial load
    if (!window.location.hash) window.location.hash = '#dashboard';
    this._onHashChange();
  },
};
```

---

## Part 11: Keyboard Shortcuts

| Shortcut | Context | Action |
|----------|---------|--------|
| `1` `2` `3` `4` | Quiz | Select answer A/B/C/D |
| `Enter` | Quiz | Confirm answer (submit selected option) |
| `←` / `→` | Quiz | Previous / Next question |
| `Space` | Flashcards | Flip card |
| `←` / `→` | Flashcards | Previous / Next card |
| `K` | Flashcards | Mark card as **K**nown |
| `R` | Flashcards | Mark card for **R**eview |
| `Space` | Timer | Start / Stop timer |
| `R` | Timer | **R**eset timer |
| `Cmd+K` / `Ctrl+K` | Global | Open search overlay |
| `/` | Global | Open search overlay (when not in input) |
| `Esc` | Search / Modal | Close overlay |
| `↑` `↓` | Search overlay | Navigate search results |
| `Enter` | Search overlay | Open selected result |
| `D` | Global | Toggle **D**ark/light theme |
| `M` | Global | Toggle **M**ute sound |
| `?` | Global | Show keyboard shortcuts help modal |

---

## Part 12: Responsive Breakpoints

```css
/* Desktop: > 1024px */
  /* Fixed sidebar (260px) + main content area */
  /* 4-column subject grids */
  /* Two-panel reader layout */

/* Tablet: 768px - 1024px */
  /* Collapsed sidebar (64px icons only) with tooltips */
  /* 3-column subject grids */
  /* Reader: outline collapsible, single-pane focus */

/* Mobile: < 768px */
  /* Bottom tab bar (5 icons: Dashboard, Subjects, Quiz, Timer, Progress) */
  /* Overlay drawer for full navigation */
  /* Single-column layouts */
  /* 1-column subject grid */
  /* Larger touch targets (min 44px) */
  /* Full-screen quiz cards */
  /* Reader: reading pane only, chapter outline as slide-out drawer */
```

---

## Part 13: Accessibility

- `prefers-reduced-motion` → disable all animations, keep only essential fade transitions
- `prefers-color-scheme` → set initial theme automatically
- `prefers-reduced-transparency` → reduce backdrop blur effects
- All interactive elements keyboard-focusable with visible `:focus-visible` ring (3px, primary color)
- ARIA labels on all icon-only buttons (e.g., `aria-label="Toggle dark mode"`)
- Color contrast ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18px+ bold or 24px+ regular)
- Screen reader announcements:
  - Quiz result: `aria-live="polite"` region announces "Correct!" or "Incorrect. The correct answer was B..."
  - Timer complete: `aria-live="assertive"` announces "Focus session complete! Take a 5-minute break."
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`
- Skip to main content link at top of page
- All interactive elements have visible hover + focus states

---

## Part 14: Build Order

### Phase 0: Content Pipeline (Day 1)
1. Install Python deps: `pip install pymupdf nltk`
2. Build `scripts/extract_pdf_content.py` — full extraction pipeline
3. Build `scripts/extract_questions.py` — question generator from text
4. Build `scripts/extract_flashcards.py` — key term extractor
5. Run pipeline → generate `data/extracted/*.json`
6. Verify output quality — spot-check chapters, questions, flashcards

### Phase 1: Skeleton + Shell (Day 2)
1. Create full directory structure
2. Write `index.html` — minimal shell with import map + meta tags
3. Write `css/reset.css` + `css/variables.css` + `css/typography.css` + `css/layout.css`
4. Write `js/router.js` — hash-based routing with transitions
5. Write `js/store.js` — reactive Proxy-based state
6. Write `js/db.js` — localStorage layer with versioning
7. Write `js/theme.js` — light/dark manager
8. Write `js/audio.js` — Web Audio API sound system
9. Write `js/app.js` — init all modules, mount sidebar
10. Verify: page navigation works, theme toggle works, layout responsive

### Phase 2: Design Implementation (Day 3)
1. Write `css/animations.css` — all keyframes
2. Write `css/components.css` — buttons, cards, inputs, progress rings, badges, toasts, modals
3. Write `css/utilities.css` — helper classes
4. Write sidebar component (desktop full → tablet icons → mobile tabs)
5. Implement all component JS files (Sidebar, StatsCard, SubjectCard, ProgressRing, Toast, Modal)
6. Implement responsive layout at all 3 breakpoints
7. Add `preload` class prevention for transition flash

### Phase 3: Core Features (Days 4-6)
1. **Dashboard:** Stats cards with animated counters, subject grid, weekly chart, quick resume
2. **Subjects:** 4-column grid, filter, progress rings, action buttons
3. **Subject Detail:** Chapter accordion list, per-chapter progress, Read/Quiz buttons
4. **Textbook Reader:** Two-panel layout, content rendering, reading progress, section-end quiz
5. **Quiz Engine:** Duolingo-style flow, timed/practice mode, feedback animations, sound
6. **Flashcards:** 3D flip, know/review flow, spaced repetition, progress tracking
7. **Timer:** Circular countdown, focus/break modes, session logging, notifications
8. **Progress:** Stats, subject breakdown, activity heatmap, achievements grid

### Phase 4: Gamification & Polish (Day 7)
1. Implement XP system — track all actions, award XP, level up logic
2. Implement achievement system — conditions, checking, unlock flow
3. Build AchievementToast with celebration animation + sound
4. Implement search overlay (Cmd+K)
5. Add keyboard shortcuts handler
6. Add confetti CSS animation for perfect scores
7. Add skeleton loading states to all pages
8. Add empty states to all pages
9. Test with screen reader, fix accessibility issues
10. End-to-end walkthrough of all features

---

## Final Reminders

**This is NOT a single-file HTML app.** The output must be a well-organized, modular project with proper separation of files.

| Directory | Purpose | Files |
|-----------|---------|-------|
| `scripts/` | Python content extraction | 3 files |
| `data/extracted/` | Auto-generated JSON content | 5 files |
| `css/` | Modular stylesheets | ~12 files |
| `js/` | ES module JavaScript | ~25 files |
| `assets/` | SVG icons + fonts | ~30 files |

**Design:** Every screen should feel like a premium product. Notion's clean structure provides the foundation. Duolingo's vibrant feedback and gamification provide the emotional engagement. Together they create a study tool users *want* to use daily.

**Content is the differentiator:** The PDF extraction pipeline makes this app special. Without it, it's a generic quiz app. With it, it's a complete CET study ecosystem with real textbook content, contextual quizzes, and smart study tools.

---

*End of specification. Feed this prompt into an AI coding assistant to begin development.*
