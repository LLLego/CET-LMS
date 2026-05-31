/**
 * Reactive state management for CET LMS
 * Proxy-based store with change notifications
 * Integrates with Firebase RTDB for cross-device sync
 */

import { loadState, saveState, getDefaultState } from './db.js';
import { todayKey, yesterdayKey } from './utils.js';
import { saveToFirebase, onRemoteSync, isRemoteUpdate, pullFromFirebase } from './firebase.js';

class Store {
  constructor() {
    this._state = loadState();
    this._listeners = new Map();
    this._idCounter = 0;
    this._firebaseSynced = false;

    // Listen for remote state changes
    onRemoteSync((remoteState) => {
      this._applyRemote(remoteState);
    });
  }

  /**
   * Apply remote state from Firebase (merge, don't overwrite)
   * @private
   */
  _applyRemote(remote) {
    const defaults = getDefaultState();
    let changed = false;

    for (const key of Object.keys(remote)) {
      if (key === '_lastSync') continue;
      const remoteVal = remote[key];
      const localVal = this._state[key];

      // For objects (subjectProgress, flashcardKnown, etc.), deep merge
      if (remoteVal && typeof remoteVal === 'object' && !Array.isArray(remoteVal) &&
          localVal && typeof localVal === 'object' && !Array.isArray(localVal)) {
        const merged = { ...localVal };
        for (const k of Object.keys(remoteVal)) {
          if (JSON.stringify(merged[k]) !== JSON.stringify(remoteVal[k])) {
            merged[k] = remoteVal[k];
            changed = true;
          }
        }
        this._state[key] = merged;
      } else {
        // For primitives and arrays, prefer the newer value
        if (JSON.stringify(localVal) !== JSON.stringify(remoteVal)) {
          this._state[key] = remoteVal;
          changed = true;
        }
      }
    }

    if (changed) {
      // Persist merged state to localStorage
      saveState(this._state);
      // Notify all listeners
      this._notify('*', this._state, null);
    }
  }

  /**
   * Initial sync: pull remote state and merge
   */
  async initialSync() {
    if (this._firebaseSynced) return;
    const remote = await pullFromFirebase();
    if (remote) {
      this._applyRemote(remote);
    }
    this._firebaseSynced = true;
  }

  /**
   * Get the full state or a specific key
   */
  get(key) {
    if (key) return this._state[key];
    return this._state;
  }

  /**
   * Update state and persist
   */
  set(key, value) {
    const old = this._state[key];
    this._state[key] = value;
    this._save();
    this._notify(key, value, old);
    return this;
  }

  /**
   * Merge an object into state
   */
  merge(obj) {
    for (const [key, value] of Object.entries(obj)) {
      const old = this._state[key];
      this._state[key] = value;
      this._notify(key, value, old);
    }
    this._save();
    return this;
  }

  /**
   * Update a nested path using dot notation
   */
  update(path, value) {
    const keys = path.split('.');
    let current = this._state;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    const lastKey = keys[keys.length - 1];
    const old = current[lastKey];
    current[lastKey] = value;
    this._save();
    this._notify(path, value, old);
    return this;
  }

  /**
   * Get subject progress for a subject
   */
  getSubjectProgress(subjectId) {
    if (!this._state.subjectProgress[subjectId]) {
      this._state.subjectProgress[subjectId] = { answered: 0, correct: 0 };
    }
    return this._state.subjectProgress[subjectId];
  }

  /**
   * Record a quiz answer
   */
  recordAnswer(subjectId, isCorrect) {
    const prog = this.getSubjectProgress(subjectId);
    prog.answered++;
    if (isCorrect) prog.correct++;
    this._state.answered++;
    if (isCorrect) this._state.correct++;
    this._updateStreak();
    this._save();
    this._notify('subjectProgress', this._state.subjectProgress);
    return this;
  }

  /**
   * Update streak based on activity
   */
  _updateStreak() {
    const today = todayKey();
    const yesterday = yesterdayKey();

    if (this._state.lastStudyDate === today) return;

    if (this._state.lastStudyDate === yesterday) {
      this._state.streak = (this._state.streak || 0) + 1;
    } else {
      this._state.streak = 1;
    }
    this._state.lastStudyDate = today;
  }

  /**
   * Log a study session
   */
  logSession(subject, durationMinutes) {
    this._state.sessions.push({
      date: new Date().toISOString(),
      subject: subject,
      duration: durationMinutes,
    });
    this._updateStreak();
    this._save();
    this._notify('sessions', this._state.sessions);
    return this;
  }

  /**
   * Get all stored data
   */
  getAll() {
    return { ...this._state };
  }

  /**
   * Reset all data to defaults
   */
  resetAll() {
    this._state = getDefaultState();
    this._save();
    this._notify('*', this._state, null);
    return this;
  }

  /**
   * Subscribe to changes on a specific key
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    const id = ++this._idCounter;
    if (!this._listeners.has(key)) this._listeners.set(key, new Map());
    this._listeners.get(key).set(id, callback);
    return () => {
      const map = this._listeners.get(key);
      if (map) map.delete(id);
    };
  }

  /**
   * Notify listeners of a change
   */
  _notify(key, newVal, oldVal) {
    const listeners = this._listeners.get(key);
    if (listeners) {
      listeners.forEach(cb => cb(newVal, oldVal));
    }
    // Also notify wildcard listeners
    const wildListeners = this._listeners.get('*');
    if (wildListeners) {
      wildListeners.forEach(cb => cb(key, newVal, oldVal));
    }
  }

  /**
   * Persist state to localStorage and Firebase
   */
  _save() {
    saveState(this._state);
    saveToFirebase(this._state);
  }
}

// Singleton instance
const store = new Store();
export default store;