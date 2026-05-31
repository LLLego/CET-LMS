/**
 * Pomodoro-style study timer with focus/break modes and session logging
 * CET LMS
 */

import store from '../store.js';
import { SUBJECTS } from '../data.js';
import Audio from '../audio.js';
import toast from '../components/Toast.js';
import { formatTime } from '../utils.js';

let timerState = {
  mode: 'focus', // 'focus' | 'break'
  seconds: 25 * 60,
  totalSeconds: 25 * 60,
  running: false,
  interval: null,
  switchingMode: false, // flag to block start during auto-switch
};

/**
 * Render the timer page
 * @param {Object} params - Router params
 */
export default function renderTimer(params) {
  // C5: If a timer was running from a previous render (page re-entry), clean it up and log
  if (timerState.running && timerState.interval) {
    const elapsed = timerState.totalSeconds - timerState.seconds;
    clearInterval(timerState.interval);
    timerState.running = false;
    timerState.interval = null;
    if (elapsed >= 60 && timerState.mode === 'focus') {
      const mins = Math.round(elapsed / 60);
      const subject = document.getElementById('timerSubject')?.value || 'General Study';
      store.logSession(subject, mins);
      updateStats();
      toast.info(`Previous session saved: ${mins} min on ${subject}`, 4000);
    }
  }

  // Populate subject selector
  const sel = document.getElementById('timerSubject');
  if (sel) {
    sel.innerHTML = '<option value="General Study">General Study</option>';
    SUBJECTS.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.name;
      opt.textContent = `${s.icon} ${s.name}`;
      sel.appendChild(opt);
    });
  }

  // Mode toggle buttons
  const focusBtn = document.getElementById('timerModeFocus');
  const breakBtn = document.getElementById('timerModeBreak');
  if (focusBtn && breakBtn) {
    focusBtn.onclick = () => setMode('focus');
    breakBtn.onclick = () => setMode('break');
  }

  // Start/Stop button
  const startBtn = document.getElementById('timerStartBtn');
  if (startBtn) {
    startBtn.onclick = toggleTimer;
  }

  // Reset button
  const resetBtn = document.getElementById('timerResetBtn') || document.querySelector('.timer-btn.reset');
  if (resetBtn) {
    resetBtn.onclick = resetTimer;
  }

  // Reset timer state to defaults
  resetTimer();
  updateStats();
}

function setMode(mode) {
  if (timerState.running) return; // Don't switch modes while running

  timerState.mode = mode;
  const focusBtn = document.getElementById('timerModeFocus');
  const breakBtn = document.getElementById('timerModeBreak');

  if (focusBtn) focusBtn.classList.toggle('active', mode === 'focus');
  if (breakBtn) breakBtn.classList.toggle('active', mode === 'break');

  timerState.totalSeconds = mode === 'focus' ? 25 * 60 : 5 * 60;
  timerState.seconds = timerState.totalSeconds;

  document.getElementById('timerLabel').textContent = mode === 'focus' ? 'Focus' : 'Break';
  updateDisplay();
}

