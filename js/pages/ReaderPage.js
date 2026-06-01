/**
 * Textbook Reader page — Unified selection flow
 * Subject → Chapter → Content
 * CET LMS
 */

import store from '../store.js';
import { SUBJECTS } from '../data.js';
import Audio from '../audio.js';
import router from '../router.js';
import toast from '../components/Toast.js';
import { renderSubjectSelection } from '../components/SubjectSelect.js';
import { renderChapterSelection } from '../components/ChapterSelect.js';
import { matchDiagram } from '../components/Diagrams.js';
import { escapeHTML } from '../utils.js';

let readerState = null;
let fontSize, useSerif, useNightMode;
try {
  const saved = JSON.parse(localStorage.getItem('readerSettings'));
  fontSize = saved?.fontSize ?? 19;
  useSerif = saved?.useSerif ?? false;
  useNightMode = saved?.useNightMode ?? false;
} catch {
  fontSize = 19;
  useSerif = false;
  useNightMode = false;
}

// Fetch caches — shared Promises deduplicate concurrent requests
let chaptersPromise = null;
let sectionsPromise = null;

/**
 * Load chapters.json with caching (shared Promise deduplicates concurrent calls)
 */
function loadChapters() {
  if (chaptersPromise) return chaptersPromise;
  chaptersPromise = fetch('data/extracted/chapters.json')
    .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .catch(err => { chaptersPromise = null; throw err; });
  return chaptersPromise;
}

/**
 * Load sections.json with caching (shared Promise deduplicates concurrent calls)
 */
function loadSections() {
  if (sectionsPromise) return sectionsPromise;
  sectionsPromise = fetch('data/extracted/sections.json')
    .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .catch(err => { sectionsPromise = null; throw err; });
  return sectionsPromise;
}

/**
 * Get total content length for a section
 */
function getSectionContentLength(section) {
  if (!section) return 0;
  const blocks = section.content || section.blocks || [];
  return blocks.reduce((sum, b) => sum + (b.value || b.text || '').length, 0);
}

/**
 * Check if a section is sparse (< 100 chars of content)
 */
function isSparseSection(section) {
  return getSectionContentLength(section) < 100;
}

/**
 * Find the next non-sparse section index starting from `from` (inclusive).
 * Returns `from` if it's not sparse, or the next non-sparse, or -1 if none.
 */
function findNextSubstantialSection(sections, from) {
  for (let i = from; i < sections.length; i++) {
    if (!isSparseSection(sections[i])) return i;
  }
  // Wrap around and check from start
  for (let i = 0; i < from; i++) {
    if (!isSparseSection(sections[i])) return i;
  }
  return from; // fallback
}

/**
 * Render the textbook reader page
 * @param {Object} params - Route params { subjectId, chapterId }
 */
export default function renderReader(params = {}) {
  const content = document.getElementById('readerContent');
  if (!content) return;

  const { subjectId, chapterId } = params || {};

  // No subject selected - show subject selection
  if (!subjectId) {
    content.innerHTML = `
      <div class="page-header">
        <h2>▸ Textbook Reader</h2>
        <p class="subtitle">Select a subject to start reading</p>
      </div>
      ${renderSubjectSelectionWrapper()}
    `;
    return;
  }

  // Subject selected but no chapter - show chapter selection
  if (!chapterId) {
    showChapterSelection(subjectId);
    return;
  }

  // Both subject and chapter selected - show content
  showChapterContent(subjectId, chapterId);
}

/**
 * Render subject selection with click handler
 */
function renderSubjectSelectionWrapper() {
  return `
    <div class="subject-selection-grid">
      ${SUBJECTS.map(subj => `
        <div 
          class="subject-card" 
          data-subject="${subj.id}"
          onclick="handleReaderSubjectSelect('${subj.id}')"
          onkeydown="if(event.key==='Enter'||event.key===' ')handleReaderSubjectSelect('${subj.id}')"
          tabindex="0"
          role="button"
        >
          <div class="subject-icon" style="background: ${subj.color}20; color: ${subj.color}">
            ${subj.icon}
          </div>
          <h3>${subj.name}</h3>
          <p class="subject-chapters">${subj.chapters}</p>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Handle subject selection for reader
 */
window.handleReaderSubjectSelect = function(subjectId) {
  Audio.playClick();
  router.navigate('reader', { subjectId });
};

/**
 * Render a centered loading spinner
 */
function renderSpinner(label) {
  return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;">
      <div class="animate-spin" style="width:36px;height:36px;border:3px solid var(--border);border-top-color:var(--color-primary);border-radius:50%;margin-bottom:16px;"></div>
      <p style="color:var(--text-secondary);font-size:15px;">${label}</p>
    </div>
  `;
}

/**
 * Show chapter selection for a subject
 */
function showChapterSelection(subjectId) {
  const content = document.getElementById('readerContent');
  if (!content) return;

  // Only show spinner if data isn't cached yet (prevents flash on subsequent navigations)
  if (!chaptersPromise) {
    content.innerHTML = renderSpinner('Loading chapters...');
  }

  // Load chapters for this subject from extracted data
  loadChapters()
    .then(allChapters => {
      const subjectChapters = allChapters.filter(ch => ch.subject_id === subjectId);
      
      if (subjectChapters.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <p>No chapters available for this subject yet.</p>
            <button class="btn btn-primary" onclick="router.navigate('reader')">← Back</button>
          </div>
        `;
        return;
      }

      content.innerHTML = renderChapterSelection('reader', subjectId, subjectChapters);
    })
    .catch(err => {
      console.error('Error loading chapters:', err);
      content.innerHTML = `
        <div class="empty-state">
          <p>Failed to load chapters. Please try again.</p>
          <button class="btn btn-primary" onclick="router.navigate('reader', { subjectId: '${escapeHTML(subjectId)}' })">← Retry</button>
        </div>
      `;
      toast.error('Failed to load chapters.');
    });
}

