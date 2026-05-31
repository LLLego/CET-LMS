/**
 * Static data for CET LMS
 * Subjects, quiz questions, flashcard decks, and textbook content
 */

export const SUBJECTS = [
  { id: 'math', name: 'Mathematics', icon: '#', chapters: 'Ch 1-9', color: 'var(--color-math)', chaptersList: ['The Language of Numbers', 'Variables', 'Algebra', 'Functions', 'Geometry', 'Trigonometry', 'Advanced Algebra & Precalculus', 'Calculus', 'Statistics & Probability'] },
  { id: 'science', name: 'Science', icon: '◈', chapters: 'Ch 10-16', color: 'var(--color-science)', chaptersList: ['Biology I: Cells, Genetics, Evolution', 'Biology II: Body Systems, Ecology', 'Chemistry I: Atomic Structure', 'Chemistry II: Reactions, Stoichiometry', 'Physics I: Mechanics, Energy', 'Physics II: Waves, Optics, Electricity', 'Integrated Science'] },
  { id: 'english', name: 'English', icon: '✎', chapters: 'Ch 17-24', color: 'var(--color-english)', chaptersList: ['Grammar I: Parts of Speech', 'Grammar II: Syntax & Errors', 'Vocabulary I: High-Frequency Words', 'Vocabulary II: Advanced Words', 'Reading Comprehension', 'Verbal Reasoning', 'Language Proficiency', 'Test-Taking Skills'] },
  { id: 'filipino', name: 'Filipino', icon: '◇', chapters: 'Ch 25-29', color: 'var(--color-filipino)', chaptersList: ['Balarila I: Bahagi ng Pananalita', 'Balarila II: Paksa/Pandiwa', 'Talasalitaan at mga Idioma', 'Pagbasa: Reading Comprehension', 'Language Proficiency'] },
  { id: 'abstract', name: 'Abstract Reasoning', icon: '⬡', chapters: 'Ch 30-34', color: 'var(--color-abstract)', chaptersList: ['Pattern Recognition', 'Logical Reasoning', 'Spatial Reasoning', 'Mechanical Reasoning', 'IQ Tests'] },
  { id: 'geninfo', name: 'General Info', icon: '◉', chapters: 'Ch 35-41', color: 'var(--color-geninfo)', chaptersList: ['PH History I: Ancient-1898', 'PH History II: 1898-Present', 'PH Government', 'PH Geography', 'World History', 'General Science Review', 'Current Events'] },
  { id: 'examspec', name: 'Exam-Specific', icon: '◎', chapters: 'Ch 42-44', color: 'var(--color-examspec)', chaptersList: ['CET Format & Strategies', 'Stress & Last-Minute Tips', 'Subject-Specific Tips'] },
  { id: 'specialized', name: 'Specialized Topics', icon: '⚡', chapters: 'Ch 45-47', color: 'var(--color-specialized)', chaptersList: ['STEM, ABM, HUMSS, GAS', 'Engineering, Business, Arts', 'TVL, Sports'] },
];

// Question count per subject, derived from quiz_data.json
const QUESTION_COUNTS = {
  math: 161,
  science: 111,
  english: 130,
  filipino: 97,
  abstract: 95,
  geninfo: 119,
  examspec: 52,
  specialized: 49,
};

/**
 * Get the subject color as a CSS variable value
 */
export function getSubjectColor(subjectId) {
  const subject = SUBJECTS.find(s => s.id === subjectId);
  if (!subject) return 'var(--color-primary)';
  return subject.color;
}

/**
 * Get max questions count for a subject
 */
export function getMaxQuestions(subjId) {
  return QUESTION_COUNTS[subjId] ?? 10;
}