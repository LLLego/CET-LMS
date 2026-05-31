/**
 * Subject Detail page — header with progress ring + chapter accordion list
 * CET LMS
 */

import store from '../store.js';
import { SUBJECTS, getSubjectColor, getMaxQuestions } from '../data.js';
import Audio from '../audio.js';
import router from '../router.js';

const CIRCUMFERENCE = 2 * Math.PI * 38;

// Module-level textbook cache (lazy-loaded on first render, not at import time)
let textbookData = undefined; // undefined = not loaded yet, null = loading in progress, {} = loading failed

/**
 * Render a centered loading spinner
 */
function renderSpinner(label) {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;">
      <div class="animate-spin" style="width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--color-primary);border-radius:50%;margin-bottom:16px;"></div>
      <p style="color:var(--text-secondary);font-size:15px;">${label}</p>
    </div>
  `;
}

/**
 * Render subject detail page
 * @param {Object} params - Route params { id: subjectId }
 */
export default function renderSubjectDetail(params) {
  const subjectId = params?.id;
  if (!subjectId) return;

  const subj = SUBJECTS.find(s => s.id === subjectId);
  if (!subj) return;

  const prog = store.getSubjectProgress(subjectId);
  const maxQ = getMaxQuestions(subjectId);
  const pct = maxQ > 0 ? Math.min(Math.round((prog.answered / maxQ) * 100), 100) : 0;
  const color = getSubjectColor(subjectId);
  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * pct) / 100;

  // Lazy-load textbook data on first render (not at module import time)
  if (textbookData === undefined) {
    textbookData = null; // mark as loading in progress
    fetch('data/textbook_data.json')
      .then(r => r.json())
      .then(data => {
        textbookData = data;
        // Re-render if user is still on this subject page
        if (window.location.hash.startsWith(`#subject/${subjectId}`)) {
          renderSubjectDetail({ id: subjectId });
        }
      })
      .catch(() => { textbookData = {}; });
  }

  // If textbook data hasn't loaded yet, show spinner and re-render when ready
  if (textbookData === null) {
    const header = document.getElementById('subjDetailHeader');
    if (header) header.innerHTML = renderSpinner('Loading textbook...');
    const list = document.getElementById('chapterList');
    if (list) list.innerHTML = '';
    return;
  }

// Header
  const header = document.getElementById('subjDetailHeader');
  if (header) {
    header.innerHTML = `
      <h2>${subj.icon} ${subj.name}</h2>
      <div class="subj-meta">
        <span>${subj.chapters}</span>
        <span>${prog.answered} questions answered</span>
        <span>${prog.answered > 0 ? Math.round((prog.correct / prog.answered) * 100) + '% accuracy' : '—'}</span>
      </div>
      <div style="display:flex;align-items:center;gap:16px;margin-top:12px;">
        <svg class="progress-ring" width="80" height="80" viewBox="0 0 80 80">
          <circle class="progress-ring-bg" cx="40" cy="40" r="38" stroke-width="4"/>
          <circle class="progress-ring-fg" cx="40" cy="40" r="38" stroke-width="4"
            stroke="${color}" stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${offset}"/>
          <text class="progress-ring-text" x="40" y="40" font-size="16">${pct}%</text>
        </svg>
        <div>
          <div style="font-size:13px;color:var(--text-secondary);">${subj.name}</div>
          <div style="font-size:11px;color:var(--text-tertiary);">${subj.chaptersList.length} chapters</div>
        </div>
      </div>
    `;
  }

  // Chapter list
  const list = document.getElementById('chapterList');
  if (!list) return;
  list.innerHTML = '';

  subj.chaptersList.forEach((ch, i) => {
    const card = document.createElement('div');
    card.className = 'chapter-card';

    const headerEl = document.createElement('div');
    headerEl.className = 'chapter-header';
    headerEl.innerHTML = `
      <div class="ch-left">
        <div class="ch-num">${i + 1}</div>
        <span class="ch-title">${ch}</span>
      </div>
      <span class="ch-arrow">▼</span>
    `;
    headerEl.setAttribute('role', 'button');
    headerEl.setAttribute('tabindex', '0');
    headerEl.onclick = () => {
      headerEl.classList.toggle('open');
      bodyEl.classList.toggle('open');
      Audio.playClick();
    };
    headerEl.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        headerEl.classList.toggle('open');
        bodyEl.classList.toggle('open');
        Audio.playClick();
      }
    };

    const bodyEl = document.createElement('div');
    bodyEl.className = 'chapter-body';
    const chapterData = textbookData?.[subjectId]?.[i];
    const description = chapterData?.description || `Covers key CET concepts in ${subj.name}.`;
    bodyEl.innerHTML = `
      <div class="ch-content">
        <p><strong>Chapter ${i + 1}: ${ch}</strong></p>
        <p style="margin-top:8px;">${description}</p>
      </div>
    `;

    const btnGroup = document.createElement('div');
    btnGroup.style.cssText = 'display:flex;gap:8px;margin-top:var(--space-4);';

    const chapterId = chapterData?.id;
    const readBtn = document.createElement('button');
    readBtn.className = 'btn btn-secondary btn-sm';
    readBtn.textContent = '▸ Read Chapter';
    if (chapterId) {
      readBtn.onclick = (e) => {
        e.stopPropagation();
        Audio.playClick();
        router.navigate('reader', { subjectId, chapterId: String(chapterId) });
      };
    } else {
      readBtn.style.opacity = '0.4';
      readBtn.title = 'No textbook content available yet';
    }
    btnGroup.appendChild(readBtn);

    const quizBtn = document.createElement('button');
    quizBtn.className = 'btn btn-primary btn-sm';
    quizBtn.textContent = '✎ Take Quiz';
    quizBtn.onclick = (e) => {
      e.stopPropagation();
      Audio.playClick();
      router.navigate('quiz', { subjectId });
    };
    btnGroup.appendChild(quizBtn);

    bodyEl.appendChild(btnGroup);

    card.appendChild(headerEl);
    card.appendChild(bodyEl);
    list.appendChild(card);
  });
}