/**
 * Show chapter content
 */
function showChapterContent(subjectId, chapterId) {
  const content = document.getElementById('readerContent');
  if (!content) return;

  // Only show spinner if data isn't cached yet (prevents flash on subsequent navigations)
  if (!chaptersPromise || !sectionsPromise) {
    content.innerHTML = renderSpinner('Loading chapter content...');
  }

  // Load chapter data (cached after first fetch)
  Promise.all([
    loadChapters(),
    loadSections()
  ])
  .then(([allChapters, allSections]) => {
    const chapter = allChapters.find(ch => 
      ch.subject_id === subjectId && 
      (ch.id === chapterId || ch.number.toString() === chapterId.toString())
    );

    if (!chapter) {
      content.innerHTML = `
        <div class="empty-state">
          <p>Chapter not found.</p>
          <button class="btn btn-primary" onclick="router.navigate('reader', { subjectId: '${escapeHTML(subjectId)}' })">← Back to chapters</button>
        </div>
      `;
      return;
    }

    // Get sections for this chapter, sorted by section number (e.g. 1.1, 1.2, 1.3, 1.4, …)
    const sections = allSections
      .filter(sec => sec.chapter_id === chapter.id)
      .sort((a, b) => {
        const parseNum = s => (s.section_number || s.number || '0').toString().split('.').map(Number);
        const [aMaj = 0, aMin = 0] = parseNum(a);
        const [bMaj = 0, bMin = 0] = parseNum(b);
        return aMaj - bMaj || aMin - bMin;
      });
    
    // Start at first non-sparse section
    const startIndex = findNextSubstantialSection(sections, 0);
    
    readerState = { 
      subjectId, 
      chapter, 
      sections,
      currentSection: startIndex 
    };

    renderChapter();
  })
  .catch(err => {
    console.error('Error loading chapter:', err);
    content.innerHTML = `
      <div class="empty-state">
        <p>Failed to load chapter content. Please try again.</p>
        <button class="btn btn-primary" onclick="router.navigate('reader', { subjectId: '${escapeHTML(subjectId)}', chapterId: '${escapeHTML(chapterId)}' })">← Retry</button>
      </div>
    `;
    toast.error('Failed to load chapter content.');
  });
}

/**
 * Render chapter content with sections
 */
