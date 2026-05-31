/**
 * Flashcards page — 3D flip cards with Know/Review flow
 * CET LMS
 */

import store from '../store.js';
import { SUBJECTS } from '../data.js';
import Audio from '../audio.js';
import toast from '../components/Toast.js';
import { escapeHTML } from '../utils.js';

let fcState = null;
let flashcardData = null;

async function ensureFCDataLoaded() {
  if (flashcardData) return;
  try {
    const resp = await fetch('data/flashcard_data.json');
    flashcardData = await resp.json();
  } catch (e) {
    console.error('Failed to load flashcard data:', e);
    flashcardData = {};
  }
}

/**
 * Render flashcard subject selector or active deck
 * @param {Object} params - Router params
 */
export default async function renderFlashcards(params) {
  const grid = document.getElementById('fcSubjectSelect');
  if (!grid) return;

  // Ensure data is loaded
  await ensureFCDataLoaded();

  // If subjectId was passed, load that subject's cards directly
  if (params?.subjectId) {
    grid.style.display = 'none';
    document.getElementById('fcArea').style.display = 'block';
    loadFlashcards(params.subjectId);
    return;
  }

  // Show subject card grid (same pattern as QuizPage)
  grid.style.display = 'grid';
  grid.innerHTML = '';
  SUBJECTS.forEach(s => {
    const chapters = flashcardData[s.id] || {};
    const cardCount = Object.values(chapters).reduce((sum, ch) => sum + (ch.flashcards?.length || 0), 0);
    if (cardCount === 0) return;
    const card = document.createElement('div');
    card.className = 'quiz-subject-card';
    card.onclick = () => {
      showChapterSelector(s.id, grid);
    };
    card.innerHTML = `
      <div class="quiz-subject-card-header">
        <span class="quiz-subject-icon">${s.icon}</span>
        <span class="quiz-subject-name">${s.name}</span>
      </div>
      <div class="quiz-subject-meta">${Object.keys(chapters).length} chapters · ${cardCount} cards</div>
    `;
    grid.appendChild(card);
  });

  document.getElementById('fcArea').style.display = 'none';
}

/**
 * Show chapter selector for a subject
 */
function showChapterSelector(subjectId, gridEl) {
  const chapters = flashcardData[subjectId];
  if (!chapters) return;
  
  gridEl.innerHTML = '';
  gridEl.style.display = 'grid';
  
  // Back button
  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-ghost';
  backBtn.textContent = '← Back to Subjects';
  backBtn.style.cssText = 'grid-column:1/-1;justify-self:start;margin-bottom:8px;';
  backBtn.onclick = () => renderFlashcards({});
  gridEl.appendChild(backBtn);
  
  // "All chapters" card
  const allCard = document.createElement('div');
  const totalCards = Object.values(chapters).reduce((sum, ch) => sum + (ch.flashcards?.length || 0), 0);
  allCard.className = 'quiz-subject-card';
  allCard.onclick = () => {
    gridEl.style.display = 'none';
    document.getElementById('fcArea').style.display = 'block';
    loadFlashcards(subjectId);
  };
  allCard.innerHTML = `
    <div class="quiz-subject-card-header">
      <span class="quiz-subject-icon">◆</span>
      <span class="quiz-subject-name">All Chapters</span>
    </div>
    <div class="quiz-subject-meta">${totalCards} cards</div>
  `;
  gridEl.appendChild(allCard);
  
  // Individual chapter cards
  Object.entries(chapters).forEach(([chId, chData]) => {
    const cards = chData.flashcards || [];
    if (cards.length === 0) return;
    const chCard = document.createElement('div');
    chCard.className = 'quiz-subject-card';
    chCard.onclick = () => {
      gridEl.style.display = 'none';
      document.getElementById('fcArea').style.display = 'block';
      loadFlashcardsForChapter(subjectId, chId);
    };
    chCard.innerHTML = `
      <div class="quiz-subject-card-header">
        <span class="quiz-subject-icon">▸</span>
        <span class="quiz-subject-name">${chData.name || chData.title || chId}</span>
      </div>
      <div class="quiz-subject-meta">${cards.length} cards</div>
    `;
    gridEl.appendChild(chCard);
  });
}

