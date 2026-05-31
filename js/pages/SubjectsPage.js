/**
 * Subjects page — filterable grid of all 8 subjects with progress rings
 * CET LMS
 */

import store from '../store.js';
import { SUBJECTS, getSubjectColor, getMaxQuestions } from '../data.js';
import router from '../router.js';
import Audio from '../audio.js';
import { createElement, escapeHTML } from '../utils.js';

const CIRCUMFERENCE = 2 * Math.PI * 38;

let _subjectsPageGeneration = 0;

/**
 * Render the subjects grid page
 * @param {Object} params - Router params
 */
export default function renderSubjects(params) {
  _subjectsPageGeneration++;
  const myGeneration = _subjectsPageGeneration;
  const container = document.getElementById('subjGrid');
  if (!container) return;

  // Build filter bar if not exists
  let filterBar = document.getElementById('subjectsFilterBar');
  if (!filterBar) {
    filterBar = createElement('div', { id: 'subjectsFilterBar', className: 'filter-bar' });
    const filterInput = createElement('input', {
      type: 'text',
      placeholder: '⌕ Search subjects...',
      className: 'input filter-input',
      id: 'subjectsFilter',
    });
    filterInput.addEventListener('input', () => renderGrid(filterInput.value));
    filterBar.appendChild(filterInput);
    container.parentNode.insertBefore(filterBar, container);
  }

  // Show skeleton loading briefly for that premium feel
  if (!params._noSkeleton) {
    showSkeleton();
    if (window._subjectsSkeletonTimeout) clearTimeout(window._subjectsSkeletonTimeout);
    window._subjectsSkeletonTimeout = setTimeout(() => {
      if (_subjectsPageGeneration === myGeneration) renderGrid('');
    }, 350);
  } else {
    renderGrid('');
  }
}

function showSkeleton() {
  const container = document.getElementById('subjGrid');
  if (!container) return;
  let html = '<div class="skeleton-grid">';
  for (let i = 0; i < 8; i++) {
    html += `<div class="skeleton skeleton-card" style="height:180px;"></div>`;
  }
  html += '</div>';
  container.innerHTML = html;
}

function renderGrid(filterText = '') {
  const container = document.getElementById('subjGrid');
  if (!container) return;
  container.innerHTML = '';

  const state = store.get();
  const filtered = SUBJECTS.filter(s =>
    s.name.toLowerCase().includes(filterText.toLowerCase())
  );

  // Add staggered class for entrance animation (only if grid is empty)
  if (!container.classList.contains('stagger')) {
    container.classList.add('stagger');
  }

  // Subject category mapping for badges
  const categoryMap = {
    math: { label: 'Core', className: 'core' },
    science: { label: 'Core', className: 'core' },
    english: { label: 'Language', className: 'language' },
    filipino: { label: 'Language', className: 'language' },
    abstract: { label: 'Reasoning', className: 'reasoning' },
    geninfo: { label: 'General', className: 'general' },
    examspec: { label: 'General', className: 'general' },
    specialized: { label: 'Specialized', className: 'specialized' },
  };

  filtered.forEach((s, idx) => {
    const prog = state.subjectProgress[s.id] || { answered: 0, correct: 0 };
    const maxQ = getMaxQuestions(s.id);
    const pct = maxQ > 0 ? Math.min(Math.round((prog.answered / maxQ) * 100), 100) : 0;
    const color = getSubjectColor(s.id);
    const offset = CIRCUMFERENCE - (CIRCUMFERENCE * pct) / 100;
    const cat = categoryMap[s.id] || { label: 'General', className: 'general' };

    const card = createElement('div', { className: 'subject-card' });
    card.style.setProperty('--subject-color', color);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.onclick = () => { router.navigate('subject', { id: s.id }); Audio.playClick(); };
    card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.navigate('subject', { id: s.id }); Audio.playClick(); } };

    card.innerHTML = `
      <div class="subj-icon">${s.icon}</div>
      <h3>${s.name}</h3>
      <span class="subj-badge ${cat.className}">${cat.label}</span>
      <div class="subj-chapters">${s.chapters}</div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:8px;">
        <svg class="progress-ring" width="80" height="80" viewBox="0 0 80 80">
          <circle class="progress-ring-bg" cx="40" cy="40" r="38" stroke-width="4"/>
          <circle class="progress-ring-fg" cx="40" cy="40" r="38" stroke-width="4"
            stroke="${color}" stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${offset}"/>
          <text class="progress-ring-text" x="40" y="40" font-size="16">${pct}%</text>
        </svg>
        <div style="font-size:11px;color:var(--text-secondary);">
          <div>${prog.answered} questions</div>
          <div>${prog.answered > 0 ? Math.round((prog.correct/prog.answered)*100) + '% acc' : '—'}</div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">No subjects match "${escapeHTML(filterText)}"</div>`;
  }
}