function renderChapter() {
  if (!readerState) return;
  
  const { chapter, sections } = readerState;
  const subject = SUBJECTS.find(s => s.id === readerState.subjectId);
  
  const content = document.getElementById('readerContent');
  if (!content) return;

  const currentSec = sections[readerState.currentSection];
  const isCurrentSparse = isSparseSection(currentSec);
  const prevIdx = readerState.currentSection > 0 ? readerState.currentSection - 1 : -1;
  const nextIdx = readerState.currentSection < sections.length - 1 ? readerState.currentSection + 1 : -1;
  const prevSec = prevIdx >= 0 ? sections[prevIdx] : null;
  const nextSec = nextIdx >= 0 ? sections[nextIdx] : null;

  content.innerHTML = `
    <div class="reader-layout">
      <!-- Sidebar with section list -->
      <div class="reader-outline">
        <button class="back-btn" onclick="router.navigate('reader', { subjectId: '${escapeHTML(readerState.subjectId)}' })" style="margin-bottom: var(--space-3);">
          ← Back to chapters
        </button>
        <h2>${subject ? subject.icon : '▸'} ${chapter.title.replace(/^#+\s*/, '')}</h2>
        ${sections.map((sec, i) => {
          const sparse = isSparseSection(sec);
          return `
          <div 
            class="reader-outline-item ${i === readerState.currentSection ? 'active' : ''} ${sparse ? 'sparse-section' : ''}" 
            onclick="goToSection(${i})"
          >
            <span>${sec.section_number || sec.number}. ${sec.title}${sparse ? ' (empty)' : ''}</span>
          </div>`;
        }).join('')}
      </div>

      <!-- Reading pane -->
      <div class="reader-pane">
        <!-- Toolbar -->
        <div class="reader-toolbar">
          <button class="font-btn" onclick="changeFontSize(-1)" title="Decrease font size">A−</button>
          <span class="toolbar-fontsize" style="font-size:11px;color:var(--text-tertiary);min-width:28px;text-align:center;">${fontSize}</span>
          <button class="font-btn" onclick="changeFontSize(1)" title="Increase font size">A+</button>
          <div class="toolbar-divider"></div>
          <button class="font-btn ${useSerif ? 'active' : ''}" onclick="toggleSerifFont()" title="Toggle serif font">¶</button>
          <div class="reader-right-group">
            <button class="font-btn reader-search-btn" onclick="searchInChapter()" title="Search">⌕</button>
            <button class="font-btn reader-night-btn" onclick="toggleNightMode()" title="Toggle night mode">☽</button>
          </div>
        </div>

        <!-- Content -->
        <div class="reader-content" id="readerPane">
          ${renderSection(currentSec)}
          
          <!-- Section Navigation -->
          <nav class="section-nav" aria-label="Section navigation">
            <button 
              class="section-nav-btn prev" 
              onclick="goToSection(${prevIdx})" 
              ${prevIdx < 0 ? 'disabled' : ''}
              title="${prevSec ? prevSec.title : ''}"
            >
              <span class="nav-arrow">←</span>
              <span class="nav-label">
                <span class="nav-direction">Previous</span>
                <span class="nav-title">${prevSec ? escapeHTML(prevSec.section_number || prevSec.number + '. ' + prevSec.title) : '—'}</span>
              </span>
            </button>
            <button 
              class="section-nav-btn next" 
              onclick="goToSection(${nextIdx})" 
              ${nextIdx < 0 ? 'disabled' : ''}
              title="${nextSec ? nextSec.title : ''}"
            >
              <span class="nav-arrow">→</span>
              <span class="nav-label">
                <span class="nav-direction">Next</span>
                <span class="nav-title">${nextSec ? escapeHTML(nextSec.section_number || nextSec.number + '. ' + nextSec.title) : '—'}</span>
              </span>
            </button>
          </nav>
        </div>
      </div>
    </div>
    
    <button class="reader-scroll-top" id="readerScrollTop" onclick="readerScrollTop()" title="Scroll to top">↑</button>
  `;

  // Apply night mode and serif font state
  const readerPane = document.getElementById('readerPane');
  if (readerPane) {
    readerPane.classList.toggle('night-mode', useNightMode);
    readerPane.classList.toggle('serif-body', useSerif);
    readerPane.style.fontSize = fontSize + 'px';
  }
  // Also toggle night-mode on the toolbar so it styles correctly
  const toolbar = document.querySelector('.reader-toolbar');
  if (toolbar) {
    toolbar.classList.toggle('night-mode', useNightMode);
  }

  Audio.playTransition();
}

/**
 * Render a single section
 */
