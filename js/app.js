/**
 * CET LMS — Application Entry Point
 * Initializes modules, registers routes, mounts sidebar
 * Firebase sync + auth login flow
 */

import router from './router.js';
import store from './store.js';
import Theme from './theme.js';
import Audio from './audio.js';
import searchOverlay from './components/SearchOverlay.js';
import toast from './components/Toast.js';
import { initFirebase, login, autoLogin, logout, checkUsername, isFirebaseReady, getCurrentUser } from './firebase.js';

import renderDashboard from './pages/DashboardPage.js';
import renderSubjects from './pages/SubjectsPage.js';
import renderSubjectDetail from './pages/SubjectDetailPage.js';
import renderReader from './pages/ReaderPage.js?v=28';
import renderQuizSelect from './pages/QuizPage.js';
import renderFlashcards from './pages/FlashcardsPage.js';
import renderTimer from './pages/TimerPage.js';
import renderProgress from './pages/ProgressPage.js';

/**
 * Wrap a route handler with an error boundary
 * If the handler throws, shows a user-friendly error state instead of crashing
 */
function withErrorBoundary(handler) {
  return function(params) {
    try {
      handler(params);
    } catch (err) {
      console.error(`[CET LMS] Error in ${handler.name || 'page'}:`, err);
      const main = document.querySelector('.page.active') || document.getElementById('mainContent');
      if (main) {
        main.innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;">
            <div style="font-size:48px;margin-bottom:16px;">⚠</div>
            <h2 style="font-family:var(--font-heading);font-size:24px;margin-bottom:8px;">Something went wrong</h2>
            <p style="color:var(--text-secondary);font-size:15px;max-width:400px;margin-bottom:20px;">
              This page encountered an error. Try refreshing or navigating to a different page.
            </p>
            <div style="display:flex;gap:10px;">
              <button class="btn btn-primary" onclick="window.location.hash='#dashboard'">⌂ Dashboard</button>
              <button class="btn btn-ghost" onclick="window.location.reload()">↻ Refresh</button>
            </div>
            <details style="margin-top:20px;font-size:12px;color:var(--text-tertiary);max-width:500px;text-align:left;">
              <summary>Error details</summary>
              <pre style="margin-top:8px;padding:12px;background:var(--bg-inset);border-radius:var(--radius-md);overflow-x:auto;">${err.message}\n${err.stack}</pre>
            </details>
          </div>
        `;
      }
    }
  };
}

/**
 * Initialize the application
 */
async function init() {
  // Initialize modules
  Theme.init();

  // Initialize Firebase (non-blocking — falls back to local-only)
  const firebaseOk = await initFirebase();

  // Try auto-login from saved session
  const autoLoggedIn = await autoLogin();

  if (autoLoggedIn) {
    // Pull remote state and merge
    await store.initialSync();
    showUserBadge();
    bootApp();
  } else {
    // Show login modal
    showLoginModal();
  }
}

/**
 * Boot the actual app (after auth)
 */
function bootApp() {
  // Register routes (with error boundaries)
  router
    .register('dashboard', withErrorBoundary(renderDashboard))
    .register('subjects', withErrorBoundary(renderSubjects))
    .register('subject', withErrorBoundary(renderSubjectDetail))
    .register('reader', withErrorBoundary(renderReader))
    .register('quiz', withErrorBoundary(renderQuizSelect))
    .register('flashcards', withErrorBoundary(renderFlashcards))
    .register('timer', withErrorBoundary(renderTimer))
    .register('progress', withErrorBoundary(renderProgress));

  // Initialize router (triggers initial route)
  router.init();

  // Mount sidebar handlers
  setupSidebar();
  setupFooter();

  // Init search overlay
  searchOverlay.init();

  // Global keyboard shortcuts (additional to per-page shortcuts)
  setupGlobalShortcuts();

  // Handle first user gesture to unlock audio
  document.addEventListener('click', () => Audio.init(), { once: true });
  document.addEventListener('keydown', () => Audio.init(), { once: true });

  // Expose router globally for HTML onclick handlers
  window.router = router;

  // Refresh streak in sidebar
  updateSidebarStreak();

  // Setup ripple effect on all buttons
  setupRippleEffect();

  // Animate nav icons on first load
  animateNavIcons();

  // Update sync indicator
  updateSyncIndicator();

  console.log('◆ CET LMS initialized');
}

// ══════════════════════════════════════════════
// LOGIN MODAL
// ══════════════════════════════════════════════

function showLoginModal() {
  const overlay = document.getElementById('loginOverlay');
  if (!overlay) return;
  overlay.classList.remove('hidden');

  const choiceEl = document.getElementById('loginChoice');
  const formEl = document.getElementById('loginForm');
  const choiceSignIn = document.getElementById('loginChoiceSignIn');
  const choiceRegister = document.getElementById('loginChoiceRegister');
  const backBtn = document.getElementById('loginBack');
  const subtitle = document.getElementById('loginFormSubtitle');
  const loginBtn = document.getElementById('loginBtn');
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const offlineBadge = document.getElementById('loginOfflineBadge');

  // Track mode: 'login' or 'register'
  let mode = 'login';

  function showChoice() {
    choiceEl.style.display = '';
    formEl.style.display = 'none';
    hideLoginError();
    usernameInput.value = '';
    passwordInput.value = '';
  }

  function showForm(m) {
    mode = m;
    choiceEl.style.display = 'none';
    formEl.style.display = '';
    hideLoginError();
    if (m === 'register') {
      subtitle.textContent = 'Pick a username and password to create your account';
      loginBtn.textContent = 'Create Account';
      usernameInput.placeholder = 'Choose a username';
      passwordInput.placeholder = 'Choose a password';
    } else {
      subtitle.textContent = 'Sign in to sync your progress across devices';
      loginBtn.textContent = 'Sign In';
      usernameInput.placeholder = 'Enter your username';
      passwordInput.placeholder = 'Enter your password';
    }
    setTimeout(() => usernameInput.focus(), 100);
  }

  // Show offline badge if Firebase isn't available
  if (!isFirebaseReady() && offlineBadge) {
    offlineBadge.style.display = 'inline-block';
  }

  // Choice buttons
  choiceSignIn.addEventListener('click', () => showForm('login'));
  choiceRegister.addEventListener('click', () => showForm('register'));
  backBtn.addEventListener('click', showChoice);

  // Login/Register button handler
  loginBtn.addEventListener('click', async () => {
    await handleLogin(mode);
  });

  // Enter key on password field
  passwordInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleLogin(mode);
    }
  });

  // Enter key on username field — move to password
  usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      passwordInput.focus();
    }
  });

  // Start on choice screen
  showChoice();
}

async function handleLogin(mode = 'login') {
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  const loginBtn = document.getElementById('loginBtn');
  const errorEl = document.getElementById('loginError');

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username) {
    showLoginError('Please enter a username');
    usernameInput.focus();
    return;
  }
  if (!password) {
    showLoginError('Please enter a password');
    passwordInput.focus();
    return;
  }
  if (password.length < 4) {
    showLoginError('Password must be at least 4 characters');
    passwordInput.focus();
    return;
  }

  loginBtn.disabled = true;
  const btnText = mode === 'register' ? 'Creating account...' : 'Signing in...';
  loginBtn.textContent = btnText;
  hideLoginError();

  try {
    const result = await login(username, password);

    if (result.success) {
      // Hide modal
      document.getElementById('loginOverlay').classList.add('hidden');

      // Pull and merge remote state
      await store.initialSync();

      // Show user badge
      showUserBadge();

      // Boot the app
      bootApp();

      if (result.isNew) {
        toast.success(`Welcome, ${username}! Your progress will sync across devices.`);
      } else {
        toast.info(`Welcome back, ${username}!`);
      }
    } else {
      // If in register mode and user already exists, hint to sign in instead
      if (mode === 'register' && result.error === 'Wrong password') {
        showLoginError('This username is already taken. Try signing in instead.');
      } else {
        showLoginError(result.error || 'Login failed');
      }
    }
  } catch (err) {
    showLoginError('Connection error — try again');
    console.error('[CET] Login error:', err);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = mode === 'register' ? 'Create Account' : 'Sign In';
  }
}

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function hideLoginError() {
  const el = document.getElementById('loginError');
  if (el) el.style.display = 'none';
}

// ══════════════════════════════════════════════
// USER BADGE (sidebar)
// ══════════════════════════════════════════════

function showUserBadge() {
  const user = getCurrentUser();
  if (!user) return;

  const badge = document.getElementById('userBadge');
  if (!badge) return;

  const initial = user.username.charAt(0).toUpperCase();
  badge.innerHTML = `
    <div class="user-avatar">${initial}</div>
    <span class="user-name">${user.username}</span>
    <button class="user-logout" onclick="window.__cetLogout()" title="Sign out">⏻</button>
  `;
  badge.style.display = 'flex';

  // Expose logout globally
  window.__cetLogout = () => {
    logout();
    store.resetAll();
    location.reload();
  };
}

function updateSyncIndicator() {
  const indicator = document.getElementById('syncIndicator');
  if (!indicator) return;

  if (isFirebaseReady() && getCurrentUser()) {
    indicator.innerHTML = '<span class="sync-dot"></span> Synced';
  } else {
    indicator.innerHTML = '<span class="sync-dot offline"></span> Local only';
  }
}

/**
 * Update the sidebar streak display
 */
function updateSidebarStreak() {
  const streakEl = document.getElementById('streakCount');
  if (streakEl) {
    streakEl.textContent = store.get('streak') || 0;
  }
  // Listen for state changes
  store.subscribe('streak', (val) => {
    const el = document.getElementById('streakCount');
    if (el) el.textContent = val || 0;
  });
}

/**
 * Set up sidebar navigation clicks
 */
function setupSidebar() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      Audio.playClick();
      router.navigate(page);
    });
  });
}

/**
 * Set up sidebar footer buttons
 */
function setupFooter() {
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => Theme.toggle());
  }

  const muteBtn = document.getElementById('muteToggle');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const muted = Audio.toggleMute();
      muteBtn.textContent = muted ? '♩' : '♪';
      muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
      toast.info(muted ? 'Sound muted' : 'Sound unmuted');
    });
  }
}

/**
 * Animate sidebar nav icons with staggered bounce on first load
 */
function animateNavIcons() {
  document.querySelectorAll('.nav-item').forEach((item, i) => {
    const icon = item.querySelector('.nav-icon, :scope > :first-child');
    if (icon && !icon.classList.contains('nav-icon-bounce')) {
      icon.classList.add('nav-icon-bounce');
    }
  });
}

/**
 * Track mouse position on buttons for ripple effect
 */
function setupRippleEffect() {
  document.addEventListener('mousedown', (e) => {
    const btn = e.target.closest('.btn, .btn-icon, .badge-clickable, .card-hover, .subject-card');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty('--ripple-x', x + '%');
    btn.style.setProperty('--ripple-y', y + '%');
  });
}

/**
 * Set up global keyboard shortcuts
 */
function setupGlobalShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Skip if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    // D / d — toggle theme
    if (e.key === 'd' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      Theme.toggle();
    }

    // M / m — toggle mute
    if (e.key === 'm' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      const muted = Audio.toggleMute();
      const muteBtn = document.getElementById('muteToggle');
      if (muteBtn) muteBtn.textContent = muted ? '♩' : '♪';
      toast.info(muted ? 'Sound muted' : 'Sound unmuted');
    }

    // ? — show keyboard shortcuts help
    if (e.key === '?' && e.shiftKey) {
      e.preventDefault();
      showShortcutsHelp();
    }
  });
}

/**
 * Show keyboard shortcuts help modal
 */
function showShortcutsHelp() {
  const shortcuts = [
    { keys: '1-4', action: 'Select quiz answer A-D' },
    { keys: '← / →', action: 'Navigate questions/cards' },
    { keys: 'Space', action: 'Flip flashcard / Toggle timer' },
    { keys: 'K', action: 'Mark flashcard as Known' },
    { keys: 'R', action: 'Mark flashcard for Review' },
    { keys: '⌘K / Ctrl+K', action: 'Open search overlay' },
    { keys: '/', action: 'Open search (not in input)' },
    { keys: 'Esc', action: 'Close search/modal' },
    { keys: 'D', action: 'Toggle dark/light theme' },
    { keys: 'M', action: 'Toggle mute' },
    { keys: '?', action: 'Show this help' },
  ];

  const modal = document.createElement('div');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Keyboard Shortcuts');
  modal.style.cssText = `
    position:fixed;inset:0;background:oklch(0 0 0 / 0.6);backdrop-filter:blur(4px);
    z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px;
  `;
  modal.innerHTML = `
    <div style="background:var(--bg-elevated);border-radius:var(--radius-xl);padding:32px;max-width:480px;width:100%;box-shadow:var(--shadow-xl);">
      <h2 style="font-size:20px;font-weight:700;margin-bottom:20px;">⌨️ Keyboard Shortcuts</h2>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${shortcuts.map(s => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);">
            <span style="font-size:13px;color:var(--text-secondary);">${s.action}</span>
            <kbd style="background:var(--bg-hover);padding:2px 8px;border-radius:4px;font-size:12px;font-family:var(--font-mono);color:var(--text);border:1px solid var(--border);">${s.keys}</kbd>
          </div>
        `).join('')}
      </div>
      <div style="text-align:center;margin-top:20px;">
        <button class="btn btn-ghost" id="shortcutsCloseBtn">Close</button>
      </div>
    </div>
  `;
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

  // Escape key handler to close the modal
  const onEscape = (e) => { if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', onEscape); } };
  document.addEventListener('keydown', onEscape);

  // Focus trap — Tab cycles within modal
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
    else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
  });

  document.body.appendChild(modal);
  // Focus the close button on open
  const closeBtn = modal.querySelector('#shortcutsCloseBtn');
  if (closeBtn) closeBtn.focus();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}