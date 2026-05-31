# STUDENT TESTING REPORT — May 31, 2026
## 10 Student Agents Tested the CET LMS

---

## 🔴 CRITICAL — Must Fix

### 1. Quiz Next/Previous Buttons Broken (Alpha, Beta)
- `Next ▶` and `◀ Previous` buttons have NO onclick handlers
- Users can only navigate via question number buttons at top
- **Impact**: Major usability regression — students can't sequentially progress

### 2. Filipino — 35/40 Sections Are Placeholder Text (Eta)
- Content is just: "Focus on understanding the core concepts of [topic]. Practice with sample questions to reinforce your learning."
- Average 47 words/section vs 200-426 for other subjects
- All 5 chapters average 805 words (2-3 min read)

### 3. Science Title/Content Mismatches (Eta)
- `secscience-11-11-3` titled "Botany (Plant Biology)" has content about **Periodic Table**
- `secscience-13-13-1` titled "Chemical Reactions" has content about **Physics Concepts**

### 4. Math Stub Sections — Only "What You Need First" (Eta)
- `secmath-4-4-2` "Linear Functions" — 4 words
- `secmath-2-2-2` "Expressions vs. Equations" — 4 words
- `secmath-4-4-1` "Functions" — 7 words
- `secmath-4-4-3` "Quadratic Functions" — 5 words
- `secmath-9-9-5` "Correlation & Regression" — 5 words
- 15+ additional short sections (10-50 words)

### 5. Science Stub Sections (Eta)
- Ch16 "Integrated Science": 4 sections with only "1. What You Need First"
- Earth Systems, Space Science, Organism Interactions, Energy in Ecosystems — 5-7 words each

### 6. Quiz Answer Index Bug — Science (Eta)
- "Which is NOT a mechanism of evolution?" — answer set to index 4, max valid is 3
- Will always mark wrong regardless of choice

---

## 🟡 HIGH — Should Fix

### 7. Tables Rendered as Plain Text (Beta)
- Biology I: pipe-separated markdown tables render as inline text
- Chemistry I: subatomic particles table collapsed into continuous text
- Core educational data becomes unparseable

### 8. Garbage Flashcards (Eta)
- 17 garbage cards in Specialized: terms like "Master", "Focus", "One Thing"
- 10 garbage cards in Exam-Specific
- Broken text extraction artifacts

### 9. Flashcard Shows Definition First, Not Term (Alpha)
- Default display shows "DEFINITION: The set of positive counting numbers..."
- Students expect to see the TERM first, then flip to definition

### 10. No "✓ Correct" Indicator (Beta)
- Wrong answers: "✗ Incorrect" + correct answer + explanation
- Correct answers: ONLY explanation — no positive feedback

### 11. Color Contrast Issues — 6 Locations (Theta)
- Footer text nearly invisible (all pages, both themes)
- Dashboard "0 done" text (light mode)
- Progress page subtitle, empty states, metadata (light mode)
- Quiz inactive question numbers (light mode)
- Flashcard labels (light mode)

---

## 🟠 MEDIUM — Nice to Fix

### 12. Section Ordering Wrong — Math Ch1 (Alpha)
- Sections display: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7, 1.8, 1.4
- 1.4 appears at END instead of after 1.3

### 13. Section Titles with Raw Notes (Alpha)
- Section 1.6: "1.6. (basic multiplication for counting) - Ability to multiply..."
- Internal notes leaked into display title

### 14. Duplicate Section Titles — "Reminders" (Alpha)
- Sections 1.2, 1.4, 1.5, 1.7, 1.8 all titled "Reminders"
- Impossible to distinguish which section contains what

### 15. Truncated Section Content (Alpha)
- Section 1.1: "Complete mastery of: - Chapter 1 Sections 1.1-1.5 (number sets, basic fractions) -"
- Cuts off mid-sentence with trailing dash

### 16. Chapter Ordering Inconsistency (Beta)
- Subject page: Bio I → Bio II → Chem I → Chem II → Physics I → Physics II → Integrated
- Quiz mode: Bio I → Bio II → Physics I → Chem I → Chem II → Integrated → Physics II

### 17. Chapter Descriptions All Placeholder (Alpha, Beta)
- Every chapter shows: "This chapter covers key CET concepts in Mathematics/Science/etc."
- Not helpful for students choosing what to study

### 18. Stray Parentheses in Content (Beta)
- Biology I: `(` before "Rescue Track" heading, `)` after
- Chemistry I: Same issue

### 19. 426 Sections with null/undefined subject_id (Eta)
- Duplicate sections using chapter_ids like "chmath-0" instead of proper IDs

### 20. Duplicate Section IDs in Chapter Definitions (Eta)
- 41 out of 47 chapters have duplicate section IDs
- Filipino worst: Ch25 has 7 duplicates, Ch26-29 have 8-9 each

---

## Summary by Severity

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 6 | Must fix |
| 🟡 High | 5 | Should fix |
| 🟠 Medium | 9 | Nice to fix |
| **Total** | **20** | |
