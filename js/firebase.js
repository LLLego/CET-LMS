/**
 * Firebase initialization and RTDB sync for CET LMS
 * Uses Firebase compat SDK (loaded in index.html as global `firebase`)
 */

// ══════════════════════════════════════════════
// FIREBASE CONFIG — Replace with your project
// ══════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://REPLACE_WITH_YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
let _db = null;
let _auth = null;
let _currentUser = null;      // { username, uid }
let _userRef = null;           // RTDB ref to cet/users/{uid}
let _firebaseReady = false;
let _onSyncCallbacks = [];     // called when remote data arrives
let _saveTimer = null;
let _isRemoteUpdate = false;   // flag to prevent save loops

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
export function isFirebaseReady() {
  return _firebaseReady;
}

export function getCurrentUser() {
  return _currentUser;
}

export function initFirebase() {
  return new Promise((resolve) => {
    if (!window.firebase || !firebase.database) {
      console.warn('[CET] Firebase SDK not loaded — running in local-only mode');
      resolve(false);
      return;
    }

    if (!FIREBASE_CONFIG.apiKey || FIREBASE_CONFIG.apiKey === "REPLACE_WITH_YOUR_API_KEY") {
      console.warn('[CET] Firebase config not set — running in local-only mode');
      resolve(false);
      return;
    }

    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      _auth = firebase.auth();
      _db = firebase.database();

      // Authenticate anonymously — RTDB rules use auth.uid mapped to usernames
      _auth.signInAnonymously()
        .then(() => {
          _firebaseReady = true;
          console.log('[CET] Firebase ready (anonymous auth)');
          resolve(true);
        })
        .catch(err => {
          console.warn('[CET] Anonymous auth failed:', err.message);
          resolve(false);
        });
    } catch (err) {
      console.warn('[CET] Firebase init failed:', err.message);
      resolve(false);
    }
  });
}

// ══════════════════════════════════════════════
// AUTH — Username + Password (SHA-256)
// ══════════════════════════════════════════════
const SALT = 'cet-lms-review-2026';

async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw + SALT);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function makeUid(username) {
  // Deterministic UID from username — used as RTDB path key
  return username.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

/**
 * Check if a username is already registered
 */
export async function checkUsername(username) {
  if (!_firebaseReady || !_db) return { exists: false, firebase: false };
  const uid = makeUid(username);
  const snap = await _db.ref(`cet/users/${uid}/auth`).once('value');
  const data = snap.val();
  return {
    exists: !!(data && data.passHash),
    firebase: true
  };
}

/**
 * Login or register
 * @returns {{ success: boolean, isNew: boolean, error?: string }}
 */
export async function login(username, password) {
  if (!username || !password) {
    return { success: false, error: 'Username and password required' };
  }

  const uid = makeUid(username);
  const passHash = await hashPassword(password);

  if (!_firebaseReady || !_db) {
    // Offline mode — just set local user
    _currentUser = { username, uid };
    localStorage.setItem('cet_user', JSON.stringify(_currentUser));
    return { success: true, isNew: false, offline: true };
  }

  const authRef = _db.ref(`cet/users/${uid}/auth`);
  const snap = await authRef.once('value');
  const existing = snap.val();

  if (existing && existing.passHash) {
    // Existing user — verify password
    if (existing.passHash !== passHash) {
      return { success: false, error: 'Wrong password' };
    }
  } else {
    // New user — register
    await authRef.set({
      passHash,
      createdAt: Date.now(),
      username
    });
  }

  _currentUser = { username, uid };
  _userRef = _db.ref(`cet/users/${uid}/progress`);
  localStorage.setItem('cet_user', JSON.stringify(_currentUser));

  // Start listening for remote changes
  _attachRemoteListener();

  return { success: true, isNew: !existing };
}

/**
 * Auto-login from saved session
 */
export async function autoLogin() {
  const saved = localStorage.getItem('cet_user');
  if (!saved) return false;

  try {
    const { username, uid } = JSON.parse(saved);
    if (!username || !uid) return false;

    _currentUser = { username, uid };

    if (_firebaseReady && _db) {
      _userRef = _db.ref(`cet/users/${uid}/progress`);
      _attachRemoteListener();
    }

    return true;
  } catch {
    return false;
  }
}

export function logout() {
  _currentUser = null;
  _userRef = null;
  localStorage.removeItem('cet_user');
  // Detach listener
  if (_db) {
    _db.ref().off();
  }
}

// ══════════════════════════════════════════════
// RTDB SYNC
// ══════════════════════════════════════════════

// Keys that get synced to Firebase
const SYNCED_KEYS = [
  'streak', 'answered', 'correct', 'sessions',
  'subjectProgress', 'flashcardProgress',
  'lastStudyDate', 'flashcardKnown', 'flashcardReview',
  'lastQuizState', 'bookmarkedSections', 'readingProgress',
  'settings'
];

/**
 * Listen for remote state changes
 */
function _attachRemoteListener() {
  if (!_userRef) return;

  _userRef.on('value', (snap) => {
    const remote = snap.val();
    if (!remote) return;

    _isRemoteUpdate = true;

    // Merge remote into local state
    const current = {};
    for (const key of SYNCED_KEYS) {
      if (remote[key] !== undefined) {
        current[key] = remote[key];
      }
    }

    // Notify listeners (store.js will pick this up)
    for (const cb of _onSyncCallbacks) {
      try { cb(current); } catch (e) { console.error('[CET] Sync callback error:', e); }
    }

    // Clear flag after a tick
    setTimeout(() => { _isRemoteUpdate = false; }, 100);
  });
}

/**
 * Save state to Firebase (debounced — batches rapid updates)
 */
export function saveToFirebase(state) {
  if (!_firebaseReady || !_userRef || !_currentUser) return;
  if (_isRemoteUpdate) return; // Don't echo remote changes back

  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => {
    const payload = {};
    for (const key of SYNCED_KEYS) {
      if (state[key] !== undefined) {
        payload[key] = state[key];
      }
    }
    payload._lastSync = Date.now();
    _userRef.update(payload).catch(err => {
      console.warn('[CET] Firebase save failed:', err.message);
    });
  }, 300); // 300ms debounce
}

/**
 * Pull remote state once (for initial merge)
 */
export async function pullFromFirebase() {
  if (!_userRef) return null;
  const snap = await _userRef.once('value');
  return snap.val();
}

/**
 * Register a callback for when remote data arrives
 */
export function onRemoteSync(callback) {
  _onSyncCallbacks.push(callback);
  return () => {
    _onSyncCallbacks = _onSyncCallbacks.filter(cb => cb !== callback);
  };
}

/**
 * Check if the current update is from remote (to prevent save loops)
 */
export function isRemoteUpdate() {
  return _isRemoteUpdate;
}