function renderSection(section) {
  if (!section) return '<div class="empty-state">No content yet.</div>';

  const blocks = section.content || section.blocks || [];

  // Check if section is sparse — show message with skip button
  const totalContent = blocks.reduce((sum, b) => sum + (b.value || b.text || '').length, 0);
  if (totalContent < 100) {
    const nextIdx = readerState ? findNextSubstantialSection(readerState.sections, readerState.currentSection + 1) : -1;
    const canSkip = nextIdx >= 0 && nextIdx !== readerState?.currentSection;
    return `
      <h2 class="section-title">${section.title || 'Section'}</h2>
      <div class="sparse-section-msg">
        <span class="sparse-icon">📄</span>
        <p>This section has no content yet.</p>
        ${canSkip ? `<button class="auto-advance-btn" onclick="goToSection(${nextIdx})">Skip to next section →</button>` : ''}
      </div>
    `;
  }

  let html = `<h2 class="section-title">${section.title || 'Section'}</h2>`;
  const renderedDiagrams = new Set(); // track rendered diagram names to prevent duplicates

  // Preprocess: merge consecutive short text blocks into proper paragraphs
  const merged = mergeTextBlocks(blocks);

  merged.forEach((block, idx) => {
    const key = `${block.type}-${idx}`;
    const value = block.value || block.text || '';
    switch (block.type) {
      case 'text':
        // Detect pipe-delimited tables in text blocks
        if (isTableContent(value)) {
          html += renderTable(value);
        } else if (isPropertyDetails(value)) {
          html += renderPropertyDetails(value);
        } else if (isPropertyLabel(value)) {
          html += `<div class="property-field"><span class="property-label">${value.replace(/[.:]+$/, '')}:</span></div>`;
        } else if (isDenseHierarchy(value)) {
          html += renderHierarchy(value);
        } else if (isNumberedList(value)) {
          html += renderNumberedList(value);
        } else if (isBulletList(value)) {
          html += renderBulletList(value);
        } else {
          // Detect inline headings within text blocks
          const splitResult = splitInlineHeadings(value);
          html += splitResult;
        }
        break;
      case 'heading': {
        if (isPropertyLabel(value)) {
          const cleanLabel = value.replace(/^[^—–]+[—–]\s*/, '').replace(/[.:]+$/, '');
          const context = value.includes('—') ? value.split('—')[0].trim() : '';
          html += `<div class="property-field"><span class="property-label">${context ? context + ' — ' : ''}${cleanLabel}:</span></div>`;
        } else {
          html += `<h3 class="reader-heading" key="${key}">${value}</h3>`;
        }
        break;
      }
      case 'definition':
        html += `<div class="definition" key="${key}"><span class="term">${block.term || 'Term'}</span> <span class="def-value">${value}</span></div>`;
        break;
      case 'example': {
        const exampleDiagram = matchDiagram(value, readerState?.subjectId, readerState?.chapter?.title, section?.title, renderedDiagrams);
        if (exampleDiagram) {
          html += `<div class="example" key="${key}"><strong>Example:</strong> ${value}</div>`;
          html += `<div class="diagram-container">${exampleDiagram}</div>`;
        } else {
          html += `<div class="example" key="${key}"><strong>Example:</strong> ${value}</div>`;
        }
        break;
      }
      case 'formula':
        if (value.length > 100 && !/[√≈≠≤≥π⊂∈ℤℚℝℕ∂∫∑∏∇∞±×÷°²³¹⁰ⁿ⊆⊃∪∩→←↔∴∵°C°F]/.test(value)) {
          html += renderRichParagraphs(value);
        } else {
          html += `<div class="formula math-notation" key="${key}">${value.replace(/\n/g, '<br>')}</div>`;
        }
        break;
      case 'table':
        html += renderTable(value);
        break;
      case 'practice':
      case 'practice_problem':
        html += `<div class="practice-problem" key="${key}"><strong>✧ Practice:</strong> ${value}</div>`;
        break;
      case 'note': {
        const noteDiagram = matchDiagram(value, readerState?.subjectId, readerState?.chapter?.title, section?.title, renderedDiagrams);
        if (noteDiagram) {
          html += `<div class="note" key="${key}"><strong>📌 Note:</strong> ${value}</div>`;
          html += `<div class="diagram-container">${noteDiagram}</div>`;
        } else if (isTableContent(value)) {
          html += `<div class="note" key="${key}"><strong>📌 Note:</strong></div>`;
          html += renderTable(value);
        } else {
          html += `<div class="note" key="${key}"><strong>📌 Note:</strong> ${value}</div>`;
        }
        break;
      }
      case 'tip':
        html += `<div class="tip" key="${key}"><strong>✧ Tip:</strong> ${value}</div>`;
        break;
      default: {
        const diagram = matchDiagram(value, readerState?.subjectId, readerState?.chapter?.title, section?.title, renderedDiagrams);
        if (diagram) {
          html += `<div class="diagram-container">${diagram}</div>`;
        } else if (isTableContent(value)) {
          html += renderTable(value);
        } else {
          html += renderRichParagraphs(value);
        }
      }
    }
  });

  return html;
}

/**
 * Render text as rich paragraphs — splits long wall-of-text blocks into multiple <p> tags.
 * This improves readability for PDF-extracted content that has no paragraph breaks.
 */
function renderRichParagraphs(value) {
  if (!value) return '';
  
  // If already has newlines, respect them
  if (value.includes('\n')) {
    const parts = value.split(/\n\n+/).filter(p => p.trim());
    if (parts.length > 1) {
      return parts.map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('');
    }
    return `<p>${value.replace(/\n/g, '<br>')}</p>`;
  }
  
  // Split long text blocks at sentence boundaries for readability
  if (value.length > 500) {
    const paragraphs = splitIntoParagraphs(value);
    if (paragraphs.length > 1) {
      return paragraphs.map(p => `<p>${p}</p>`).join('');
    }
  }
  
  return `<p>${value}</p>`;
}

/**
 * Split a long text block into paragraphs at sentence boundaries.
 * Targets ~200-400 chars per paragraph for comfortable reading.
 */
function splitIntoParagraphs(text) {
  if (!text || text.length < 500) return [text];
  
  // Split at sentence boundaries: period/question/exclamation followed by space and uppercase
  const sentences = text.match(/[^.!?]*[.!?]+\s*/g);
  if (!sentences || sentences.length < 3) return [text];
  
  const paragraphs = [];
  let current = '';
  
  for (const sentence of sentences) {
    current += sentence;
    // Aim for 200-400 char paragraphs; break sooner if we hit a natural break point
    if (current.length >= 250) {
      paragraphs.push(current.trim());
      current = '';
    }
  }
  
  if (current.trim()) {
    // If leftover is short, append to last paragraph instead
    if (paragraphs.length > 0 && current.trim().length < 80) {
      paragraphs[paragraphs.length - 1] += ' ' + current.trim();
    } else {
      paragraphs.push(current.trim());
    }
  }
  
  return paragraphs.length > 1 ? paragraphs : [text];
}

