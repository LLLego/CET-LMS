/**
 * Duolingo-style quiz page — subject/chapter selector, question cards, results with confetti
 * CET LMS
 */

import store from '../store.js';
import { SUBJECTS } from '../data.js';
import Audio from '../audio.js';
import router from '../router.js';
import toast from '../components/Toast.js';
import { shuffle, escapeHTML } from '../utils.js';

let quizState = null;
let organizedQuizData = null;
let quizDataPromise = null;
let pendingDiffFilter = null;

/**
 * Load quiz data with caching (shared Promise deduplicates concurrent calls)
 */
function loadQuizData() {
  if (organizedQuizData) return Promise.resolve(organizedQuizData);
  if (quizDataPromise) return quizDataPromise;
  quizDataPromise = fetch('data/quiz_data.json')
    .then(res => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
    .then(data => { organizedQuizData = data; return data; })
    .catch(err => {
      console.warn('Could not load quiz data:', err);
      organizedQuizData = {};
      quizDataPromise = null;
      return {};
    });
  return quizDataPromise;
}

/**
 * Render quiz chapter selector or resume quiz
 * @param {Object} params - Router params
 */
export default function renderQuizSelect(params) {
  const page = document.getElementById('page-quiz');
  if (!page) return;

  // Hide old HTML elements — JS renders its own selection UI
  const oldDropdown = document.getElementById('quizSubjectSelect');
  if (oldDropdown) oldDropdown.style.display = 'none';
  const oldArea = document.getElementById('quizArea');
  if (oldArea) oldArea.style.display = 'none';

  // If we have a subjectId and chapterId, start quiz directly
  if (params?.subjectId && params?.chapterId) {
    loadQuizData().then(data => {
      if (data && Object.keys(data).length > 0) {
        const diff = pendingDiffFilter;
        pendingDiffFilter = null;
        startQuiz(params.subjectId, params.chapterId, diff);
      } else {
        page.innerHTML = `<div class="empty-state"><p>Failed to load quiz data.</p></div>`;
      }
    });
    return;
  }

  // Show loading state then chapter selection UI
  page.innerHTML = `
    <div class="page-header">
      <h2>✎ Quiz Mode</h2>
      <p class="subtitle">Select a subject and chapter to start quizzing</p>
    </div>
    <div class="quiz-subject-grid" id="quizSubjectGrid">
      <p style="color:var(--text-tertiary);">Loading quiz data...</p>
    </div>
  `;

  loadQuizData().then(() => {
    const grid = document.getElementById('quizSubjectGrid');
    if (grid) grid.innerHTML = renderSubjectCards();
  });
}
function renderSubjectCards() {
  if (!organizedQuizData) return '<p>Loading quiz data...</p>';
  

  return Object.entries(organizedQuizData).map(([subjId, chapters]) => {
    const subj = SUBJECTS.find(s => s.id === subjId);
    if (!subj) return '';
    
    return `
      <div class="quiz-subject-card" data-subject="${subjId}">
        <div class="quiz-subject-icon">${subj.icon}</div>
        <h3>${subj.name}</h3>
        <div class="quiz-chapter-list">
          ${Object.entries(chapters).map(([chId, chData]) => `
            <button class="quiz-chapter-btn" onclick="startQuizFromUI('${subjId}', '${chId}')">
              ${escapeHTML(chData.name || chData.title || chId)}
              <span class="quiz-count">${chData.quizzes?.length || 0} questions</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Expose to global scope for onclick handlers
window.startQuizFromUI = function(subjectId, chapterId) {
  Audio.playClick();
  showDifficultySelector(subjectId, chapterId);
};

/**
 * Show difficulty selection popup before starting quiz
 */
function showDifficultySelector(subjectId, chapterId) {
  const chapterData = organizedQuizData?.[subjectId]?.[chapterId];
  if (!chapterData) return;
  
  const questions = chapterData.quizzes || [];
  const counts = { all: questions.length, easy: 0, medium: 0, hard: 0 };
  questions.forEach(q => { if (counts[q.difficulty] !== undefined) counts[q.difficulty]++; });
  
  const page = document.getElementById('page-quiz');
  const popup = document.createElement('div');
  popup.className = 'difficulty-popup';
  popup.innerHTML = `
    <div class="difficulty-modal">
      <h3>Select Difficulty</h3>
      <p class="difficulty-chapter-name">${escapeHTML(chapterData.name || chapterId)}</p>
      <div class="difficulty-options">
        <button class="diff-btn diff-all" onclick="startQuizWithDiff('${subjectId}','${chapterId}','all')">
          <span class="diff-icon">◆</span>
          <span class="diff-label">All Questions</span>
          <span class="diff-count">${counts.all}</span>
        </button>
        <button class="diff-btn diff-easy" onclick="startQuizWithDiff('${subjectId}','${chapterId}','easy')" ${counts.easy===0?'disabled':''}>
          <span class="diff-icon">●</span>
          <span class="diff-label">Easy</span>
          <span class="diff-count">${counts.easy}</span>
        </button>
        <button class="diff-btn diff-medium" onclick="startQuizWithDiff('${subjectId}','${chapterId}','medium')" ${counts.medium===0?'disabled':''}>
          <span class="diff-icon">●</span>
          <span class="diff-label">Medium</span>
          <span class="diff-count">${counts.medium}</span>
        </button>
        <button class="diff-btn diff-hard" onclick="startQuizWithDiff('${subjectId}','${chapterId}','hard')" ${counts.hard===0?'disabled':''}>
          <span class="diff-icon">●</span>
          <span class="diff-label">Hard</span>
          <span class="diff-count">${counts.hard}</span>
        </button>
      </div>
      <button class="btn btn-ghost" onclick="closeDiffPopup()">Cancel</button>
    </div>
  `;
  page.appendChild(popup);
}

window.startQuizWithDiff = function(subjectId, chapterId, diff) {
  closeDiffPopup();
  pendingDiffFilter = diff;
  router.navigate('quiz', { subjectId, chapterId });
};

window.closeDiffPopup = function() {
  const popup = document.querySelector('.difficulty-popup');
  if (popup) popup.remove();
};
/**
 * Start a quiz for a given subject and chapter
 */
function startQuiz(subjectId, chapterId, difficultyFilter) {
  if (!organizedQuizData || !organizedQuizData[subjectId]) {
    toast.error('No quiz data available for this subject.');
    return;
  }

  const chapterData = organizedQuizData[subjectId][chapterId];
  if (!chapterData || !chapterData.quizzes) {
    toast.error('No questions available for this chapter.');
    return;
  }

  let questions = chapterData.quizzes;
  
  // Apply difficulty filter
  if (difficultyFilter && difficultyFilter !== 'all') {
    questions = questions.filter(q => q.difficulty === difficultyFilter);
    if (questions.length === 0) {
      toast.error(`No ${difficultyFilter} questions available for this chapter.`);
      return;
    }
  }
  
  quizState = {
    subjectId,
    chapterId,
    difficultyFilter,
    questions: shuffle(questions),
    current: 0,
    answers: new Array(questions.length).fill(null),
    done: false,
    selected: false,
    hints: new Array(questions.length).fill(false),
  };

  const subj = SUBJECTS.find(s => s.id === subjectId);
  if (!subj) { renderQuizSelect({}); return; }
  const page = document.getElementById('page-quiz');
  
  page.innerHTML = `
    <div class="quiz-header">
      <button class="back-btn" onclick="router.navigate('quiz')">← Back</button>
      <h2>${subj.icon} ${subj.name} — ${escapeHTML(chapterData.name || chapterData.title || chapterId)}</h2>
    </div>
    <div id="quizArea">
      <div id="quizProgress">Question 1 of ${questions.length}</div>
      <div id="quizDots" class="quiz-progress"></div>
      <div id="quizContent"></div>
    </div>
  `;

  renderQuestion();
}

function renderQuestion() {
  if (!quizState || quizState.done) return;
  const { questions, current, answers } = quizState;
  const q = questions[current];

  document.getElementById('quizProgress').textContent = `Question ${current + 1} of ${questions.length}`;

  // Progress dots
  const dotsContainer = document.getElementById('quizDots');
  dotsContainer.innerHTML = '';
  questions.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'quiz-dot';
    if (answers[i] !== null) {
      dot.classList.add(answers[i] === questions[i].ans ? 'correct' : 'wrong');
    }
    if (i === current) dot.classList.add('current');
    dot.textContent = i + 1;
    dot.setAttribute('role', 'button');
    dot.setAttribute('tabindex', '0');
    dot.style.cursor = 'pointer';
    dot.onclick = () => { quizState.current = i; renderQuestion(); };
    dot.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); quizState.current = i; renderQuestion(); } };
    dotsContainer.appendChild(dot);
  });

  // Question card
  const content = document.getElementById('quizContent');
  content.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'quiz-question-card';
  card.innerHTML = `
    <div class="q-label">Question ${current + 1} of ${questions.length} ${q.difficulty ? `<span class="diff-badge diff-${q.difficulty}">${q.difficulty}</span>` : ''}</div>
    <div class="q-text">${escapeHTML(q.q)}</div>
    ${quizState.hints[current] ? '<div class="hint-text">✧ Hint: Think carefully about each option before selecting.</div>' : ''}
    <button class="hint-btn" id="hintBtn">✧ Hint</button>
    <div class="quiz-options" id="qOptions">
      ${q.opts.map((opt, i) => `
        <div class="quiz-option" data-idx="${i}" onclick="handleQuizAnswer(${i})" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();handleQuizAnswer(${i})}" style="animation-delay:${i * 50}ms">
          <span class="letter">${'ABCD'[i]}</span>
          <span>${escapeHTML(opt)}</span>
        </div>
      `).join('')}
    </div>
    <div id="qResult"></div>
  `;
  content.appendChild(card);

  // Hint button
  const hintBtn = document.getElementById('hintBtn');
  if (hintBtn) {
    hintBtn.onclick = () => {
      quizState.hints[current] = true;
      renderQuestion();
    };
  }

  // Navigation buttons
  const navDiv = document.createElement('div');
  navDiv.style.cssText = 'display:flex;justify-content:space-between;margin-top:16px;';

  if (current > 0) {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'btn btn-ghost';
    prevBtn.innerHTML = '◀ Previous';
    prevBtn.onclick = () => { quizState.current--; renderQuestion(); };
    navDiv.appendChild(prevBtn);
  } else {
    navDiv.appendChild(document.createElement('div'));
  }

  if (answers[current] !== null) {
    if (current < questions.length - 1) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-primary';
      nextBtn.innerHTML = 'Next ▶';
      nextBtn.onclick = () => { quizState.current++; renderQuestion(); };
      navDiv.appendChild(nextBtn);
    } else {
      const finishBtn = document.createElement('button');
      finishBtn.className = 'btn btn-primary';
      finishBtn.innerHTML = 'See Results';
      finishBtn.onclick = showResults;
      navDiv.appendChild(finishBtn);
    }
  }
  content.appendChild(navDiv);

  // If already answered, show feedback
  if (answers[current] !== null) {
    showFeedback(current);
  }

  quizState.selected = false;
}