/**
 * Load flashcards for a specific chapter
 */
function loadFlashcardsForChapter(subjectId, chapterId) {
  if (!flashcardData) return;
  const chapterData = flashcardData[subjectId]?.[chapterId];
  if (!chapterData) {
    toast.error('No flashcards available for this chapter.');
    return;
  }
  const cards = chapterData.flashcards || [];
  if (cards.length === 0) {
    toast.error('No flashcards available for this chapter.');
    return;
  }
  fcState = {
    subjectId,
    chapterId,
    cards: [...cards],
    current: 0,
    flipped: false,
    deckComplete: false,
  };
  document.getElementById('fcArea').style.display = 'block';
  renderCard();
}

/** Load flashcards for a subject */
function loadFlashcards(subjectId) {
  if (!flashcardData) return;

  const chapters = flashcardData[subjectId];
  if (!chapters) {
    toast.error('No flashcards available for this subject yet.');
    return;
  }

  // Flatten all chapter-level flashcards into one array
  const cards = [];
  Object.values(chapters).forEach(ch => {
    if (ch.flashcards && Array.isArray(ch.flashcards)) {
      cards.push(...ch.flashcards);
    }
  });

  if (cards.length === 0) {
    toast.error('No flashcards available for this subject yet.');
    return;
  }

  fcState = {
    subjectId,
    cards: [...cards],
    current: 0,
    flipped: false,
    deckComplete: false,
  };

  document.getElementById('fcArea').style.display = 'block';
  renderCard();
}

function renderCard() {
  if (!fcState || fcState.deckComplete) return;
  const { cards, current, flipped } = fcState;
  const card = cards[current];

  document.getElementById('fcTerm').textContent = card.term;
  document.getElementById('fcDef').textContent = card.def;

  const cardEl = document.getElementById('fcCard');
  if (flipped) {
    cardEl.classList.add('flipped');
  } else {
    cardEl.classList.remove('flipped');
  }

  const counter = document.getElementById('fcCounter');
  if (counter) counter.textContent = `Card ${current + 1} / ${cards.length}`;

  // Progress bar
  const progressEl = document.getElementById('fcProgress');
  if (progressEl) {
    const pct = ((current + 1) / cards.length) * 100;
    progressEl.innerHTML = `<div class="fill" style="width:${pct}%"></div>`;
  }
}

function flipCard() {
  if (!fcState || fcState.deckComplete) return;
  fcState.flipped = !fcState.flipped;
  const cardEl = document.getElementById('fcCard');
  cardEl.classList.toggle('flipped');
  Audio.playFlip();
}

function nextCard() {
  if (!fcState || fcState.deckComplete) return;
  if (fcState.current < fcState.cards.length - 1) {
    fcState.current++;
    fcState.flipped = false;
    renderCard();
  } else {
    showDeckComplete();
  }
}

function prevCard() {
  if (!fcState || fcState.deckComplete) return;
  if (fcState.current > 0) {
    fcState.current--;
    fcState.flipped = false;
    renderCard();
  }
}

function knowCard() {
  if (!fcState || fcState.deckComplete) return;
  const { subjectId, cards, current } = fcState;
  const card = cards[current];
  const key = card.term;

  const known = store.get('flashcardKnown') || {};
  const review = store.get('flashcardReview') || {};
  if (!known[subjectId]) known[subjectId] = {};
  if (!review[subjectId]) review[subjectId] = {};

  known[subjectId][key] = Date.now();
  delete (review[subjectId] || {})[key];
  store.set('flashcardKnown', known);
  store.set('flashcardReview', review);

  toast.success(`✓ "${card.term}" marked as known!`);
  Audio.playCorrect();

  if (current < cards.length - 1) {
    fcState.current++;
    fcState.flipped = false;
    renderCard();
  } else {
    showDeckComplete();
  }
}

