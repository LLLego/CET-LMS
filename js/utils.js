/**
 * Utility functions for CET LMS
 */

/**
 * Debounce a function call
 * @param {Function} fn - Function to debounce
 * @param {number} ms - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, ms = 150) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Throttle a function call
 * @param {Function} fn - Function to throttle
 * @param {number} ms - Minimum interval in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, ms = 200) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Shuffle an array (Fisher-Yates)
 * @param {Array} arr - Array to shuffle
 * @returns {Array} New shuffled array
 */
export function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Format a date relative to now
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export function timeAgo(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

/**
 * Format seconds to MM:SS
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Get today's date as a string key
 * @returns {string} Today's date string
 */
export function todayKey() {
  return new Date().toDateString();
}

/**
 * Get yesterday's date as a string key
 * @returns {string} Yesterday's date string
 */
export function yesterdayKey() {
  return new Date(Date.now() - 86400000).toDateString();
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Clamp a number between min and max
 * @param {number} val - Value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} Clamped value
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Safely parse JSON, returning fallback on error
 * @param {string} str - JSON string to parse
 * @param {*} fallback - Fallback value
 * @returns {*} Parsed value or fallback
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Create an element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes to set
 * @param {...(string|HTMLElement)} children - Children to append
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class' || key === 'className') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.assign(el.dataset, value);
    } else {
      el.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof HTMLElement) {
      el.appendChild(child);
    }
  }
  return el;
}

/**
 * Escape HTML entities to prevent XSS when injecting user/data content via innerHTML
 * @param {string} str - Raw string that may contain HTML
 * @returns {string} Escaped string safe for innerHTML
 */
export function escapeHTML(str) {
  if (!str) return '';
  const el = document.createElement('span');
  el.textContent = String(str);
  return el.innerHTML;
}