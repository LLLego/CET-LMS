/**
 * Dashboard page — greeting, stats, weekly chart, quick resume, subjects
 * CET LMS
 */

import store from '../store.js';
import { SUBJECTS, getSubjectColor, getMaxQuestions } from '../data.js';
import Audio from '../audio.js';
import router from '../router.js';

const CIRCUMFERENCE = 2 * Math.PI * 38; // ~238.76 for SVG progress ring

/**
 * Render the dashboard
 * @param {Object} params - Router params (unused)
 */
export default function renderDashboard(params) {
  // Greeting
  const greetingEl = document.getElementById('greeting');
  if (greetingEl) {
    const hour = new Date().getHours();
    let timeGreeting = 'Good evening';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 18) timeGreeting = 'Good afternoon';
    greetingEl.textContent = `${timeGreeting}! Ready to study?`;
  }

  // Stats with count-up animation
  const state = store.get();
  const streak = state.streak || 0;
  const answered = state.answered || 0;
  const correct = state.correct || 0;
  const sessions = state.sessions || [];
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

  // Cancel any previously running count-up animations to avoid overlapping loops
  // Use a generation counter so stale callbacks bail out immediately
  window._animEpoch = (window._animEpoch || 0) + 1;
  const epoch = window._animEpoch;
  if (window._countAnimations) window._countAnimations.forEach(id => cancelAnimationFrame(id));
  window._countAnimations = [];
  animateCount('statStreak', 0, streak, '', epoch);
  animateCount('statAccuracy', 0, accuracy, '%', epoch);
  animateCount('statAnswered', 0, answered, '', epoch);
  animateCount('statSessions', 0, sessions.length, '', epoch);

  // Quick Resume
  const quickResumeEl = document.getElementById('quickResume');
  const lastQuiz = state.lastQuizState;
  if (quickResumeEl) {
    if (lastQuiz && lastQuiz.subjectId) {
      const subj = SUBJECTS.find(s => s.id === lastQuiz.subjectId);
      const pct = lastQuiz.total > 0 ? Math.round((lastQuiz.current / lastQuiz.total) * 100) : 0;
      quickResumeEl.style.display = 'block';
      quickResumeEl.innerHTML = `
        <div class="qr-title">▸ Resume: ${subj ? subj.name : 'Quiz'} — Question ${lastQuiz.current + 1} of ${lastQuiz.total}</div>
        <div class="qr-subtitle">${pct}% complete · Click to continue</div>
      `;
      quickResumeEl.onclick = () => {
        router.navigate('quiz');
        Audio.playClick();
      };
    } else {
      quickResumeEl.style.display = 'none';
    }
  }

  // Subject grid with progress rings
  const grid = document.getElementById('dashSubjects');
  if (grid) {
    grid.innerHTML = '';
    SUBJECTS.forEach(s => {
      const prog = state.subjectProgress[s.id] || { answered: 0, correct: 0 };
      const maxQ = getMaxQuestions(s.id);
      const pct = maxQ > 0 ? Math.min(Math.round((prog.answered / maxQ) * 100), 100) : 0;
      const color = getSubjectColor(s.id);
      const offset = CIRCUMFERENCE - (CIRCUMFERENCE * pct) / 100;

      // Subject card with progress rings
      const card = document.createElement('div');
      card.className = 'subject-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.style.setProperty('--subject-color', color);
      card.onclick = () => { router.navigate('subject', { id: s.id }); Audio.playClick(); };
      card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.navigate('subject', { id: s.id }); Audio.playClick(); } };

      card.innerHTML = `
        <div class="subj-icon">${s.icon}</div>
        <h3>${s.name}</h3>
        <div class="subj-chapters">${s.chapters}</div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:8px;">
          <svg class="progress-ring" width="80" height="80" viewBox="0 0 80 80">
            <circle class="progress-ring-bg" cx="40" cy="40" r="38" stroke-width="4"/>
            <circle class="progress-ring-fg" cx="40" cy="40" r="38" stroke-width="4"
              stroke="${color}" stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${offset}"/>
            <text class="progress-ring-text" x="40" y="40" font-size="16">${pct}%</text>
          </svg>
          <div style="font-size:11px;color:var(--text-secondary);">
            <div>${prog.answered} done</div>
            <div>${prog.answered > 0 ? Math.round((prog.correct/prog.answered)*100) + '%' : '—'}</div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // Weekly chart
  const weekChart = document.getElementById('weekChart');
  if (weekChart) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMinutes = new Array(7).fill(0);
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...

    sessions.forEach(s => {
      const sDate = new Date(s.date);
      const diffDays = Math.floor((today - sDate) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7 && s.duration) {
        const idx = (sDate.getDay() + 6) % 7; // 0=Mon
        dayMinutes[idx] += s.duration;
      }
    });

    const maxMin = Math.max(...dayMinutes, 1);
    weekChart.innerHTML = days.map((day, i) => {
      const height = Math.max(4, (dayMinutes[i] / maxMin) * 80);
      return `<div class="week-bar"><div class="bar" style="height:${height}px"></div><span class="bar-label">${day}</span></div>`;
    }).join('');
  }
}

/**
 * Animate a number counting up from `from` to `to` over ~1s
 * @param {string} id - Element ID
 * @param {number} from - Start value
 * @param {number} to - End value
 * @param {string} suffix - Optional suffix like '%'
 */
function animateCount(id, from, to, suffix = '', epoch) {
  const el = document.getElementById(id);
  if (!el) return;

  // If to is 0, just set it immediately
  if (to === 0) {
    el.textContent = '0' + suffix;
    return;
  }

  const duration = 1000; // ms
  const startTime = performance.now();

  function update(currentTime) {
    // Bail out if this animation belongs to a stale epoch (page re-rendered)
    if (epoch !== undefined && window._animEpoch !== epoch) return;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic for smooth deceleration
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(from + (to - from) * eased);
    el.textContent = current + suffix;

    if (progress < 1) {
      const frameId = requestAnimationFrame(update);
      if (window._countAnimations) window._countAnimations.push(frameId);
    }
  }

  const frameId = requestAnimationFrame(update);
  if (window._countAnimations) window._countAnimations.push(frameId);
}