/**
 * Detect numbered lists in text blocks.
 * Pattern: "1. Item text 2. Item text 3. Item text" or "1) Item text 2) Item text"
 */
function isNumberedList(value) {
  if (!value || value.length < 20) return false;
  // Match "N. " or "N) " patterns — need at least 3 for a list
  const dotMatches = value.match(/(?:^|\s)\d{1,2}\.\s+[A-Z]/g);
  const parenMatches = value.match(/(?:^|\s)\d{1,2}\)\s+[A-Z]/g);
  return (dotMatches && dotMatches.length >= 3) || (parenMatches && parenMatches.length >= 3);
}

/**
 * Render a numbered list detected in a text block.
 */
function renderNumberedList(value) {
  // Try "N. " pattern first
  let items = splitListItems(value, /(?:^|\s)(\d{1,2})\.\s+/);
  if (items.length < 3) {
    // Try "N) " pattern
    items = splitListItems(value, /(?:^|\s)(\d{1,2})\)\s+/);
  }
  if (items.length < 3) return `<p>${value}</p>`;
  
  // Check if there's a title/prefix before the first item
  const firstItemStart = value.search(/\d{1,2}[.)]\s+[A-Z]/);
  const prefix = firstItemStart > 0 ? value.substring(0, firstItemStart).trim() : '';
  
  let html = '';
  if (prefix) html += `<p>${prefix}</p>`;
  html += '<ol>';
  for (const item of items) {
    html += `<li>${item}</li>`;
  }
  html += '</ol>';
  return html;
}

/**
 * Detect bullet lists in text blocks.
 * Pattern: lines starting with "• ", "- ", "– ", "* "
 */
function isBulletList(value) {
  if (!value || value.length < 20) return false;
  // Check for bullet patterns — need at least 3
  const bullets = value.match(/(?:^|\n)\s*[•\-\*–]\s+\S/g);
  return bullets && bullets.length >= 3;
}

/**
 * Render a bullet list detected in a text block.
 */
function renderBulletList(value) {
  const lines = value.split(/\n/);
  const items = [];
  let prefix = '';
  let inList = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^[•\-\*–]\s+(.+)/);
    if (bulletMatch) {
      inList = true;
      items.push(bulletMatch[1]);
    } else if (!inList && trimmed) {
      prefix += (prefix ? ' ' : '') + trimmed;
    } else if (trimmed) {
      // Continuation of previous item
      if (items.length > 0) {
        items[items.length - 1] += ' ' + trimmed;
      }
    }
  }
  
  if (items.length < 3) return `<p>${value}</p>`;
  
  let html = '';
  if (prefix) html += `<p>${prefix}</p>`;
  html += '<ul>';
  for (const item of items) {
    html += `<li>${item}</li>`;
  }
  html += '</ul>';
  return html;
}

/**
 * Split text into list items using a regex pattern.
 * Returns array of item text strings.
 */
function splitListItems(value, pattern) {
  const parts = value.split(pattern);
  const items = [];
  // parts[0] is text before first match, then alternating: number, text, number, text...
  for (let i = 1; i < parts.length; i += 2) {
    const text = (parts[i + 1] || '').trim();
    if (text) items.push(text);
  }
  return items;
}

/**
 * Split inline headings from text blocks.
 * Detects patterns like "The Intuition ..." or "The Build-Up (Formal & Rigorous) ..."
 * and splits them into heading + text.
 */