function toggleTimer() {
  const btn = document.getElementById('timerStartBtn');
  if (!btn) return;

  if (timerState.running) {
    stopTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  // Race condition fix: block start during auto-switch window
  if (timerState.switchingMode) return;

  Audio.init();
  timerState.running = true;
  const btn = document.getElementById('timerStartBtn');
  if (btn) {
    btn.textContent = '⏹ Stop';
    btn.className = 'timer-btn stop';
  }

  timerState.interval = setInterval(() => {
    timerState.seconds--;
    updateDisplay();

    if (timerState.seconds <= 0) {
      timerComplete();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerState.interval);
  timerState.running = false;

  const btn = document.getElementById('timerStartBtn');
  if (btn) {
    btn.textContent = '▶ Start';
    btn.className = 'timer-btn start';
  }

  // Log session if > 1 minute elapsed
  const elapsed = timerState.totalSeconds - timerState.seconds;
  if (elapsed >= 60) {
    const mins = Math.round(elapsed / 60);
    const subject = document.getElementById('timerSubject')?.value || 'General Study';
    store.logSession(subject, mins);
    updateStats();
    toast.success(`Session logged: ${mins} min on ${subject}`, 3000);
  }
}

function resetTimer() {
  clearInterval(timerState.interval);
  timerState.running = false;
  timerState.interval = null;
  timerState.switchingMode = false;
  timerState.mode = 'focus';
  timerState.totalSeconds = 25 * 60;
  timerState.seconds = timerState.totalSeconds;

  const btn = document.getElementById('timerStartBtn');
  if (btn) {
    btn.textContent = '▶ Start';
    btn.className = 'timer-btn start';
    btn.disabled = false;
  }

  const focusBtn = document.getElementById('timerModeFocus');
  const breakBtn = document.getElementById('timerModeBreak');
  if (focusBtn) focusBtn.classList.add('active');
  if (breakBtn) breakBtn.classList.remove('active');

  document.getElementById('timerLabel').textContent = 'Focus';
  updateDisplay();
}

function timerComplete() {
  clearInterval(timerState.interval);
  timerState.running = false;
  timerState.interval = null;

  const btn = document.getElementById('timerStartBtn');
  if (btn) {
    btn.textContent = '▶ Start';
    btn.className = 'timer-btn start';
  }

  // C4: Only log study time for focus mode, not breaks
  const mins = Math.round(timerState.totalSeconds / 60);
  const subject = document.getElementById('timerSubject')?.value || 'General Study';
  if (timerState.mode === 'focus') {
    store.logSession(subject, mins);
    updateStats();
  }

  // Sound and notification
  Audio.playTimerComplete();

  const modeText = timerState.mode === 'focus' ? 'Focus' : 'Break';
  toast.success(`✦ ${modeText} session complete! (${mins} min)`, 5000);

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('CET LMS Timer', {
      body: `${modeText} session complete! ${mins} minutes studied.`,
      icon: '◆',
    });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }

  // Auto switch to break mode if focus just completed
  if (timerState.mode === 'focus') {
    // Race condition fix: disable Start button and set flag during switch window
    timerState.switchingMode = true;
    if (btn) btn.disabled = true;
    setTimeout(() => setMode('break'), 1000);
    setTimeout(() => {
      timerState.switchingMode = false;
      const startBtn = document.getElementById('timerStartBtn');
      if (startBtn) startBtn.disabled = false;
    }, 1500);
  }
}

// C5: Cleanup function exposed globally so the router can call it on page leave
function cleanupTimer() {
  if (timerState.interval) {
    const elapsed = timerState.totalSeconds - timerState.seconds;
    clearInterval(timerState.interval);
    timerState.running = false;
    timerState.interval = null;
    if (elapsed >= 60 && timerState.mode === 'focus') {
      const mins = Math.round(elapsed / 60);
      const subject = document.getElementById('timerSubject')?.value || 'General Study';
      store.logSession(subject, mins);
      updateStats();
      toast.info(`Session saved: ${mins} min on ${subject}`, 3000);
    }
  }
}

function updateDisplay() {
  const display = document.getElementById('timerDisplay');
  if (display) {
    display.textContent = formatTime(timerState.seconds);
  }
}

function updateStats() {
  const state = store.get();
  const sessions = state.sessions || [];

  // Today's total
  const today = new Date().toDateString();
  const todayMins = sessions
    .filter(s => new Date(s.date).toDateString() === today)
    .reduce((sum, s) => sum + (s.duration || 0), 0);

  const todayEl = document.getElementById('todayTime');
  if (todayEl) todayEl.textContent = todayMins + 'm';

  const totalEl = document.getElementById('totalSessions');
  if (totalEl) totalEl.textContent = sessions.length;

  // Recent sessions list
  const listEl = document.getElementById('sessionsList');
  if (listEl) {
    const recent = sessions.slice(-10).reverse();
    if (recent.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No study sessions yet. Start a timer to track your progress!</div>';
    } else {
      listEl.innerHTML = recent.map(s => `
        <div class="session-item">
          <span class="s-date">${new Date(s.date).toLocaleDateString()}</span>
          <span class="s-subject">${s.subject}</span>
          <span class="s-duration">${s.duration || 0}m</span>
        </div>
      `).join('');
    }
  }
}

// Expose globally for HTML onclick handlers
window.resetTimer = function() { resetTimer(); };
window.cleanupTimer = cleanupTimer;

// Keyboard shortcut
document.addEventListener('keydown', (e) => {
  // C5 fix: e.key is ' ' for spacebar, not 'Space'; also guard against typing in inputs
  if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
    const timerPage = document.getElementById('page-timer');
    if (timerPage && timerPage.classList.contains('active') && e.target.tagName !== 'SELECT') {
      e.preventDefault();
      toggleTimer();
    }
  }
});
