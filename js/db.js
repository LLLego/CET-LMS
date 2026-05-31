/**
 * localStorage abstraction layer with versioning
 * CET LMS — data persistence module
 */

const STORAGE_KEY = 'cet_lms';
const CURRENT_VERSION = 2;

/**
 * Default state structure
 * @returns {Object} Fresh default state
 */
export function getDefaultState() {
  return {
    version: CURRENT_VERSION,
    streak: 0,
    answered: 0,
    correct: 0,
    sessions: [],
    subjectProgress: {},
    flashcardProgress: {},
    lastStudyDate: null,
    flashcardKnown: {},
    flashcardReview: {},
    lastQuizState: null,
    bookmarkedSections: [],
    readingProgress: {},
    settings: {
      soundEnabled: true,
      soundVolume: 0.3,
      autoAdvance: true,
    },
    theme: null, // null = system preference
  };
}

/**
 * Load state from localStorage with migration
 * @returns {Object} Loaded state (merged with defaults)
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();

    const saved = JSON.parse(raw);
    const defaults = getDefaultState();

    // Migrate from old version if needed
    if (saved.version !== CURRENT_VERSION) {
      return migrateState(saved, defaults);
    }

    // Deep merge saved with defaults (in case new keys were added)
    return deepMerge(defaults, saved);
  } catch (e) {
    console.warn('Failed to load state:', e);
    return getDefaultState();
  }
}

/**
 * Save state to localStorage
 * @param {Object} state - Current application state
 */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state:', e);
    // Notify user via Toast if available
    import('../components/Toast.js').then(m => {
      m.default.error('Storage is full. Some data may not be saved.');
    }).catch(() => {});
    // Fallback: try to trim session history and retry
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
      try {
        const trimmed = { ...state };
        if (trimmed.sessions && trimmed.sessions.length > 5) {
          trimmed.sessions = trimmed.sessions.slice(-5);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
          console.warn('Recovered by trimming session history.');
        }
      } catch (retryErr) {
        console.error('Retry after trimming also failed:', retryErr);
      }
    }
  }
}

/**
 * Deep merge: recursively merge `source` into `target`.
 * Arrays and non-plain-object values from source overwrite target.
 * Preserves nested default keys that are missing in source.
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Migrate state from older versions
 * @param {Object} saved - Saved state from localStorage
 * @param {Object} defaults - Default state
 * @returns {Object} Migrated state
 */
function migrateState(saved, defaults) {
  const migrated = deepMerge(defaults, saved);
  migrated.version = CURRENT_VERSION;

  // Version 1 -> 2: Add settings if missing
  if (!saved.version || saved.version < 2) {
    migrated.settings = defaults.settings;
    migrated.bookmarkedSections = saved.bookmarkedSections || [];
    migrated.readingProgress = saved.readingProgress || {};
  }

  return migrated;
}

/**
 * Clear all stored data
 */
export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export state as downloadable JSON
 * @param {Object} state - Current state
 */
export function exportData(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cet-lms-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}