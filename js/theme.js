/**
 * Light/Dark theme manager
 * CET LMS — respects system preference, persists choice
 */

const Theme = {
  current: 'dark',

  /**
   * Get preferred theme: localStorage > system preference > dark
   */
  getPreferred() {
    let saved = null;
    try { saved = localStorage.getItem('cet-theme'); } catch (e) { /* private browsing */ }
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  },

  /**
   * Apply theme to the document
   */
  set(theme) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('cet-theme', theme); } catch (e) { /* private browsing */ }

    // Update toggle button if it exists
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☼' : '☽';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  },

  /**
   * Toggle between light and dark
   */
  toggle() {
    const newTheme = this.current === 'dark' ? 'light' : 'dark';
    this.set(newTheme);
    // Play a subtle click sound
    import('./audio.js').then(m => {
      m.default.playClick && m.default.playClick();
    });
    return newTheme;
  },

  /**
   * Initialize on page load
   */
  init() {
    // Remove preload class after a short delay to enable smooth transitions
    document.documentElement.classList.add('preload');
    setTimeout(() => {
      document.documentElement.classList.remove('preload');
    }, 100);

    this.set(this.getPreferred());

    // Listen for system preference changes
    const darkModeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMedia.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a preference
      let userTheme = null;
      try { userTheme = localStorage.getItem('cet-theme'); } catch (e) { /* private browsing */ }
      if (!userTheme) {
        this.set(e.matches ? 'dark' : 'light');
      }
    });
  },
};

export default Theme;