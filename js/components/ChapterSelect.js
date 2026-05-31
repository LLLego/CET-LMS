/**
 * Chapter Selection Component
 * Displays chapters for a selected subject
 * CET LMS
 */

import { SUBJECTS } from '../data.js';
import Audio from '../audio.js';

/**
 * Render chapter selection for a subject
 * @param {string} mode - 'reader' | 'quiz' | 'flashcards'
 * @param {string} subjectId - Selected subject ID
 * @param {Array} chapters - Chapter data array
 * @param {Function} onSelect - Callback when chapter is selected
 */
export function renderChapterSelection(mode, subjectId, chapters, onSelect) {
  const subject = SUBJECTS.find(s => s.id === subjectId);
  if (!subject) {
    return '<div class="error-state">Subject not found</div>';
  }

  return `
    <div class="chapter-selection">
      <div class="chapter-selection-header">
        <button class="back-btn" onclick="handleBackToSubjects('${mode}')">
          ← Back to Subjects
        </button>
        <div class="subject-header">
          <span class="subject-icon-large" style="background: ${subject.color}20; color: ${subject.color}">
            ${subject.icon}
          </span>
          <div>
            <h2>${subject.name}</h2>
            <p class="subtitle">Select a chapter to continue</p>
          </div>
        </div>
      </div>

      <div class="chapter-grid">
        ${chapters.map(chapter => `
          <div 
            class="chapter-card"
            data-chapter="${chapter.id || chapter.number}"
            onclick="handleChapterSelect('${mode}', '${subjectId}', '${chapter.id || chapter.number}')"
            onkeydown="if(event.key==='Enter'||event.key===' ')handleChapterSelect('${mode}', '${subjectId}', '${chapter.id || chapter.number}')"
            tabindex="0"
            role="button"
          >
            <div class="chapter-number">
              Chapter ${chapter.number || chapter.id}
            </div>
            <h3 class="chapter-title">${chapter.title}</h3>
            <div class="chapter-meta">
              ${chapter.sections ? `<span>▸ ${chapter.sections.length} sections</span>` : ''}
              ${chapter.word_count ? `<span>◷ ~${Math.ceil(chapter.word_count / 250)} min read</span>` : ''}
            </div>
            <div class="chapter-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
              </div>
              <span class="progress-text">Not started</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Handle chapter selection
 */
window.handleChapterSelect = function(mode, subjectId, chapterId) {
  Audio.playClick();
  
  const routes = {
    'reader': `reader/${subjectId}/${chapterId}`,
    'quiz': `quiz/${subjectId}/${chapterId}`,
    'flashcards': `flashcards/${subjectId}/${chapterId}`
  };
  
  if (window.router) {
    window.router.navigate(routes[mode].split('/')[0], { 
      subjectId,
      chapterId,
      mode 
    });
  } else {
    window.location.hash = routes[mode];
  }
};

/**
 * Handle back navigation
 */
window.handleBackToSubjects = function(mode) {
  Audio.playClick();
  if (window.router) {
    window.router.navigate(mode, {});
  } else {
    window.location.hash = mode;
  }
};

export default { renderChapterSelection };