function reviewCard() {
  if (!fcState || fcState.deckComplete) return;
  const { subjectId, cards, current } = fcState;
  const card = cards[current];
  const key = card.term;

  const known = store.get('flashcardKnown') || {};
  const review = store.get('flashcardReview') || {};
  if (!known[subjectId]) known[subjectId] = {};
  if (!review[subjectId]) review[subjectId] = {};

  review[subjectId][key] = Date.now();
  delete (known[subjectId] || {})[key];
  store.set('flashcardKnown', known);
  store.set('flashcardReview', review);

  toast.warning(`⟳ "${card.term}" marked for review.`);
  Audio.playIncorrect();

  if (current < cards.length - 1) {
    fcState.current++;
    fcState.flipped = false;
    renderCard();
  } else {
    showDeckComplete();
  }
}

function showDeckComplete() {
  if (!fcState) return;
  fcState.deckComplete = true;

  const { subjectId, cards } = fcState;
  const deckTerms = new Set(cards.map(c => c.term));
  const known = store.get('flashcardKnown') || {};
  const review = store.get('flashcardReview') || {};
  const knownCount = known[subjectId] ? Object.keys(known[subjectId]).filter(k => deckTerms.has(k)).length : 0;
  const reviewCount = review[subjectId] ? Object.keys(review[subjectId]).filter(k => deckTerms.has(k)).length : 0;
  const subj = SUBJECTS.find(s => s.id === subjectId);

  const area = document.getElementById('fcArea');
  area.innerHTML = `
    <div class="fc-deck-complete">
      <div class="fc-complete-icon">✦</div>
      <h3>Deck Complete!</h3>
      <p>${subj ? subj.name : 'Subject'} flashcards</p>
      <div style="margin-top:16px;display:flex;gap:16px;justify-content:center;">
        <div><strong style="color:var(--color-success);font-size:24px;">${knownCount}</strong><br><span style="font-size:12px;color:var(--text-tertiary);">Known</span></div>
        <div><strong style="color:var(--color-warning);font-size:24px;">${reviewCount}</strong><br><span style="font-size:12px;color:var(--text-tertiary);">To Review</span></div>
      </div>
      <div style="margin-top:20px;">
        <button class="btn btn-primary" onclick="resetFlashcards()">↻ Study Again</button>
      </div>
    </div>
  `;

  Audio.playTimerComplete();
  toast.success(`✦ ${subj ? subj.name : ''} deck complete! ${knownCount} known, ${reviewCount} to review.`, 4000);
}

window.flipFlashcard = function() { flipCard(); };
window.nextCard = function() { nextCard(); };
window.prevCard = function() { prevCard(); };
window.knowCard = function() { knowCard(); };
window.reviewCard = function() { reviewCard(); };
// Expose reset for the deck complete screen
const FC_CARD_HTML = `
  <div style="margin-bottom:16px;">
    <button class="btn btn-ghost" onclick="fcBackToSubjects()" style="font-size:14px;">← Back to subjects</button>
  </div>
  <div class="fc-progress" id="fcProgress"><div class="fill" style="width:0%"></div></div>
  <div class="flashcard-container" onclick="flipFlashcard()">
    <div class="flashcard" id="fcCard">
      <div class="flashcard-face front">
        <div class="fc-label">Term</div>
        <div class="fc-term" id="fcTerm">Loading...</div>
        <div class="fc-hint">Tap to flip</div>
      </div>
      <div class="flashcard-face back">
        <div class="fc-label">Definition</div>
        <div class="fc-def" id="fcDef">Loading...</div>
      </div>
    </div>
  </div>
  <div class="fc-controls">
    <button class="fc-btn prev" onclick="prevCard()">◀ Previous</button>
    <button class="fc-btn know" onclick="knowCard()">✓ Know</button>
    <button class="fc-btn review" onclick="reviewCard()">⟳ Review</button>
    <button class="fc-btn next" onclick="nextCard()">Next ▶</button>
  </div>
  <div class="fc-counter" id="fcCounter">Card 1 / 1</div>
`;

window.resetFlashcards = function() {
  if (fcState) {
    const prevSubjectId = fcState.subjectId;
    fcState = null;
    // Restore card DOM elements destroyed by showDeckComplete()
    const area = document.getElementById('fcArea');
    if (area) area.innerHTML = FC_CARD_HTML;
    renderFlashcards({ subjectId: prevSubjectId });
  }
};

// Back to subject grid from active cards
window.fcBackToSubjects = function() {
  fcState = null;
  renderFlashcards({});
};