function splitInlineHeadings(value) {
  const inlineHeadingPatterns = [
    'What You Need First',
    'The Intuition',
    'The Build-Up',
    'The Build-Up (Formal & Rigorous)',
    'Layman Terms',
    'Layman Terms (Rescue Track)',
    'Rescue Track',
    'Quick Check',
    'Common Mistakes',
    'Memory Tricks',
    'One-Page Lock-In',
    'THE ONE THING TO NEVER FORGET',
    'Section Reminders',
    'Key Definitions',
    'Key Diagrams',
    'Key CET Trap',
  ];

  for (const pattern of inlineHeadingPatterns) {
    const idx = value.indexOf(pattern);
    if (idx < 0) continue;

    // Standalone heading — text IS the heading with little/nothing else
    const trimmed = value.trim();
    if (trimmed === pattern || trimmed === pattern + '.' || trimmed === pattern + ':') {
      return `<h3 class="reader-heading">${pattern}</h3>`;
    }

    // Heading at the start — some trailing content
    if (idx === 0 && value.length < pattern.length + 80) {
      const after = value.substring(pattern.length).replace(/^[\s:.\-—]+/, '').trim();
      if (after.length < 10) {
        return `<h3 class="reader-heading">${pattern}</h3>`;
      }
    }

    // Only split if there's meaningful content before AND after
    if (idx > 0) {
      const before = value.substring(0, idx).trim();
      let afterStart = idx + pattern.length;
      // Skip trailing punctuation/space
      while (afterStart < value.length && ' \n:'.includes(value[afterStart])) {
        afterStart++;
      }
      let after = value.substring(afterStart).trim();

      // Check if 'after' starts with a parenthetical — append to heading
      let headingText = pattern;
      if (after.startsWith('(')) {
        const closeParen = after.indexOf(')');
        if (closeParen > 0 && closeParen < 50) {
          headingText = pattern + ' ' + after.substring(0, closeParen + 1);
          after = after.substring(closeParen + 1).trim();
        }
      }

      let result = '';
      if (before.trim().length > 0) result += renderRichParagraphs(before);
      result += `<h3 class="reader-heading">${headingText}</h3>`;
      if (after.trim().length > 0) result += renderRichParagraphs(after);
      return result;
    }
  }

  return renderRichParagraphs(value);
}

/**
 * Merge consecutive short text blocks into proper paragraphs.
 * Fixes choppy PDF extraction that splits sentences into individual blocks.
 * Also detects standalone heading patterns and promotes them.
 */
function mergeTextBlocks(blocks) {
  const result = [];
  let pendingText = '';

  const headingPatterns = ['What You Need First', 'Property Details', 'Section Reminders',
    'The Intuition', 'The Build-Up', 'The Build-Up (Formal & Rigorous)', 'Layman Terms',
    'Layman Terms (Rescue Track)', 'Rescue Track', 'Quick Check', 'Common Mistakes',
    'Memory Tricks', 'One-Page Lock-In', 'THE ONE THING TO NEVER FORGET',
    'Key Definitions', 'Key Diagrams', 'Key CET Trap', 'Worked Examples'];

  function extractHeadings(text) {
    // Check if text starts with or contains a heading pattern
    for (const h of headingPatterns) {
      if (text === h || text === h + '.' || text === h + ':') {
        return { before: '', heading: h, after: '' };
      }
      const idx = text.indexOf(h);
      if (idx >= 0) {
        const before = text.substring(0, idx).trim();
        let afterStart = idx + h.length;
        while (afterStart < text.length && ' \n:.'.includes(text[afterStart])) afterStart++;
        const after = text.substring(afterStart).trim();
        return { before, heading: h, after };
      }
    }
    return null;
  }

  function flushPending() {
    if (!pendingText.trim()) return;
    const trimmed = pendingText.trim();
    const found = extractHeadings(trimmed);
    if (found) {
      if (found.before) result.push({ type: 'text', value: found.before });
      result.push({ type: 'heading', value: found.heading });
      if (found.after) result.push({ type: 'text', value: found.after });
    } else {
      result.push({ type: 'text', value: trimmed });
    }
    pendingText = '';
  }

  for (const block of blocks) {
    const val = block.value || block.text || '';

    if (block.type !== 'text') {
      flushPending();
      result.push(block);
      continue;
    }

    // Don't merge table content
    if (isTableContent(val)) {
      flushPending();
      result.push(block);
      continue;
    }

    // If this block IS a heading pattern, flush pending and emit as heading
    const trimmed = val.trim();
    const isHeading = headingPatterns.some(h => trimmed === h || trimmed === h + '.' || trimmed === h + ':');
    if (isHeading) {
      flushPending();
      result.push({ type: 'heading', value: trimmed.replace(/[.:]$/, '') });
      continue;
    }

    // Short block that doesn't end with sentence-ending punctuation — merge
    if (val.length < 120 && !val.endsWith('.') && !val.endsWith('?') && !val.endsWith('!') && !val.endsWith(':')) {
      pendingText += (pendingText ? ' ' : '') + val;
      continue;
    }

    // Block starts with lowercase and pending exists — continuation
    if (pendingText && val.length < 150 && /^[a-z]/.test(val)) {
      pendingText += ' ' + val;
      flushPending();
      continue;
    }

    // Regular block — flush pending and add
    flushPending();
    result.push(block);
  }

  flushPending();
  return result;
}

/**
 * Detect dense hierarchy blocks like "Real Numbers (ℝ) Every point... Rational Numbers (ℚ)..."
 * These are structured data flattened into a single text block by PDF extraction.
 */
function isDenseHierarchy(value) {
  if (!value || value.length < 100) return false;
  // Count capitalized terms followed by parenthetical symbols
  const hierarchyTerms = value.match(/[A-Z][a-z]+ Numbers?\s*[（(][^)]+[）)]/g);
  return hierarchyTerms && hierarchyTerms.length >= 3;
}

