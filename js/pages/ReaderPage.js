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
// Fetch caches — shared Promise deduplicates concurrent requests
let textbookDataPromise = null;

/**
 * Load textbook_data.json with caching (shared Promise deduplicates concurrent calls)
 */
function loadTextbookData() {
  if (textbookDataPromise) return textbookDataPromise;
  textbookDataPromise = fetch("data/textbook_data.json")
    .then(res => { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
    .catch(err => { textbookDataPromise = null; throw err; });
  return textbookDataPromise;
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
  if (!textbookDataPromise) {
    content.innerHTML = renderSpinner('Loading chapters...');
  }

  // Load chapters for this subject from textbook_data.json
  loadTextbookData()
    .then(data => {
      const subjectChapters = data[subjectId];
      
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

  // Only show spinner if data is not cached yet (prevents flash on subsequent navigations)
  if (!textbookDataPromise) {
    content.innerHTML = renderSpinner("Loading chapter content...");
  }

  // Load chapter data (cached after first fetch)
  loadTextbookData().then(data => {
    const chapters = data[subjectId];
    if (!chapters) {
      content.innerHTML = `
        <div class="empty-state">
          <p>No chapters available for this subject.</p>
          <button class="btn btn-primary" onclick="router.navigate('reader', { subjectId: '${escapeHTML(subjectId)}' })">← Back</button>
        </div>
      `;
      return;
    }
    const chapter = chapters.find(ch =>
      ch.id === chapterId || ch.id.toString() === chapterId.toString()
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
    const sections = chapter.sections || [];
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
><span>${escapeHTML(sec.section_number || sec.number || sec.id || '')}${sec.section_number || sec.number || sec.id ? '. ' : ''}${escapeHTML(sec.title)}</span>
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
                <span class="nav-title">${prevSec ? escapeHTML((prevSec.section_number || prevSec.number || prevSec.id || '') + (prevSec.section_number || prevSec.number || prevSec.id ? '. ' : '') + prevSec.title) : '—'}</span>
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
                <span class="nav-title">${nextSec ? escapeHTML((nextSec.section_number || nextSec.number || nextSec.id || '') + (nextSec.section_number || nextSec.number || nextSec.id ? '. ' : '') + nextSec.title) : '—'}</span>
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

  // Reclassify misclassified formula blocks to text type
  // (PDF extraction tags text content with = or × as 'formula')
  merged.forEach(block => {
    if (block.type !== 'formula') return;
    const val = (block.value || '').trim();
    const isRealFormula = /^[^a-zA-Z]*$/.test(val) || // pure math symbols
      (/^[A-Z]=/.test(val) && val.length < 60 && /[×÷²³√∫∑±≤≥≠≈π]/.test(val)) ||
      (/^\d+[\.\)]\s/.test(val) === false && val.length < 80 && (val.match(/[×÷²³√∫∑±≤≥≠≈π∂∇∞⊂∈ℤℚℝⁿ⊆⊃∪∩∴∵]/g) || []).length >= 2);
    if (!isRealFormula) {
      block.type = 'text'; // reclassify to text
    }
  });

  // Group consecutive single-bullet text blocks into merged bullet lists
  // Also merge split arrow chains (block ending with → followed by continuation)
  function groupConsecutiveBullets(blocks) {
    const result = [];
    let pendingBullets = [];
    const bulletRe = /^(?:•|-|\*|–|—)\s+/;
    const inlineBulletRe = /(?:[.):\s])\s*[-–—]\s+(?=[A-Z0-9])/;
    // Arrow chain continuation: block ending with → and next block starting with chain item
    const arrowEndRe = /→\s*$/;
    const arrowStartRe = /^[A-Z][a-z]+(?:\s+→|\s+[A-Z])/;

    function flushBullets() {
      if (pendingBullets.length === 0) return;
      if (pendingBullets.length >= 2) {
        // Merge into a single text block, stripping leading/trailing fragment markers
        const mergedText = pendingBullets.map(b => (b.value || b.text || '').trim()).join(' ');
        result.push({ type: 'text', value: mergedText });
      } else {
        result.push(pendingBullets[0]);
      }
      pendingBullets = [];
    }

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const val = (block.value || block.text || '').trim();
      if (block.type === 'text' && val.length < 200) {
        const hasLineBullet = bulletRe.test(val) && val.split('\n').length === 1;
        const hasInlineBullet = inlineBulletRe.test(val);
        if (hasLineBullet || hasInlineBullet) {
          pendingBullets.push(block);
          continue;
        }
      }
      flushBullets();

      // Arrow chain continuation: if previous result ends with → and this block continues the chain
      if (block.type === 'text' && result.length > 0) {
        const prevBlock = result[result.length - 1];
        const prevVal = (prevBlock.value || prevBlock.text || '').trim();
        if (prevBlock.type === 'text' && arrowEndRe.test(prevVal) && arrowStartRe.test(val) && val.includes('→')) {
          // Merge into previous block
          result[result.length - 1] = { type: 'text', value: prevVal + ' ' + val };
          continue;
        }
      }

      result.push(block);
    }
    flushBullets();
    return result;
  }

  const grouped = groupConsecutiveBullets(merged);

  grouped.forEach((block, idx) => {
    const key = `${block.type}-${idx}`;
    const value = block.value || block.text || '';
    if (block._consumedByPrereq) return; // skip blocks consumed by prereq box
    switch (block.type) {
      case 'text': {
        // Strip 'Section Reminders (Error Prevention)' and similar PDF extraction artifacts
        let cleanValue = value
          .replace(/\b\d+\.\s*Section Reminders\s*\(Error Prevention\)\s*/gi, '')
          .replace(/\bSection Reminders\s*\(Error Prevention\)\s*/gi, '')
          .replace(/\bSection Reminders\s*$/gi, '')
          .trim();
        if (!cleanValue) break; // nothing left after stripping

        // Style 'What You Need First' as a compact collapsible prereq box
        const prereqMatch = cleanValue.match(/^(?:What You Need First)[:\s.\-—]*([\s\S]*)$/i);
        if (/What You Need First/i.test(cleanValue)) {
          // Collect content: inline content + lookahead to next text block(s)
          let prereqContent = prereqMatch && prereqMatch[1].trim() ? prereqMatch[1].trim() : '';
          let consumed = 0;
          // Look ahead at subsequent blocks to pull prerequisite content into the box
          for (let li = idx + 1; li < grouped.length && consumed < 3; li++) {
            const nextBlock = grouped[li];
            if (nextBlock.type !== 'text') break;
            const nv = (nextBlock.value || nextBlock.text || '').trim();
            if (!nv) { consumed++; continue; }
            // Stop if we hit another heading pattern
            if (/^(The Intuition|The Build|Worked Example|Quick Check|Layman|Rescue|One-Page|Section \d|Practice)/i.test(nv)) break;
            // Stop if it looks like a section reference only (short, starts with "Section" or "Master")
            if (/^(Section \d|Master the fundamentals)/i.test(nv) && nv.length < 200) {
              prereqContent += (prereqContent ? ' ' : '') + nv;
              consumed++;
              break;
            }
            prereqContent += (prereqContent ? ' ' : '') + nv;
            consumed++;
          }
          // Mark consumed blocks so they don't render again
          for (let ci = 0; ci < consumed; ci++) {
            grouped[idx + 1 + ci]._consumedByPrereq = true;
          }
          if (prereqContent) {
            html += `<details class="prereq-box"><summary>📋 What You Need First</summary><p>${prereqContent}</p></details>`;
          } else {
            html += `<details class="prereq-box" open><summary>📋 What You Need First</summary><p class="muted">Review the prerequisites for this section.</p></details>`;
          }
          break;
        }

        // Detect pipe-delimited tables in text blocks
        if (isTableContent(cleanValue)) {
          html += renderTable(cleanValue);
        } else if (isPropertyDetails(cleanValue)) {
          html += renderPropertyDetails(cleanValue);
        } else if (isPropertyLabel(cleanValue)) {
          // Strip "Property Details " prefix if present (it's a leading heading, not the label)
          const labelText = cleanValue.replace(/^Property Details\s+/i, '').replace(/[.:]+$/, '');
          html += `<div class="property-field"><span class="property-label">${labelText}:</span></div>`;
        } else if (isDenseHierarchy(cleanValue)) {
          html += renderHierarchy(cleanValue);
        } else if (isNumberedList(cleanValue)) {
          html += renderNumberedList(cleanValue);
        } else if (isBulletList(cleanValue)) {
          html += renderBulletList(cleanValue);
        } else if (isArrowChain(cleanValue)) {
          html += renderArrowChain(cleanValue);
        } else if (isVocabList(cleanValue)) {
          html += renderVocabList(cleanValue);
        } else if (isRuleList(cleanValue)) {
          html += renderRuleList(cleanValue);
        } else if (isDefinitionList(cleanValue)) {
          html += renderDefinitionList(cleanValue);
        } else if (isTableLikeContent(cleanValue)) {
          html += renderTableLikeContent(cleanValue);
        } else {
          // Split concatenated worked examples (→ yes/→ no boundaries)
          const withSplitExamples = splitConcatenatedExamples(cleanValue);
          // Detect inline headings within text blocks
          const splitResult = splitInlineHeadings(withSplitExamples);
          html += splitResult;
        }
        break;
      }
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
      case 'definition': {
              const term = (block.term || '').trim();
              const defValue = value.trim();
              // Skip fragment definitions with missing/meaningless term field
              const invalidTerms = ['Term', 'is', 'are', 'a', 'an', 'the', '', 'which', 'what', 'and', 'but', 'if', 'how'];
              // Also skip definitions where term is clearly a sentence fragment (starts with "Which", "What")
              // or where the whole block is a question/quiz item pretending to be a definition
              const defIsSentenceStart = /^(Which|What|How|Why|If a|If you|But not|And there)/i.test(term);
                      const isFragmentDef = !term || invalidTerms.includes(term.toLowerCase()) ||
                        term.length < 2 || defIsSentenceStart || /^(?:is|are|was|were)\b/i.test(defValue);
                      if (isFragmentDef) {
          // Render as a regular text paragraph instead of a broken definition
          html += `<p key="${key}">${value}</p>`;
        } else {
          html += `<div class="definition" key="${key}"><span class="term">${escapeHTML(term)}</span> <span class="def-value">${value}</span></div>`;
        }
        break;
      }
      case 'example': {
        // Skip empty/placeholder example blocks
        const exTrimmed = value.trim();
        const exLower = exTrimmed.toLowerCase();
        const emptyExamples = ['example', 'examples', 'example.', 'examples.', 'example q', 'example q.'];
        const placeholderExamples = ['sample questions to reinforce your learning.', 'sample questions to reinforce your learning',
          'practice questions', 'exercises', 'exercises for each skill'];
        if (emptyExamples.includes(exLower) || placeholderExamples.includes(exLower) ||
            (exTrimmed.length < 15 && !exTrimmed.includes(' '))) {
          break; // skip rendering
        }
        const exampleDiagram = matchDiagram(value, readerState?.subjectId, readerState?.chapter?.title, section?.title, renderedDiagrams);
        if (exampleDiagram) {
          html += `<div class="example" key="${key}"><strong>Example:</strong> ${value}</div>`;
          html += `<div class="diagram-container">${exampleDiagram}</div>`;
        } else {
          html += `<div class="example" key="${key}"><strong>Example:</strong> ${value}</div>`;
        }
        break;
      }
      case 'formula': {
        // Check if this is ACTUALLY a formula (math-heavy) or misclassified text content.
        // PDF extraction tags many text blocks as 'formula' if they contain = or × symbols.
        const isRealFormula = /^[^a-zA-Z]*$/.test(value.trim()) || // pure math symbols
          (/^[A-Z]=/.test(value.trim()) && value.length < 60 && /[×÷²³√∫∑±≤≥≠≈π]/.test(value)) || // short formula like "E=mc²"
          (/^\d+[\.\)]\s/.test(value.trim()) === false && value.length < 80 && (value.match(/[×÷²³√∫∑±≤≥≠≈π∂∇∞⊂∈ℤℚℝⁿ⊆⊃∪∩∴∵]/g) || []).length >= 2); // multiple math symbols (NOT - or → which appear in regular text)

        if (!isRealFormula) {
          // Not a real formula — treat as text content
          if (isArrowChain(value)) {
            html += renderArrowChain(value);
          } else if (isBulletList(value)) {
            html += renderBulletList(value);
          } else if (isNumberedList(value)) {
            html += renderNumberedList(value);
          } else if (isRuleList(value)) {
            html += renderRuleList(value);
          } else if (isVocabList(value)) {
            html += renderVocabList(value);
          } else {
            html += renderRichParagraphs(value);
          }
        } else if (isArrowChain(value)) {
          html += renderArrowChain(value);
        } else {
          html += `<div class="formula math-notation" key="${key}">${escapeHTML(value).replace(/\n/g, '<br>')}</div>`;
        }
        break;
      }
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
      return parts.filter(p => p.trim()).map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('');
    }
    return value.trim() ? `<p>${value.replace(/\n/g, '<br>')}</p>` : '';
  }
  
  // Split long text blocks at sentence boundaries for readability
  if (value.length > 500) {
    const paragraphs = splitIntoParagraphs(value);
    if (paragraphs.length > 1) {
      return paragraphs.filter(p => p && p.trim()).map(p => `<p>${p}</p>`).join('');
    }
  }
  
  return value.trim() ? `<p>${value}</p>` : '';
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
  // Match "N. " or "N) " patterns — need at least 2 for a list
  const dotMatches = value.match(/(?:^|\s|:)\s*\d{1,2}\.\s+[A-Z]/g);
  const parenMatches = value.match(/(?:^|\s)\d{1,2}\)\s+[A-Z]/g);
  return (dotMatches && dotMatches.length >= 2) || (parenMatches && parenMatches.length >= 2);
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
  // Pattern 1: bullets at start of lines
  const lineBullets = value.match(/(?:^|\n)\s*[•\-\*–]\s+\S/g);
  if (lineBullets && lineBullets.length >= 3) return true;
  // Pattern 2: inline bullets — " - Item" preceded by end of previous item (letter/punctuation + space)
  const inlineBullets = value.match(/(?:[.):\s])\s*[-–—]\s+(?=[A-Z0-9])/g);
  if (inlineBullets && inlineBullets.length >= 3) return true;
  return false;
}

/**
 * Render a bullet list detected in a text block.
 */
function renderBulletList(value) {
  const lines = value.split(/\n/);
  const items = [];
  let prefix = '';
  let inList = false;
  
  // Check if this is inline bullets (no newlines, bullets embedded in text)
  const hasLineBullets = lines.some(l => /^\s*[•\-\*–]\s+/.test(l.trim()));
  
  if (!hasLineBullets && lines.length <= 2) {
    // Inline bullet pattern — split on " - " before capital letter/number
    const inlinePattern = /(?:[.):\s])\s*[-–—]\s+(?=[A-Z0-9])/g;
    const matches = [...value.matchAll(/(?:^|(?:[.):\s]))\s*[-–—]\s+([A-Z0-9][^–—]*?)(?=(?:[.):\s])\s*[-–—]\s+[A-Z0-9]|$)/g)];
    if (matches.length >= 3) {
      // Extract prefix (text before first bullet)
      const firstMatch = value.match(/^(.+?)\s+[-–—]\s+[A-Z0-9]/);
      if (firstMatch) prefix = firstMatch[1].trim();
      for (const m of matches) {
        items.push(m[1].trim());
      }
    }
    if (items.length < 3) {
      // Fallback: try splitting on " - " more aggressively
      const parts = value.split(/\s+[-–—]\s+/);
      if (parts.length >= 4) { // prefix + 3 items
        prefix = parts[0];
        for (let i = 1; i < parts.length; i++) {
          items.push(parts[i].trim());
        }
      }
    }
  } else {
    // Line-based bullets
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
 * Split concatenated worked examples into separate items.
 * Detects patterns like '471 → 4+7+1=12 → 12÷3=4 → yes Last two digits...'
 * where a worked example ends (→ yes, → no, ✓) and a new one begins.
 */
function splitConcatenatedExamples(value) {
  if (!value || typeof value !== 'string') return value;
  // Split where a result marker is followed by a capital letter or digit starting a new example
  const parts = value.split(/(?<=[→✓]\s*(?:yes|no)\s+)(?=[A-Z\d])/i);
  if (parts.length <= 1) return value;
  return parts.map(p => p.trim()).filter(Boolean).join('<br>');
}

/**
 * Detect arrow-chain content: sequences of items connected by → arrows.
 * Examples: 'Kingdom → Phylum → Class → Order → Family →'
 *           'Sun → Producers → Primary → Secondary → Tertiary → Decomposers'
 */
function isArrowChain(value) {
  if (!value || typeof value !== 'string') return false;
  if (value.length >= 500) return false;

  // Exclude math/chemistry/logic notation
  if (/[fF]\(x\)|\\b|lim\(|∫|dx\b|d\/dx/i.test(value)) return false;
  if (/[∀∃∴⊂∈]/.test(value)) return false;
  // Chemistry: subscript digits in formulas like N₂+3H₂→2NH₃
  if (/[₀-₉]\+|→\s*\d*[A-Z]/.test(value) && /\+[₀-₉A-Z]/.test(value)) return false;

  const arrows = (value.match(/→/g) || []).length;
  if (arrows < 3) return false;

  return true;
}

/**
 * Render an arrow-chain block as styled flow visualization.
 */
function renderArrowChain(value) {
  // Extract optional prefix label before the chain
  let prefix = '';
  let chain = value;
  const colonMatch = value.match(/^(.+?):\s+(.+→.+)$/s);
  if (colonMatch) {
    prefix = colonMatch[1].trim();
    chain = colonMatch[2].trim();
  }

  // Split on → and clean up
  let items = chain.split(/\s*→\s*/).map(s => s.trim()).filter(Boolean);
  // If trailing → produces empty last item, drop it
  if (items.length && items[items.length - 1] === '') items.pop();

  let html = '<div class="arrow-chain">';
  if (prefix) {
    html += `<div class="arrow-chain-label">${escapeHTML(prefix)}</div>`;
  }
  html += '<div class="arrow-chain-items">';
  items.forEach((item, i) => {
    html += `<span class="arrow-item">${escapeHTML(item)}</span>`;
    if (i < items.length - 1) {
      html += '<span class="arrow-sep">→</span>';
    }
  });
  html += '</div></div>';
  return html;
}

/**
 * Detect vocabulary/word-list content: blocks with Word Definition Example. pattern.
 * Examples: 'Analyze Break down into parts Analyze the data carefully. ...'
 */
function isVocabList(value) {
  if (!value || typeof value !== 'string') return false;
  if (value.length <= 200) return false;

  // Pattern 1: "Word Definition Sentence." — capitalized word + capitalized def + example with period
  const pattern1 = /(\b[A-Z][a-z]+(?:\s+[a-z]+){0,3})\s+([A-Z][a-z]+(?:[\s,]+[a-z]+){0,5})\s+([^.]+\.)/g;
  let count = 0;
  let match;
  while ((match = pattern1.exec(value)) !== null) count++;
  if (count >= 3) return true;

  // Pattern 2: "Word = Translation" format (Filipino vocab in English sections)
  const pattern2 = /\b[A-Z][a-z]+\s*=\s*[^=\n]+(?:\/[^=\n]+)?/g;
  count = 0;
  while ((match = pattern2.exec(value)) !== null) count++;
  if (count >= 3) return true;

  // Pattern 3: Multi-word idiom entries
  const pattern3 = /([A-Z][a-z]+(?:\s+[a-z]+){1,5})\s+([A-Z][a-z]+(?:\s+[a-z]+){1,4})\s+([^.]+\.)/g;
  count = 0;
  while ((match = pattern3.exec(value)) !== null) count++;

  return count >= 3;
}

/**
 * Render a vocabulary list block as styled cards.
 */
function renderVocabList(value) {
  const entries = [];

  // Try Pattern 1: "Word Definition ExampleSentence."
  const pattern1 = /(\b[A-Z][a-z]+(?:\s+[a-z]+){0,3})\s+([A-Z][a-z]+(?:[\s,]+[a-z]+){0,5})\s+([^.]+\.)\s*/g;
  let match;
  while ((match = pattern1.exec(value)) !== null) {
    entries.push({ word: match[1].trim(), def: match[2].trim(), example: match[3].trim() });
  }

  // Try Pattern 2: "Word = Translation / Alt"
  if (entries.length < 3) {
    entries.length = 0;
    const pattern2 = /\b([A-Z][a-z]+)\s*=\s*([^=\n]+?)(?:\s*\/\s*([^\n]+?))?(?=\s+[A-Z][a-z]+\s*=|\s*$)/g;
    while ((match = pattern2.exec(value)) !== null) {
      entries.push({ word: match[1].trim(), def: match[2].trim(), example: (match[3] || '').trim() });
    }
  }

  // Try Pattern 3: Multi-word idiom entries
  if (entries.length < 3) {
    entries.length = 0;
    const pattern3 = /([A-Z][a-z]+(?:\s+[a-z]+){1,5})\s+([A-Z][a-z]+(?:\s+[a-z]+){1,4})\s+([^.]+\.)\s*/g;
    while ((match = pattern3.exec(value)) !== null) {
      entries.push({ word: match[1].trim(), def: match[2].trim(), example: match[3].trim() });
    }
  }

  if (entries.length === 0) return `<p>${value}</p>`;

  let html = '<div class="vocab-list">';
  for (const entry of entries) {
    html += `<div class="vocab-item">`;
    html += `<span class="vocab-word">${escapeHTML(entry.word)}</span>`;
    html += `<span class="vocab-def">${escapeHTML(entry.def)}</span>`;
    if (entry.example) html += `<span class="vocab-example">${escapeHTML(entry.example)}</span>`;
    html += `</div>`;
  }
  html += '</div>';
  return html;
}

/**
 * Detect rule-list content: blocks with multiple divisibility rules,
 * multiple → yes/→ no patterns, or repeated rule-starter phrases.
 */
function isRuleList(value) {
  if (!value || value.length < 40) return false;

  // Multiple arrow results (→ yes / → no) — worked examples batched together
  const arrowResults = value.match(/→\s*(?:yes|no)\b/gi);
  if (arrowResults && arrowResults.length >= 2) return true;

  // Multiple rule-starter phrases
  const ruleStarters = value.match(/(?:Divisible by|Last digit|Last two digits|Last three digits|Sum of digits)/gi);
  if (ruleStarters && ruleStarters.length >= 2) return true;

  // Multiple numbered examples with arrows (e.g. '471 → ... 532 → ...')
  const numberedExamples = value.match(/\d+\s*→\s*\d+/g);
  if (numberedExamples && numberedExamples.length >= 2) return true;

  return false;
}

/**
 * Render a rule-list block as a styled <ul class="rule-list">.
 * Splits on rule boundaries: 'Divisible by N', 'Last N digits', 'Sum of digits',
 * or on worked example result markers followed by new content.
 */
function renderRuleList(value) {
  // First try splitting on rule-starter phrases
  const ruleBoundary = /(?=(?:Divisible by|Last digit|Last two digits|Last three digits|Sum of digits)\b)/i;
  let items = value.split(ruleBoundary).map(s => s.trim()).filter(Boolean);

  // If that didn't produce multiple items, try splitting on example boundaries
  if (items.length < 2) {
    // Split where a result (→ yes / → no / ✓) is followed by a new capital letter or digit
    items = value.split(/(?<=[→✓]\s*(?:yes|no)\s+)(?=[A-Z\d])/i)
      .map(s => s.trim()).filter(Boolean);
  }

  if (items.length < 2) return `<p>${value}</p>`; // fallback

  let html = '<ul class="rule-list">';
  for (const item of items) {
    // Further split concatenated examples within each item
    const subItems = item.split(/(?<=[→✓]\s*(?:yes|no)\s+)(?=[A-Z\d])/i);
    if (subItems.length > 1) {
      for (const sub of subItems) {
        const trimmed = sub.trim();
        if (trimmed) html += `<li>${trimmed}</li>`;
      }
    } else {
      html += `<li>${item}</li>`;
    }
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

  const headingPatterns = ['Property Details', 'Section Reminders',
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

    // --- Conservative merge: only merge clear sentence fragments ---

    // NEVER merge blocks that are standalone content
    const hasArrow = /[→⇒]/.test(val);
    const endsWithResult = /(?:→\s*(?:yes|no)|✓)\s*$/i.test(val.trim());
    const isRulePattern = /^(?:Divisible by|Last digit|Last two digits|Last three digits|Sum of digits)/i.test(val.trim());
    const hasNumberedOp = /\d+\s*→\s*\d+/.test(val); // e.g. '471 → 4+7+1=12'
    const isStandaloneLabel = /^(?:Property Details|What they|Why they|Key rule|Key Property|Famous ones|Coverage|Big Idea)/i.test(val.trim());

    if (hasArrow || endsWithResult || isRulePattern || hasNumberedOp || isStandaloneLabel) {
      flushPending();
      result.push(block);
      continue;
    }

    // Only merge if this block is clearly a sentence fragment:
    //  - Starts with lowercase (genuine continuation), OR
    //  - Very short (< 40 chars) AND doesn't look like a standalone rule/definition
    const startsLower = /^[a-z]/.test(val);
    const startsConjunction = /^(?:and|but|or|so|yet|nor|for)\b/i.test(val.trim());
    const isFragment = val.length < 40 && !val.endsWith('.') && !val.endsWith('?') &&
                       !val.endsWith('!') && !val.endsWith(':') && !val.endsWith(';');

    if (startsLower || startsConjunction) {
      // Genuine continuation — merge with pending, then flush
      pendingText += (pendingText ? ' ' : '') + val;
      flushPending();
      continue;
    }

    if (isFragment && pendingText) {
      // Short fragment after existing pending — likely a continuation
      pendingText += (pendingText ? ' ' : '') + val;
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
  // Count capitalized terms followed by parenthetical symbols (supports both ASCII and fullwidth parens)
  const hierarchyTerms = value.match(/[A-Z][a-z]+ Numbers?\s*[（(][^）)]*[）)]/g);
  if (hierarchyTerms && hierarchyTerms.length >= 3) return true;
  // Also detect hierarchies with unicode chars inside parens (ℝ, ℚ, ℤ, ℕ)
  const altTerms = value.match(/(?:Natural|Integer|Rational|Real|Whole|Prime|Complex|Irrational)\s+Numbers?(?:\([^)]+\)|[（】][^）】]+[）】])?/gi);
  return altTerms && altTerms.length >= 3;
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
                  'Big idea', 'Section Reminders', 'Property Details'];
  if (labels.includes(trimmed)) return true;
  // Also match "Property Details What they" — where "Property Details" prefixes the label
  const stripped = trimmed.replace(/^Property Details\s+/i, '').trim();
  if (stripped !== trimmed && labels.includes(stripped.replace(/[.:]+$/, ''))) return true;
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
  // Standard pipe table: lines starting with |
  const pipeLines = lines.filter(l => l.includes('|') && l.trim().startsWith('|'));
  if (pipeLines.length >= 2) return true;
  // Single-line with many pipes
  const singleLine = lines.find(l => (l.match(/\|/g) || []).length >= 6);
  if (singleLine) return true;
  const hasSeparator = lines.some(l => /\|[\s-]+\|/.test(l));
  if (hasSeparator) return true;
  // Inline pipe table: text with "Header | Header | Header" pattern (3+ pipes in a line, not as code)
  const inlinePipeLines = text.split('\n').filter(l => {
    const pipes = (l.match(/\|/g) || []).length;
    return pipes >= 3 && /\w\s*\|\s*\w/.test(l);
  });
  if (inlinePipeLines.length >= 2) return true;
  // Detect flattened table rows: "Term1 Definition1 Term2 Definition2 Term3 Definition3" with pipe separators
  if (text.includes('|') && (text.match(/\|/g) || []).length >= 6) return true;
  return false;
}

/**
 * Convert pipe-delimited text into an HTML table.
 */
function renderTable(text) {
  const lines = text.split('\n').filter(l => l.trim());
  let pipeLines = lines.filter(l => l.includes('|') && l.trim().startsWith('|'));

  // If no standard pipe lines, try inline pipe tables: "Header1 | Header2 | Header3"
  if (pipeLines.length < 2) {
    pipeLines = lines.filter(l => {
      const pipes = (l.match(/\|/g) || []).length;
      return pipes >= 3 && /\w\s*\|\s*\w/.test(l);
    });
  }

  // If still no lines, try single-line with many pipes
  if (pipeLines.length === 0) {
    const singleLine = lines.find(l => (l.match(/\|/g) || []).length >= 6);
    if (singleLine) pipeLines = [singleLine];
  }

  if (pipeLines.length === 0) return `<p>${text}</p>`;

  function parseRow(line) {
    // Strip leading/trailing pipes if present, then split
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
    '#readerPane li, #readerPane .rule-list li'
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

/**
 * Detect definition-list style blocks: "Title: Label1: desc. Label2: desc. Label3: desc."
 * Examples: "Laws of Exponents: Product Rule: a^m * a^n = a^(m+n) — add exponents. Quotient Rule: ..."
 */
function isDefinitionList(value) {
  if (!value || typeof value !== 'string') return false;
  if (value.length < 150) return false;
  // Count colons in the text — definition lists have many
  const colons = (value.match(/:/g) || []).length;
  if (colons < 3) return false;
  // Check how many have a short label before them (1-3 words, <= 25 chars)
  const parts = value.split(':');
  let shortLabels = 0;
  for (let i = 0; i < parts.length - 1; i++) {
    const before = parts[i].trim();
    const words = before.split(/\s+/);
    const lastWords = words.slice(-3).join(' ');
    if (lastWords.length <= 25 && /^[A-Za-z]/.test(lastWords) && !(/[.!?]$/.test(before))) {
      shortLabels++;
    }
  }
  return shortLabels >= 3;
}

/**
 * Render a definition-list style block as a styled list with title.
 */
function renderDefinitionList(value) {
  // Find the first label to extract the title prefix
  const firstLabelMatch = value.match(/^([^:]+?):\s*/);
  const title = firstLabelMatch ? firstLabelMatch[1].trim() : '';
  const body = firstLabelMatch ? value.slice(firstLabelMatch[0].length) : value;
  
  // Split on "Label:" patterns to extract pairs
  const labelRe = /\b([A-Z][A-Za-z]{1,}(?:\s+[A-Za-z]+){0,3}):\s*/g;
  const parts = [];
  let lastIdx = 0;
  let m;
  while ((m = labelRe.exec(body)) !== null) {
    if (parts.length > 0) {
      parts[parts.length - 1].desc = body.slice(lastIdx, m.index).trim();
    }
    parts.push({ label: m[1] });
    lastIdx = m.index + m[0].length;
  }
  if (parts.length > 0) {
    parts[parts.length - 1].desc = body.slice(lastIdx).trim();
  }
  
  // Filter out very short labels that are likely noise
  const validParts = parts.filter(p => p.label.length >= 3 && p.desc && p.desc.length >= 5);
  if (validParts.length < 2) return `<p>${value}</p>`;
  
  let html = '<div class="definition-list">';
  if (title) {
    html += `<div class="definition-list-title">${escapeHTML(title)}</div>`;
  }
  html += '<dl>';
  for (const part of validParts) {
    html += `<dt>${escapeHTML(part.label)}</dt><dd>${escapeHTML(part.desc)}</dd>`;
  }
  html += '</dl></div>';
  return html;
}

/**
 * Detect table-like content without pipe characters.
 * Patterns: 4+ short repeated entries like "Word1 Def1 Word2 Def2 Word3 Def3"
 * or header row followed by data rows.
 */
function isTableLikeContent(value) {
  if (!value || typeof value !== 'string') return false;
  if (value.length < 200) return false;
  if (value.includes('|')) return false; // already handled by isTableContent
  
  // Pattern: 4+ entries of "Multi-word Phrase Short description" ending with period
  // e.g. "Wear your heart on your sleeve Show emotions openly She wears her heart on her sleeve."
  const idiomRe = /([A-Z][a-z]+(?:\s+[a-z]+){1,6})\s+([A-Z][a-z]+(?:\s+[a-z]+){1,3})\s+([A-Z][^.]*\.)/g;
  let count = 0;
  let m;
  while ((m = idiomRe.exec(value)) !== null) count++;
  if (count >= 4) return true;
  
  // Pattern: header-like row of consecutive capitalized words followed by data
  // e.g. "Filipino Idiom Literal English Actual Meaning Bukas ang tenga Open the ear Listen carefully"
  const words = value.split(/\s+/);
  // Group consecutive capitalized words into header groups
  // Stop when we hit a word that's clearly not a column header
  const headerGroups = [];
  let hi = 0;
  while (hi < Math.min(words.length, 15)) {
    if (/^[A-Z][a-z]*$/.test(words[hi])) {
      const group = [words[hi]];
      hi++;
      while (hi < Math.min(words.length, 15) && /^[A-Z][a-z]*$/.test(words[hi])) {
        group.push(words[hi]);
        hi++;
      }
      // Check if next word signals start of data (lowercase, non-English, etc.)
      const nextWord = words[hi] || '';
      const isDataStart = nextWord && !/^[A-Z][a-z]*$/.test(nextWord);
      headerGroups.push(group.join(' '));
      if (isDataStart && headerGroups.length >= 2) break;
    } else {
      break;
    }
  }
  // Need at least 2 header groups (e.g. "Filipino Idiom" + "Literal English" + "Actual Meaning")
  if (headerGroups.length >= 2 && words.length >= headerGroups.length + 4) {
    const remaining = words.slice(hi).join(' ');
    // Check for Filipino/mixed language content or multi-word phrases in data
    const filipinoWords = remaining.match(/\b(ang|ng|sa|mga|nasa|kung|siya|hindi|para|aking|ko|mo|di)\b/gi);
    if (filipinoWords && filipinoWords.length >= 2) return true;
    // Also detect English multi-column tables with 3+ headers
    if (headerGroups.length >= 3) return true;
  }
  
  return false;
}

/**
 * Render table-like content without pipes as an HTML table.
 */
function renderTableLikeContent(value) {
  // Try idiom pattern first: "Phrase Meaning Example."
  const idiomRe = /([A-Z][a-z]+(?:\s+[a-z]+){1,6})\s+([A-Z][a-z]+(?:\s+[a-z]+){1,3})\s+([A-Z][^.]*\.)/g;
  const entries = [];
  let m;
  while ((m = idiomRe.exec(value)) !== null) {
    entries.push({ phrase: m[1].trim(), meaning: m[2].trim(), example: m[3].trim() });
  }
  
  if (entries.length >= 4) {
    let html = '<table class="data-table"><thead><tr><th>Phrase</th><th>Meaning</th><th>Example</th></tr></thead><tbody>';
    for (const e of entries) {
      html += `<tr><td>${escapeHTML(e.phrase)}</td><td>${escapeHTML(e.meaning)}</td><td>${escapeHTML(e.example)}</td></tr>`;
    }
    html += '</tbody></table>';
    return html;
  }
  
  // Try Filipino table: header row + data rows
  const words = value.split(/\s+/);
  // Group consecutive capitalized words into header groups
  // Stop when we hit a word that's clearly not a column header
  const headerGroups = [];
  let hi = 0;
  while (hi < Math.min(words.length, 15)) {
    if (/^[A-Z][a-z]*$/.test(words[hi])) {
      const group = [words[hi]];
      hi++;
      while (hi < Math.min(words.length, 15) && /^[A-Z][a-z]*$/.test(words[hi])) {
        group.push(words[hi]);
        hi++;
      }
      // Check if next word signals start of data (lowercase, non-English, etc.)
      const nextWord = words[hi] || '';
      const isDataStart = nextWord && !/^[A-Z][a-z]*$/.test(nextWord);
      headerGroups.push(group.join(' '));
      if (isDataStart && headerGroups.length >= 2) break;
    } else {
      break;
    }
  }
  
  if (headerGroups.length >= 2) {
    const headers = headerGroups;
    const dataWords = words.slice(hi);
    const colCount = headers.length;
    
    // Find natural row boundaries by detecting Filipino phrase starts
    // Filipino phrases often start with distinctive patterns
    const filipinoStarts = [];
    for (let j = 0; j < dataWords.length; j++) {
      const w = dataWords[j];
      // Filipino phrase starters: short articles, distinctive words
      if (/^(Bukas|Bulong|Agawan|Bato|Nasa|Kung|Ang|Habang|Pagkakapit)/i.test(w)) {
        filipinoStarts.push(j);
      }
    }
    
    let rows = [];
    if (filipinoStarts.length >= 3) {
      // Use detected boundaries
      for (let r = 0; r < filipinoStarts.length; r++) {
        const start = filipinoStarts[r];
        const end = r + 1 < filipinoStarts.length ? filipinoStarts[r + 1] : dataWords.length;
        rows.push(dataWords.slice(start, end));
      }
    } else {
      // Fallback: split evenly into chunks
      const chunkSize = Math.ceil(dataWords.length / Math.max(3, Math.ceil(dataWords.length / (colCount * 4))));
      for (let r = 0; r < dataWords.length; r += chunkSize) {
        rows.push(dataWords.slice(r, r + chunkSize));
      }
    }
    
    if (rows.length >= 2) {
      let html = '<table class="data-table"><thead><tr>';
      for (const h of headers) html += `<th>${escapeHTML(h)}</th>`;
      html += '</tr></thead><tbody>';
      for (const row of rows) {
        html += '<tr>';
        // Split each row into colCount equal parts
        const wordsPerCol = Math.ceil(row.length / colCount);
        for (let c = 0; c < colCount; c++) {
          const cellWords = row.slice(c * wordsPerCol, (c + 1) * wordsPerCol);
          html += `<td>${escapeHTML(cellWords.join(' '))}</td>`;
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
      return html;
    }
  }
  
  return `<p>${value}</p>`;
}

window.readerScrollTop = function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.router = router;

function saveReaderSettings() {
  try {
    localStorage.setItem('readerSettings', JSON.stringify({ fontSize, useSerif, useNightMode }));
  } catch { /* Safari private browsing */ }
}
