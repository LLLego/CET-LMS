/**
 * Subject Selection Component
 * Reusable component for selecting subjects across Reader, Quiz, and Flashcards
 * CET LMS
 */

import { SUBJECTS } from '../data.js';
import Audio from '../audio.js';

/**
 * Render subject selection grid
 * @param {string} mode - 'reader' | 'quiz' | 'flashcards'
 * @param {Function} onSelect - Callback when subject is selected
 */
export function renderSubjectSelection(mode, onSelect) {
  const subjects = getSubjectsForMode(mode);
  
  return `
    <div class="subject-selection-grid">
      ${subjects.map(subj => `
        <div 
          class="subject-card" 
          data-subject="${subj.id}"
          onclick="handleSubjectSelect('${mode}', '${subj.id}')"
          onkeydown="if(event.key==='Enter'||event.key===' ')handleSubjectSelect('${mode}', '${subj.id}')"
          tabindex="0"
          role="button"
        >
          <div class="subject-icon" style="background: ${subj.color}20; color: ${subj.color}">
            ${subj.icon}
          </div>
          <h3>${subj.name}</h3>
          <p class="subject-chapters">${subj.chapters}</p>
          <div class="subject-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: 0%"></div>
            </div>
            <span class="progress-text">0% complete</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Get subjects relevant for a mode
 */
function getSubjectsForMode(mode) {
  // For now, return all subjects
  // Could filter based on mode if needed
  return SUBJECTS;
}

/**
 * Handle subject selection
 */
window.handleSubjectSelect = function(mode, subjectId) {
  Audio.playClick();
  
  const subject = SUBJECTS.find(s => s.id === subjectId);
  if (!subject) return;
  
  // Navigate to chapter selection for the selected subject
  const routes = {
    'reader': `reader/${subjectId}`,
    'quiz': `quiz/${subjectId}`,
    'flashcards': `flashcards/${subjectId}`
  };
  
  // Use router if available, otherwise direct navigation
  if (window.router) {
    window.router.navigate(routes[mode].split('/')[0], { 
      subjectId,
      mode 
    });
  } else {
    window.location.hash = routes[mode];
  }
};

export default { renderSubjectSelection };