/**
 * Render a dense hierarchy block as a structured list.
 */
function renderHierarchy(value) {
  // Split at "Real Numbers", "Rational Numbers", "Integers", "Natural Numbers", "Irrationals", etc.
  const parts = value.split(/(?=(?:Real|Rational|Integer|Natural|Irrational|Whole|Prime|Complex)\s+Number)/i);
  if (parts.length < 2) return `<p>${value}</p>`;

  let html = '<div class="definition-hierarchy">';
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // Extract term and description
    const match = trimmed.match(/^((?:Real|Rational|Integer|Natural|Irrational|Whole|Prime|Complex)\s+Numbers?\s*[（(][^)]+[）)]?)\s*(.*)/is);
    if (match) {
      html += `<div class="hierarchy-item"><span class="hierarchy-term">${match[1]}</span>`;
      if (match[2].trim()) {
        html += `<span class="hierarchy-desc">${match[2].trim()}</span>`;
      }
      html += '</div>';
    } else {
      html += `<div class="hierarchy-item">${trimmed}</div>`;
    }
  }
  html += '</div>';
  return html;
}

/**
 * Detect "Property Details" or "What they are"/"Why they exist" patterns in text blocks.
 * These are structured data flattened into paragraphs by PDF extraction.
 */
function isPropertyDetails(value) {
  if (!value || value.length < 80) return false;
  const hasWhatThey = /What they are/i.test(value);
  const hasWhyThey = /Why they exist/i.test(value);
  const hasKeyRule = /Key rule/i.test(value);
  const hasFamous = /Famous ones/i.test(value);
  const hasCoverage = /Coverage/i.test(value);
  return (hasWhatThey && hasWhyThey) || (hasWhatThey && hasKeyRule) || 
         (hasWhatThey && hasFamous) || (hasCoverage && hasWhatThey);
}

/**
 * Detect standalone property labels like "What they are", "Why they exist", "Key rule"
 * that appear as their own text block (not embedded in a larger block).
 */
function isPropertyLabel(value) {
  if (!value) return false;
  const trimmed = value.trim().replace(/[.:]+$/, '');
  const labels = ['What they are', 'What they', 'Why they exist', 'Why they', 
                  'Key rule', 'Key Property', 'Famous ones', 'Coverage', 'Big Idea',
                  'Big idea', 'Section Reminders'];
  if (labels.includes(trimmed)) return true;
  for (const label of labels) {
    if (trimmed.includes('— ' + label) || trimmed.includes('– ' + label) || 
        trimmed.endsWith(label)) return true;
  }
  return false;
}

/**
 * Render a Property Details block as structured definition cards.
 */
function renderPropertyDetails(value) {
  const fields = [];
  const fieldPatterns = [
    { label: 'What they are', regex: /What they are\s*/i },
    { label: 'What they', regex: /What they\s/i },
    { label: 'Why they exist', regex: /Why they exist\s*/i },
    { label: 'Why they', regex: /Why they\s/i },
    { label: 'Key rule', regex: /Key rule\s*/i },
    { label: 'Key Property', regex: /Key Property\s*/i },
    { label: 'Famous ones', regex: /Famous ones\s*/i },
    { label: 'Coverage', regex: /Coverage\s*/i },
    { label: 'Big Idea', regex: /Big Idea\s*/i },
    { label: 'Example', regex: /Example\s*:?\s*/i },
  ];
  
  let remaining = value;
  
  const positions = [];
  for (const fp of fieldPatterns) {
    const match = remaining.match(fp.regex);
    if (match) {
      positions.push({ label: fp.label, index: match.index, end: match.index + match[0].length });
    }
  }
  
  positions.sort((a, b) => a.index - b.index);
  
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].end;
    const end = i + 1 < positions.length ? positions[i + 1].index : remaining.length;
    const fieldValue = remaining.substring(start, end).trim();
    if (fieldValue.length > 2) {
      fields.push({ label: positions[i].label, value: fieldValue });
    }
  }
  
  if (fields.length === 0) return `<p>${value}</p>`;
  
  let html = '<div class="property-details">';
  for (const field of fields) {
    const isExample = field.label === 'Example';
    const boxClass = isExample ? 'property-example' : 'property-field';
    html += `<div class="${boxClass}">`;
    html += `<span class="property-label">${field.label}:</span> `;
    html += `<span class="property-value">${field.value}</span>`;
    html += '</div>';
  }
  html += '</div>';
  return html;
}

/**
 * Detect whether a text value contains pipe-delimited table data.
 */
function isTableContent(text) {
  if (!text || typeof text !== 'string') return false;
  const lines = text.split('\n').filter(l => l.trim());
  const pipeLines = lines.filter(l => l.includes('|') && l.trim().startsWith('|'));
  if (pipeLines.length < 2) {
    const singleLine = lines.find(l => (l.match(/\|/g) || []).length >= 6);
    if (!singleLine) return false;
  }
  const hasSeparator = lines.some(l => /\|[\s-]+\|/.test(l));
  return hasSeparator || pipeLines.length >= 3;
}

