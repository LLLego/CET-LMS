/**
 * Search Overlay — Cmd+K / Ctrl+K command palette
 * CET LMS
 */

import { SUBJECTS } from '../data.js';
import router from '../router.js';
import { debounce } from '../utils.js';

class SearchOverlay {
  constructor() {
    this._overlay = null;
    this._input = null;
    this._results = null;
    this._isOpen = false;
    this._selectedIdx = -1;
    this._items = [];
    this._dataLoaded = false;
    this._dataLoadError = null;
  }

  /**
   * Initialize overlay
   */
  async init() {
    if (this._overlay) return;

    this._overlay = document.createElement('div');
    this._overlay.className = 'search-overlay';
    this._overlay.style.cssText = `
      display: none;
      position: fixed;
      inset: 0;
      background: oklch(0 0 0 / 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 99999;
      padding: 80px 16px;
      align-items: flex-start;
      justify-content: center;
    `;

    this._overlay.innerHTML = `
      <div style="width:100%;max-width:600px;background:var(--bg-elevated);border-radius:var(--radius-xl);box-shadow:var(--shadow-xl);overflow:hidden;">
        <div style="display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid var(--border);">
          <span style="color:var(--text-tertiary);font-size:16px;">⌕</span>
          <input type="text" id="searchInput" placeholder="Search subjects, chapters, questions..." 
            style="flex:1;background:none;border:none;color:var(--text);font-size:15px;font-family:inherit;outline:none;"
            autocomplete="off" spellcheck="false">
          <span style="font-size:11px;color:var(--text-tertiary);background:var(--bg-hover);padding:2px 8px;border-radius:4px;">ESC</span>
        </div>
        <div id="searchResults" style="max-height:400px;overflow-y:auto;padding:8px;"></div>
      </div>
    `;

    document.body.appendChild(this._overlay);

    this._input = this._overlay.querySelector('#searchInput');
    this._results = this._overlay.querySelector('#searchResults');

    // Inject keyframes for loading spinner (once)
    if (!document.getElementById('search-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'search-spinner-style';
      style.textContent = '@keyframes search-spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }

    // Load quiz, flashcard, and textbook data from JSON
    let failedSources = 0;
    const loadData = async (url, key) => {
      try {
        const res = await fetch(url);
        this[key] = await res.json();
      } catch (e) {
        console.error(`Failed to load ${url}:`, e);
        this[key] = {};
        failedSources++;
      }
    };
    await Promise.all([
      loadData('data/quiz_data.json', '_quizData'),
      loadData('data/flashcard_data.json', '_flashcardData'),
      loadData('data/textbook_data.json', '_textbookData')
    ]);

    this._dataLoaded = true;
    if (failedSources > 0) {
      this._dataLoadError = `${failedSources} data source(s) failed to load. Some searches may be incomplete.`;
    }

    // Refresh results if user has already typed something
    if (this._input && this._input.value.trim()) {
      this._search();
    }

    // Events
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();
    });

    this._input.addEventListener('input', debounce(() => this._search(), 150));
    this._input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowDown') { e.preventDefault(); this._navigate(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); this._navigate(-1); }
      if (e.key === 'Enter') { e.preventDefault(); this._select(); }
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
      // "/" to open (when not in an input)
      if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && !this._isOpen) {
        e.preventDefault();
        this.open();
      }
    });
  }

  /**
   * Toggle open/close
   */
  toggle() {
    if (this._isOpen) this.close();
    else this.open();
  }

  /**
   * Open the search overlay
   */
  open() {
    this.init();
    this._isOpen = true;
    this._overlay.style.display = 'flex';
    this._input.value = '';

    if (!this._dataLoaded) {
      this._results.innerHTML = `
        <div style="padding:32px 24px;text-align:center;color:var(--text-tertiary);font-size:14px;">
          <div style="margin-bottom:12px;">
            <div style="
              width:24px;height:24px;border:3px solid var(--border);
              border-top-color:var(--color-primary);border-radius:50%;
              animation:search-spin 0.8s linear infinite;margin:0 auto;
            "></div>
          </div>
          <div>Loading data sources...</div>
          <div style="font-size:12px;color:var(--text-tertiary);margin-top:4px;opacity:0.6;">
            Fetching quiz questions, flashcards, and textbook content
          </div>
        </div>
      `;
    } else {
      this._results.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-tertiary);font-size:14px;">Type to search subjects, chapters, questions, and flashcards...</div>';
    }

    this._selectedIdx = -1;
    this._items = [];
    setTimeout(() => this._input.focus(), 100);
  }

  /**
   * Close the search overlay
   */
  close() {
    this._isOpen = false;
    this._overlay.style.display = 'none';
  }

  /**
   * Perform the search
   */
  _search() {
    const query = this._input.value.trim().toLowerCase();
    if (!query) {
      this._results.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-tertiary);font-size:14px;">Type to search...</div>';
      this._items = [];
      return;
    }

    // Show loading banner if data hasn't finished loading
    if (!this._dataLoaded) {
      const warnMsg = this._dataLoadError
        ? `<div style="padding:10px 14px;margin:0 0 8px 0;background:var(--color-warning-bg, #fff3cd);color:var(--color-warning-text, #856404);border-radius:var(--radius-md);font-size:13px;">${this._dataLoadError}</div>`
        : '';
      this._results.innerHTML = `
        <div style="padding:32px 24px;text-align:center;color:var(--text-tertiary);font-size:14px;">
          <div style="margin-bottom:12px;">
            <div style="
              width:24px;height:24px;border:3px solid var(--border);
              border-top-color:var(--color-primary);border-radius:50%;
              animation:search-spin 0.8s linear infinite;margin:0 auto;
            "></div>
          </div>
          <div>Loading data sources — results limited</div>
          <div style="font-size:12px;color:var(--text-tertiary);margin-top:4px;opacity:0.6;">
            Subjects and chapters available; full content coming...
          </div>
        </div>
        ${warnMsg}
      `;
      this._items = [];
      return;
    }

    this._items = [];
    const results = [];

    // Search subjects
    SUBJECTS.forEach(s => {
      if (s.name.toLowerCase().includes(query) || s.id.includes(query)) {
        results.push({ type: 'subject', label: `${s.icon} ${s.name}`, path: 'subject', params: { id: s.id } });
        this._items.push({ type: 'subject', id: s.id, path: 'subject', params: { id: s.id } });
      }
    });

    // Search chapters
    SUBJECTS.forEach(s => {
      s.chaptersList.forEach((ch, i) => {
        if (ch.toLowerCase().includes(query)) {
          results.push({ type: 'chapter', label: `${s.icon} ${ch}`, path: 'subject', params: { id: s.id } });
          this._items.push({ type: 'chapter', id: `${s.id}-${i}`, path: 'subject', params: { id: s.id } });
        }
      });
    });

    // Search textbook content (from textbook_data.json)
    const tbData = this._textbookData || {};
    Object.entries(tbData).forEach(([subjId, chapters]) => {
      const subj = SUBJECTS.find(s => s.id === subjId);
      chapters.forEach(ch => {
        if (ch.title.toLowerCase().includes(query)) {
          results.push({ type: 'reader', label: `▸ ${ch.title}`, path: 'reader', params: { subjectId: subjId, chapterId: ch.id } });
          this._items.push({ type: 'reader', id: `${subjId}-${ch.id}`, path: 'reader', params: { subjectId: subjId, chapterId: ch.id } });
        }
      });
    });

    // Search questions (from quiz_data.json, nested by chapter)
    const qData = this._quizData || {};
    Object.entries(qData).forEach(([subjId, chapters]) => {
      const subj = SUBJECTS.find(s => s.id === subjId);
      Object.values(chapters).forEach(ch => {
        (ch.quizzes || []).forEach((q, i) => {
          if (q.q.toLowerCase().includes(query)) {
            const snippet = q.q.length > 80 ? q.q.slice(0, 80) + '...' : q.q;
            results.push({ type: 'question', label: `❓ ${snippet}`, path: 'quiz', params: { subjectId: subjId } });
            this._items.push({ type: 'question', id: `${subjId}-${i}`, path: 'quiz', params: { subjectId: subjId } });
          }
        });
      });
    });

    // Search flashcards (from JSON, nested by chapter)
    const fcData = this._flashcardData || {};
    Object.entries(fcData).forEach(([subjId, chapters]) => {
      const subj = SUBJECTS.find(s => s.id === subjId);
      Object.values(chapters).forEach(ch => {
        (ch.flashcards || []).forEach(card => {
          if (card.term.toLowerCase().includes(query) || (card.def && card.def.toLowerCase().includes(query))) {
            results.push({ type: 'flashcard', label: `♢ ${card.term} — ${(card.def || '').slice(0, 60)}`, path: 'flashcards', params: { subjectId: subjId } });
            this._items.push({ type: 'flashcard', id: `${subjId}-${card.term}`, path: 'flashcards', params: { subjectId: subjId } });
          }
        });
      });
    });

    // Render results
    if (results.length === 0) {
      this._results.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-tertiary);font-size:14px;">No results found.</div>';
      this._selectedIdx = -1;
      return;
    }

    this._results.innerHTML = results.map((r, i) => `
      <div class="search-result-item" data-idx="${i}" style="
        display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:var(--radius-md);
        cursor:pointer;font-size:14px;color:var(--text);transition:background 0.1s;
        ${i === 0 ? 'background:var(--color-primary-glow);' : ''}
      " onclick="searchOverlay._selectItem(${i})" onmouseenter="searchOverlay._highlight(${i})">
        <span>${r.label}</span>
      </div>
    `).join('');

    this._selectedIdx = 0;
  }

  /**
   * Navigate results
   */
  _navigate(dir) {
    if (this._items.length === 0) return;
    this._selectedIdx = Math.max(0, Math.min(this._items.length - 1, this._selectedIdx + dir));
    this._highlight(this._selectedIdx);
    const el = this._results.querySelector(`[data-idx="${this._selectedIdx}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  /**
   * Highlight a result item
   */
  _highlight(idx) {
    this._results.querySelectorAll('.search-result-item').forEach(el => {
      el.style.background = '';
    });
    const el = this._results.querySelector(`[data-idx="${idx}"]`);
    if (el) el.style.background = 'var(--color-primary-glow)';
    this._selectedIdx = idx;
  }

  /**
   * Select the currently highlighted item
   */
  _select() {
    if (this._selectedIdx >= 0 && this._selectedIdx < this._items.length) {
      this._selectItem(this._selectedIdx);
    }
  }

  /**
   * Select a specific item and navigate
   */
  _selectItem(idx) {
    const item = this._items[idx];
    if (item) {
      this.close();
      router.navigate(item.path, item.params);
    }
  }

  _getItemAt(idx) {
    return this._items[idx] || null;
  }
}

const searchOverlay = new SearchOverlay();

// Expose globally
window.searchOverlay = searchOverlay;

export default searchOverlay;