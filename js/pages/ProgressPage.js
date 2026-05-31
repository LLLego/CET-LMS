/**
 * Progress page — stats overview, subject breakdown, weekly trends, sessions
 * CET LMS
 */

import store from '../store.js';
import { SUBJECTS, getMaxQuestions } from '../data.js';
import Audio from '../audio.js';
import { exportData } from '../db.js';
import toast from '../components/Toast.js';

/**
 * Render the progress page
 * @param {Object} params - Router params
 */
export default function renderProgress(params) {
  const container = document.getElementById('progressContent');
  if (!container) return;

  const state = store.get();
  const answered = state.answered || 0;
  const correct = state.correct || 0;
  const streak = state.streak || 0;
  const sessions = state.sessions || [];
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  // Find weakest subject
  let weakest = { id: null, name: '', answered: 0, accuracy: 100 };
  SUBJECTS.forEach(s => {
    const p = state.subjectProgress[s.id] || { answered: 0, correct: 0 };
    const acc = p.answered > 0 ? Math.round((p.correct / p.answered) * 100) : 999;
    if (acc < weakest.accuracy) {
      weakest = { id: s.id, name: s.name, answered: p.answered, accuracy: acc };
    }
  });

  // Weekly trend
  const thisWeek = getWeekMinutes(sessions, 0);
  const lastWeek = getWeekMinutes(sessions, -1);
  let trendText = 'Not enough data to compare weeks yet.';
  if (thisWeek === 0 && lastWeek === 0) {
    trendText = 'No data yet';
  } else if (thisWeek === 0) {
    trendText = `▽ Down from ${lastWeek}min last week`;
  } else if (lastWeek === 0) {
    trendText = `▲ New this week! ${thisWeek}min`;
  } else {
    const ratio = (thisWeek / lastWeek).toFixed(1);
    if (ratio > 1) {
      trendText = `▲ This week: <strong>${ratio}x</strong> more than last week!`;
    } else if (ratio < 1) {
      trendText = `▽ This week: <strong>${(lastWeek / thisWeek).toFixed(1)}x</strong> less than last week.`;
    } else {
      trendText = `▥ This week: same as last week.`;
    }
  }

  container.innerHTML = `
    <div class="page-header">
      <h2>▲ Your Progress</h2>
      <p class="subtitle">Track your learning journey across all subjects</p>
    </div>

    <!-- Stats -->
    <div class="progress-stats">
      <div class="progress-stat">
        <div class="stat-num ${accuracy >= 70 ? 'green' : accuracy >= 40 ? 'orange' : 'red'}">${accuracy}%</div>
        <div class="stat-label">Overall Accuracy</div>
      </div>
      <div class="progress-stat">
        <div class="stat-num blue">${answered}</div>
        <div class="stat-label">Questions Answered</div>
      </div>
      <div class="progress-stat">
        <div class="stat-num accent">${streak} days</div>
        <div class="stat-label">◆ Streak</div>
      </div>
      <div class="progress-stat">
        <div class="stat-num orange">${sessions.length}</div>
        <div class="stat-label">Study Sessions</div>
      </div>
    </div>

    <!-- Weakest subject alert -->
    ${weakest.id && weakest.answered < 5 ? `
      <div class="weakness-alert">
        <span class="wa-icon">⚠</span>
        <span><strong>${weakest.name}</strong> needs attention — ${weakest.answered} questions answered</span>
      </div>
    ` : ''}

    <!-- Weekly trend -->
    <div class="trend-card">
      <span class="trend-icon">▥</span>
      <span class="trend-text">${trendText}</span>
    </div>

    <!-- Subject breakdown -->
    <div class="section-title">◆ Subject Breakdown</div>
    <div class="subject-breakdown">
      ${SUBJECTS.map(s => {
        const p = state.subjectProgress[s.id] || { answered: 0, correct: 0 };
        const maxQ = getMaxQuestions(s.id);
        const pct = maxQ > 0 ? Math.min(Math.round((p.answered / maxQ) * 100), 100) : 0;
        const acc = p.answered > 0 ? Math.round((p.correct / p.answered) * 100) : 0;
        return `
          <div class="subject-breakdown-item">
            <div class="sb-header">
              <span class="sb-name">${s.icon} ${s.name}</span>
              <span class="sb-stats">${p.answered} questions · ${p.answered > 0 ? acc + '%' : '—'}</span>
            </div>
            <div class="progress-bar"><div class="fill" style="width:${pct}%"></div></div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Recent sessions -->
    <div class="section-title">◷ Recent Sessions</div>
    ${sessions.length > 0 ? `
      <div class="sessions-list">
        ${sessions.slice(-10).reverse().map(s => `
          <div class="session-item">
            <span class="s-date">${new Date(s.date).toLocaleDateString()}</span>
            <span class="s-subject">${s.subject}</span>
            <span class="s-duration">${s.duration || 0}m</span>
          </div>
        `).join('')}
      </div>
    ` : '<div class="empty-state">No study sessions yet. Start a timer to track your progress!</div>'}

    <!-- Export / Clear -->
    <div class="danger-zone">
      <div style="display:flex;gap:10px;">
        <button class="btn btn-ghost btn-sm" id="progressExportBtn">⇧ Export Data</button>
        <button class="btn btn-danger btn-sm" id="progressClearBtn">✕ Clear All Data</button>
      </div>
    </div>
  `;

  // Wire up buttons
  document.getElementById('progressExportBtn')?.addEventListener('click', () => {
    exportData(state);
    toast.success('Data exported!');
  });

  document.getElementById('progressClearBtn')?.addEventListener('click', () => {
    if (confirm('Clear all study data? This cannot be undone.')) {
      store.resetAll();
      toast.info('All data cleared.');
      renderProgress();
    }
  });
}

/**
 * Get total study minutes for a specific week offset (0 = this week, -1 = last week)
 */
function getWeekMinutes(sessions, offset = 0) {
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(now.getDate() + diffToMonday + offset * 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return sessions
    .filter(s => {
      const d = new Date(s.date);
      return d >= startOfWeek && d < endOfWeek;
    })
    .reduce((sum, s) => sum + (s.duration || 0), 0);
}