/**
 * Hash-based SPA router with page transitions
 * CET LMS
 */

class Router {
  constructor() {
    this.currentPage = null;
    this.routes = {};
    this._params = {};
    this._isTransitioning = false;
    this._pendingNav = null;
  }

  /**
   * Register a route handler
   * @param {string} path - Route path (e.g., 'dashboard', 'subject/:id')
   * @param {Function} handler - Function to call when route is activated
   */
  register(path, handler) {
    this.routes[path] = handler;
    return this;
  }

  /**
   * Navigate to a route programmatically
   * @param {string} path - Route path
   * @param {Object} params - Route parameters
   */
  navigate(path, params = {}) {
    // Build hash from path + params
    let hash = '#' + path;
    if (params.id) hash += '/' + params.id;
    if (params.subjectId) hash += '/' + params.subjectId + '/' + (params.chapterId || '');
    window.location.hash = hash;
  }

  /**
   * Handle hash changes
   */
  _onHashChange() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const parts = hash.split('/');
    const path = parts[0];
    // Validate path — only alphanumeric and hyphens allowed (prevent CSS selector injection)
    if (!/^[a-zA-Z0-9-]+$/.test(path)) return;
    const params = {};

    // Extract parameters from path
    if (path === 'subject' && parts[1]) params.id = parts[1];
    if (path === 'reader' && parts[1]) {
      params.subjectId = parts[1];
      params.chapterId = parts[2] || null;
    }
    if (path === 'quiz' && parts[1]) {
      params.subjectId = parts[1];
      if (parts[2]) params.chapterId = parts[2];
    }

    // Check for quiz-subject special case
    if (path === 'quiz-subject' && parts[1]) {
      params.subjectId = parts[1];
    }

    this._transition(path, params);
  }

  /**
   * Transition between pages with animation
   */
  _transition(path, params) {
    if (this._isTransitioning) {
      this._pendingNav = { path, params };
      return;
    }
    const handler = this.routes[path];

    if (!handler) {
      // If route not found, go to dashboard
      if (path !== 'dashboard') {
        this.navigate('dashboard');
        return;
      }
    }

    // Update nav active state with animation
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-page="${path}"]`);
    if (navItem && !params.id && !params.subjectId) {
      navItem.classList.add('active');
      // Bounce animation on active nav icon
      const navIcon = navItem.querySelector('.nav-icon, .nav-item > :first-child');
      if (navIcon) {
        navIcon.style.animation = 'none';
        navIcon.offsetHeight; // reflow
        navIcon.style.animation = 'bounce 0.4s var(--ease-bounce)';
      }
    }

    this._isTransitioning = true;

    // Fade out current page with slide
    const currentEl = document.querySelector('.page.active');
    const doTransition = !!currentEl && currentEl.id !== `page-${path}`;

    if (doTransition) {
      currentEl.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
      currentEl.style.opacity = '0';
      currentEl.style.transform = 'translateY(10px) scale(0.98)';
    }

    // Render new page after transition
    const delay = doTransition ? 200 : 50;
    setTimeout(() => {
      if (doTransition && currentEl) {
        currentEl.classList.remove('active');
        currentEl.style.opacity = '';
        currentEl.style.transform = '';
        currentEl.style.transition = '';
      }

      // Call the route handler
      if (handler) {
        handler(params);
      }

      // Activate the new page with slide + fade in
      const pageId = this._getPageId(path, params);
      const newEl = document.getElementById(pageId);
      if (newEl) {
        newEl.classList.add('active');
        newEl.style.opacity = '0';
        newEl.style.transform = 'translateY(16px)';
        requestAnimationFrame(() => {
          newEl.style.transition = 'opacity 0.3s ease, transform 0.3s var(--ease-out)';
          newEl.style.opacity = '1';
          newEl.style.transform = 'translateY(0)';
          // Clean up inline styles after animation
          setTimeout(() => {
            newEl.style.transition = '';
            newEl.style.opacity = '';
            newEl.style.transform = '';
          }, 350);
        });
      }
      this.currentPage = path;
      this._params = params;
      this._isTransitioning = false;
      // Process any queued navigation
      if (this._pendingNav) {
        const pending = this._pendingNav;
        this._pendingNav = null;
        this._transition(pending.path, pending.params);
      }
    }, delay);
  }

  /**
   * Get the DOM element ID for a route
   */
  _getPageId(path, params) {
    if (path === 'subject' && params.id) return 'page-subject-detail';
    if (path === 'reader') return 'page-reader';
    return 'page-' + path;
  }

  /**
   * Get current route parameters
   */
  getParams() {
    return this._params;
  }

  /**
   * Get current page name
   */
  getCurrentPage() {
    return this.currentPage;
  }

  /**
   * Initialize the router
   */
  init() {
    window.addEventListener('hashchange', () => this._onHashChange());

    // Handle initial load
    if (!window.location.hash || window.location.hash === '#') {
      window.location.hash = '#dashboard';
    } else {
      this._onHashChange();
    }
  }
}

const router = new Router();
export default router;