function showFeedback(current) {
  const { answers, questions } = quizState;
  const idx = answers[current];
  if (idx === null) return;
  const isCorrect = idx === questions[current].ans;

  const resultDiv = document.getElementById('qResult');
  resultDiv.innerHTML = `
    <div class="quiz-result-text ${isCorrect ? 'correct' : 'wrong'}">
      ${isCorrect ? '✓ Correct!' : '✗ Incorrect'}
      ${!isCorrect ? `<div class="explanation">Correct answer: <strong>${'ABCD'[questions[current].ans]}. ${escapeHTML(questions[current].opts[questions[current].ans])}</strong></div>` : ''}
      ${questions[current].explanation ? `<div class="quiz-explanation-box">💡 ${escapeHTML(questions[current].explanation)}</div>` : ''}
    </div>
  `;

  // Highlight options
  const options = document.querySelectorAll('.quiz-option');
  options.forEach((opt, i) => {
    opt.classList.add('disabled');
    if (i === questions[current].ans) opt.classList.add('correct');
    if (i === idx && idx !== questions[current].ans) opt.classList.add('wrong');
    if (i === idx) opt.classList.add('selected');
  });
}

function showResults() {
  if (!quizState) return;
  const { questions, answers, subjectId } = quizState;
  quizState.done = true;

  const correct = answers.filter((a, i) => a === questions[i].ans).length;
  const total = questions.length;
  const pct = Math.round((correct / total) * 100);

  let grade = 'F';
  if (pct >= 90) grade = 'A';
  else if (pct >= 80) grade = 'B';
  else if (pct >= 70) grade = 'C';
  else if (pct >= 60) grade = 'D';

  let scoreClass = 'green';
  if (pct < 50) scoreClass = 'red';
  else if (pct < 80) scoreClass = 'orange';

  const content = document.getElementById('quizContent');
  content.innerHTML = `
    <div class="quiz-scorebar" style="flex-direction:column;text-align:center;padding:32px;">
      <div class="score-num ${scoreClass}">${correct}/${total}</div>
      <div style="font-size:24px;font-weight:700;margin:4px 0;">Grade: ${grade}</div>
      <div class="score-detail" style="font-size:16px;">${pct}% Correct</div>
      <div style="margin-top:16px;display:flex;gap:10px;justify-content:center;">
        <button class="btn btn-primary" onclick="retryQuiz()">↻ Retry</button>
        <button class="btn btn-ghost" onclick="exitQuiz()">Back to Subjects</button>
      </div>
    </div>
    <h3 style="font-size:16px;font-weight:600;margin-bottom:12px;">Review Questions</h3>
    ${questions.map((q, i) => `
      <div class="quiz-question-card" style="${answers[i] !== q.ans ? 'border-color:var(--color-error);' : 'border-color:var(--color-success);'}">
        <div class="q-label" style="margin-bottom:4px;">Q${i+1} ${answers[i] === q.ans ? '✓' : '✗'}</div>
        <div class="q-text" style="font-size:14px;margin-bottom:8px;">${escapeHTML(q.q)}</div>
        <div style="font-size:13px;color:var(--text-secondary);">
          Your answer: <strong>${answers[i] !== null ? escapeHTML(q.opts[answers[i]]) : 'Not answered'}</strong>
          ${answers[i] !== q.ans ? `<br>Correct: <strong style="color:var(--color-success);">${escapeHTML(q.opts[q.ans])}</strong>` : ''}
        </div>
        ${q.explanation ? `<div class="quiz-explanation-box" style="margin-top:8px;">💡 ${escapeHTML(q.explanation)}</div>` : ''}
      </div>
    `).join('')}
  `;

  document.getElementById('quizDots').innerHTML = '';

  // Confetti on perfect score
  if (pct === 100) {
    launchConfetti();
    toast.success('✦ Perfect score! Amazing!', 4000);
  } else {
    toast.info(`Quiz complete! Score: ${pct}%`, 3000);
  }

  // Clear last quiz state
  store.set('lastQuizState', null);
  Audio.playTransition();
}

function launchConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  const colors = ['#58CC02', '#1CB0F6', '#FF9600', '#FF4B4B', '#CE82FF', '#FFC800'];
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.width = (Math.random() * 8 + 4) + 'px';
    particle.style.height = (Math.random() * 8 + 4) + 'px';
    particle.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
    particle.style.animationDelay = Math.random() * 0.5 + 's';
    container.appendChild(particle);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 4000);
}

// Expose globally for onclick handlers
window.handleQuizAnswer = function(idx) {
  if (!quizState || quizState.done) return;
  const { current, answers, questions } = quizState;
  if (answers[current] !== null || quizState.selected) return;

  quizState.selected = true;
  answers[current] = idx;

  const isCorrect = idx === questions[current].ans;
  store.recordAnswer(quizState.subjectId, isCorrect);

  if (isCorrect) {
    Audio.playCorrect();
  } else {
    Audio.playIncorrect();
  }

  store.set('lastQuizState', {
    subjectId: quizState.subjectId,
    current,
    total: questions.length,
  });

  renderQuestion();
};

window.retryQuiz = function() {
  if (!quizState) return;
  startQuiz(quizState.subjectId, quizState.chapterId, quizState.difficultyFilter);
};

window.exitQuiz = function() {
  quizState = null;
  renderQuizSelect({});
};