/**
 * Convert pipe-delimited text into an HTML table.
 */
function renderTable(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const pipeLines = lines.filter(l => l.includes('|') && l.trim().startsWith('|'));

  if (pipeLines.length === 0) return `<p>${text}</p>`;

  function parseRow(line) {
    return line
      .replace(/^\|/, '').replace(/\|$/, '')
      .split('|')
      .map(cell => cell.trim());
  }

  const headerCells = parseRow(pipeLines[0]);
  const dataLines = pipeLines.slice(1).filter(l => !/^[\s|:-]+$/.test(l.replace(/\|/g, '').trim()));

  let table = '<table class="reader-table"><thead><tr>';
  headerCells.forEach(cell => { table += `<th>${escapeHTML(cell)}</th>`; });
  table += '</tr></thead><tbody>';

  dataLines.forEach((line, i) => {
    const cells = parseRow(line);
    table += `<tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">`;
    cells.forEach(cell => { table += `<td>${escapeHTML(cell)}</td>`; });
    table += '</tr>';
  });

  table += '</tbody></table>';
  return table;
}

// Global functions for onclick handlers
window.goToSection = function(index) {
  if (!readerState) return;
  if (index < 0 || index >= readerState.sections.length) return;
  readerState.currentSection = index;
  renderChapter();
  // Scroll the reader pane to top
  const pane = document.querySelector('.reader-pane');
  if (pane) pane.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.changeFontSize = function(delta) {
  fontSize = Math.max(16, Math.min(28, fontSize + delta));
  saveReaderSettings();
  const pane = document.getElementById('readerPane');
  if (pane) {
    pane.style.fontSize = fontSize + 'px';
  }
  const sizeLabel = document.querySelector('.toolbar-fontsize');
  if (sizeLabel) {
    sizeLabel.textContent = fontSize;
  }
};

window.toggleSerifFont = function() {
  useSerif = !useSerif;
  saveReaderSettings();
  renderChapter();
};

window.toggleNightMode = function() {
  useNightMode = !useNightMode;
  saveReaderSettings();
  renderChapter();
};

window.searchInChapter = function() {
  const term = prompt('Search in this chapter:');
  if (!term || !readerState) return;
  const lower = term.toLowerCase();
  // Remove previous highlights
  document.querySelectorAll('.search-match-highlight').forEach(el => {
    el.classList.remove('search-match-highlight');
  });
  document.querySelectorAll('.search-mark').forEach(el => {
    const parent = el.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    }
  });
  let matchCount = 0;
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  const blocks = document.querySelectorAll(
    '#readerPane p, #readerPane h2, #readerPane h3, #readerPane td, #readerPane th, ' +
    '#readerPane .definition, #readerPane .example, #readerPane .note, #readerPane .tip, ' +
    '#readerPane .practice-problem, #readerPane .formula, #readerPane .hierarchy-block, ' +
    '#readerPane .def-value, #readerPane .property-field, #readerPane .property-example, ' +
    '#readerPane li'
  );
  blocks.forEach(block => {
    const text = block.textContent.toLowerCase();
    if (text.includes(lower)) {
      matchCount++;
      block.classList.add('search-match-highlight');
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null, false);
      const textNodes = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue.toLowerCase().includes(lower)) {
          textNodes.push(node);
        }
      }
      textNodes.forEach(textNode => {
        const frag = document.createDocumentFragment();
        const parts = textNode.nodeValue.split(regex);
        parts.forEach((part, i) => {
          if (i % 2 === 1) {
            const mark = document.createElement('mark');
            mark.className = 'search-mark';
            mark.textContent = part;
            frag.appendChild(mark);
          } else if (part) {
            frag.appendChild(document.createTextNode(part));
          }
        });
        textNode.parentNode.replaceChild(frag, textNode);
      });
    }
  });
  const firstMatch = document.querySelector('.search-mark');
  if (firstMatch) {
    firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (matchCount > 0) {
    toast.success(`Found ${matchCount} matching block${matchCount > 1 ? 's' : ''} for "${term}"`);
  } else {
    toast.info(`No matches found for "${term}"`);
  }
  setTimeout(() => {
    document.querySelectorAll('.search-mark').forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      }
    });
    document.querySelectorAll('.search-match-highlight').forEach(el => {
      el.classList.remove('search-match-highlight');
    });
  }, 8000);
};

window.readerScrollTop = function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.router = router;

function saveReaderSettings() {
  try {
    localStorage.setItem('readerSettings', JSON.stringify({ fontSize, useSerif, useNightMode }));
  } catch { /* Safari private browsing */ }
}
