/**
 * Stackable toast notification system
 * CET LMS
 */

class ToastManager {
  constructor() {
    this._container = null;
    this._toasts = [];
    this._maxVisible = 3;
  }

  /**
   * Initialize the toast container
   */
  init() {
    if (this._container) return;
    this._container = document.createElement('div');
    this._container.className = 'toast-container';
    this._container.setAttribute('aria-live', 'polite');
    document.body.appendChild(this._container);
  }

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {'success'|'error'|'info'|'warning'} type - Toast type
   * @param {number} duration - Auto-dismiss duration in ms
   */
  show(message, type = 'info', duration = 3000) {
    this.init();

    // Remove oldest if at max
    if (this._toasts.length >= this._maxVisible) {
      const oldest = this._toasts.shift();
      this._removeToast(oldest);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icons
    const icons = {
      success: '✓',
      error: '✗',
      info: 'ℹ️',
      warning: '⚠',
    };

    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    this._container.appendChild(toast);

    // Track it
    const toastObj = { el: toast, timer: null };
    this._toasts.push(toastObj);

    // Auto-dismiss
    toastObj.timer = setTimeout(() => {
      this._removeToast(toastObj);
    }, duration);

    return toastObj;
  }

  /**
   * Remove a toast with animation
   */
  _removeToast(toastObj) {
    const idx = this._toasts.indexOf(toastObj);
    if (idx > -1) this._toasts.splice(idx, 1);

    const { el } = toastObj;
    if (el && el.parentNode) {
      if (toastObj.timer) clearTimeout(toastObj.timer);
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 300);
    }
  }

  /**
   * Show a success toast
   */
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  /**
   * Show an error toast
   */
  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  /**
   * Show an info toast
   */
  info(message, duration) {
    return this.show(message, 'info', duration);
  }

  /**
   * Show a warning toast
   */
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  /**
   * Clear all toasts
   */
  clear() {
    // Iterate a copy to avoid mutation during splice in _removeToast
    [...this._toasts].forEach(t => this._removeToast(t));
    this._toasts = [];
  }
}

const toast = new ToastManager();
export default toast;