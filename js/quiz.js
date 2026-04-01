/**
 * Core quiz logic: data loading, question rendering, scoring, and results.
 *
 * Data files loaded by init (all fetched in parallel):
 *  data/<lang>/ui.json, terms.json, characters.json, questions.json
 *  data/choices.json  - multi flag and trait scores per option
 *  data/agents.json   - element, faction, rank, role, traits, colour
 */

import { state, resetState } from './state.js';
import { i18n, setLangData, t, term } from './i18n.js';
import { getElColor } from './constants.js';
import { transitionScreens, compatText } from './utils.js';
import { saveProgress, loadProgress, clearProgress, saveResult, loadResult } from './storage.js';

/**
 * Fetches all data files for the given language, merges them into state,
 * and populates the DOM with localised strings.
 *
 * @param {string} lang
 * @returns {Promise<void>}
 */
export async function init(lang = 'en') {
  const responses = await Promise.all([
    fetch(`data/${lang}/ui.json`),
    fetch(`data/${lang}/terms.json`),
    fetch(`data/${lang}/characters.json`),
    fetch(`data/${lang}/questions.json`),
    fetch('data/choices.json'),
    fetch('data/agents.json')
  ]);

  for (const res of responses) {
    if (!res.ok) throw new Error(`Error loading ${res.url}: ${res.status}`);
  }

  const [uiRes, termsRes, charsRes, questionsRes, choicesRes, agentsRes] = responses;

  const [uiData, termsData, charsData, agentsData] = await Promise.all([
    uiRes.json(), termsRes.json(), charsRes.json(), agentsRes.json()
  ]);

  setLangData(lang, uiData, termsData);

  const agentMap = {};
  for (const a of agentsData) agentMap[a.id] = a;

  state.characters = charsData.map(c => {
    const a = agentMap[c.id] || {};
    return {
      ...c,
      color: a.color || '#aaa',
      rankId: a.rank,
      factionId: a.faction,
      elementId: a.element,
      roleId: a.role,
      rank: term('ranks', a.rank),
      faction: term('factions', a.faction),
      element: term('elements', a.element),
      role: term('roles', a.role),
      traits: a.traits || {}
    };
  });

  const qText = await questionsRes.json();
  const qLogic = await choicesRes.json();

  state.questions = qText.map((q, i) => ({
    q: q.q,
    multi: qLogic[i].multi,
    opts: q.opts.map((optText, j) => ({
      t: optText,
      s: qLogic[i].opts[j]
    }))
  }));

  state.scores = {};

  preloadImages(state.characters);
  applyUIStrings();
}

/**
 * Kicks off background image preloading for all characters.
 * Missing images are logged as warnings, not thrown.
 *
 * @param {Array<{id: string}>} characters
 */
function preloadImages(characters) {
  for (const char of characters) {
    const img = new Image();
    img.onerror = () => console.warn(`Image not found: data/images/${char.id}.png`);
    img.src = `data/images/${char.id}.png`;
  }
}

/**
 * Writes localised strings into all static DOM elements and shows or hides
 * the resume popup depending on whether saved progress exists.
 */
function applyUIStrings() {
  document.title = t('pageTitle');
  document.documentElement.lang = i18n.lang;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = t('metaDesc');

  document.getElementById('lcd-ticker-text').innerHTML = t('lcdTicker');
  document.getElementById('lcd-text').innerHTML = t('lcdBottom');
  document.getElementById('intro-section-label').textContent = t('sectionSystem');
  document.getElementById('intro-title').textContent = t('introTitle');
  document.getElementById('intro-desc').textContent = t('introDesc');
  document.getElementById('btn-start').textContent = t('btnStart');
  document.getElementById('progress-label').textContent = t('progressLabel');
  document.getElementById('result-section-label').textContent = t('sectionResult');
  document.getElementById('btn-retry').textContent = t('btnRetry');
  document.getElementById('credits-staff').textContent = t('staff');
  document.getElementById('credits-created-by').textContent = t('createdBy');
  document.getElementById('credits-correction').textContent = t('infoCorrection');

  updateLastResultBtn();

  const progress = loadProgress();
  const popup = document.getElementById('popup-resume');
  if (progress && progress.current > 0) {
    document.getElementById('popup-title').textContent = t('popupTitle');
    document.getElementById('popup-desc').textContent = t('popupDesc')
      .replace('{num}', progress.current)
      .replace('{total}', state.questions.length);
    document.getElementById('popup-resume-btn').textContent = t('popupResume');
    document.getElementById('popup-restart').textContent = t('popupRestart');
    popup.classList.remove('hidden');
  } else {
    popup.classList.add('hidden');
  }
}

/**
 * Cosine similarity between two trait score vectors. Missing keys are
 * treated as zero. Returns 0 if either vector has zero magnitude.
 *
 * @param {Object.<string, number>} userScores
 * @param {Object.<string, number>} charTraits
 * @returns {number}
 */
function cosineSimilarity(userScores, charTraits) {
  let dot = 0, magU = 0, magC = 0;

  for (const trait in userScores) {
    const u = userScores[trait];
    const c = charTraits[trait] || 0;
    dot += u * c;
    magU += u * u;
    magC += c * c;
  }

  for (const trait in charTraits) {
    if (!(trait in userScores)) {
      magC += charTraits[trait] * charTraits[trait];
    }
  }

  if (magU === 0 || magC === 0) return 0;
  return dot / (Math.sqrt(magU) * Math.sqrt(magC));
}

/**
 * Resets state and transitions from the intro screen to the quiz.
 */
export function startQuiz() {
  resetState();
  transitionScreens('screen-intro', 'screen-quiz', () => renderQuestion());
}

/**
 * Renders the question at state.current. Pass preSelected to restore a
 * previous selection when navigating back.
 *
 * @param {number[]|null} preSelected
 */
export function renderQuestion(preSelected = null) {
  const q = state.questions[state.current];
  const letters = ['A', 'B', 'C', 'D'];
  const isMulti = q.multi;

  const qLabel = t('questionLabel').replace('{num}', String(state.current + 1).padStart(2, '0'));
  document.getElementById('q-num').textContent = qLabel;
  document.getElementById('prog-num').textContent = `${state.current + 1} / ${state.questions.length}`;
  document.getElementById('prog-bar').style.width = `${((state.current + 1) / state.questions.length) * 100}%`;

  const qTextEl = document.getElementById('q-text');
  qTextEl.classList.remove('q-text-fade');
  void qTextEl.offsetWidth;
  qTextEl.innerHTML = isMulti
    ? `${q.q} <span class="multi-badge">${t('multiBadge')}</span>`
    : q.q;
  qTextEl.classList.add('q-text-fade');

  state.selected = preSelected ? new Set(preSelected) : new Set();
  const optsEl = document.getElementById('q-options');
  optsEl.innerHTML = '';
  const step = 0.08;

  q.opts.forEach((opt, i) => {
    const div = document.createElement('div');
    const isSelected = state.selected.has(i);
    div.className = `option opt-from-left${isMulti ? ' is-multi' : ''}${isSelected ? ' selected' : ''}`;
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.style.animationDelay = `${i * step}s`;
    div.innerHTML = `
      <div class="opt-marker">${isMulti ? '' : letters[i]}</div>
      <div class="opt-text">${opt.t}</div>
    `;
    div.addEventListener('click', () => toggleOption(i, div, isMulti));
    div.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleOption(i, div, isMulti);
      }
    });
    optsEl.appendChild(div);
  });

  const btnNext = document.getElementById('btn-next');
  btnNext.classList.toggle('disabled', state.selected.size === 0);
  btnNext.innerHTML = state.current < state.questions.length - 1
    ? `<span class="btn-label">${t('btnNext')}</span><span class="btn-arrow">→</span>`
    : `<span class="btn-label">${t('btnResult')}</span><span class="btn-arrow">→</span>`;

  const btnBack = document.getElementById('btn-back');
  btnBack.classList.toggle('disabled', state.current === 0);
  btnBack.innerHTML = `<span class="btn-label">${t('btnPrev')}</span><span class="btn-arrow">←</span>`;
}

/**
 * Toggles an option. In single-select mode the previous selection is cleared.
 * Pulses the Next button the first time a selection is made on a fresh question.
 *
 * @param {number}      idx
 * @param {HTMLElement} el
 * @param {boolean}     isMulti
 */
function toggleOption(idx, el, isMulti) {
  if (isMulti) {
    if (state.selected.has(idx)) {
      state.selected.delete(idx);
      el.classList.remove('selected');
    } else {
      state.selected.add(idx);
      el.classList.add('selected');
    }
  } else {
    document.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
    state.selected = new Set([idx]);
    el.classList.add('selected');
  }

  const btnNext = document.getElementById('btn-next');
  const wasDisabled = btnNext.classList.contains('disabled');
  btnNext.classList.toggle('disabled', state.selected.size === 0);

  if (wasDisabled && state.selected.size > 0) {
    btnNext.classList.remove('btn-pulse');
    void btnNext.offsetWidth;
    btnNext.classList.add('btn-pulse');
    btnNext.addEventListener('animationend', () => {
      btnNext.classList.remove('btn-pulse');
    }, { once: true });
  }
}

/**
 * Commits the current selection to scores and history, advances the index,
 * and either renders the next question or calls showResult. Does nothing
 * if no option is selected.
 */
export function nextQuestion() {
  if (state.selected.size === 0) return;

  const q = state.questions[state.current];
  const deltas = {};

  for (const idx of state.selected) {
    const traitScores = q.opts[idx].s;
    for (const [trait, pts] of Object.entries(traitScores)) {
      state.scores[trait] = (state.scores[trait] || 0) + pts;
      deltas[trait] = (deltas[trait] || 0) + pts;
    }
  }

  state.history.push({ selectedSet: new Set(state.selected), deltas });
  state.current++;

  saveProgress(state);

  if (state.current < state.questions.length) renderQuestion();
  else showResult();
}

/**
 * Pops the last history entry, reverses its score deltas, and re-renders
 * the question with the previous selection restored. Does nothing on the
 * first question.
 */
export function prevQuestion() {
  if (state.current === 0 || state.history.length === 0) return;

  const last = state.history.pop();
  for (const [trait, pts] of Object.entries(last.deltas)) {
    state.scores[trait] = (state.scores[trait] || 0) - pts;
    if (state.scores[trait] <= 0) delete state.scores[trait];
  }
  state.current--;
  saveProgress(state);
  renderQuestion([...last.selectedSet]);
}

/**
 * Scores all characters via cosine similarity, scales the top match to ~92%,
 * saves the top-3 results, and transitions to the result screen.
 */
function showResult() {
  const indexed = state.characters
    .map((char, i) => {
      const sim = cosineSimilarity(state.scores, char.traits);
      return { i, sim };
    })
    .sort((a, b) => b.sim - a.sim);

  const topSim = indexed[0].sim;
  const scale = topSim > 0 ? 92 / (topSim * 100) : 1;

  const results = indexed.map(x => ({
    i: x.i,
    pct: Math.min(99, Math.max(1, Math.round(x.sim * 100 * scale)))
  }));

  const top = results[0];
  const char = state.characters[top.i];
  const pct = top.pct;
  const elColor = getElColor(char.elementId);

  clearProgress();
  saveResult({ indexed: results.slice(0, 3).map(x => ({ i: x.i, pct: x.pct })) });

  transitionScreens('screen-quiz', 'screen-result', () => {
    buildResultCard(char, pct, elColor, results);
  });
}

/**
 * Injects the result card HTML into #result-card and animates the score bar.
 *
 * @param {Object}                          char
 * @param {number}                          pct
 * @param {string}                          elColor
 * @param {Array<{i: number, pct: number}>} indexed
 */
function buildResultCard(char, pct, elColor, indexed) {
  const rc = document.getElementById('result-card');
  rc.style.setProperty('--char-color', char.color);
  rc.innerHTML = `
    <div class="result-banner result-anim" style="animation-delay:0.05s">
      <div class="result-bg-anim"></div>
      <img class="result-char-img" src="data/images/${char.id}.png" alt="${char.name}" draggable="false">
      <div class="result-banner-text">
        <div class="result-rank" style="color:${char.color}">${char.rank} · ${char.faction}</div>
        <div class="result-name">${char.name}</div>
        <div class="result-role">${char.role}</div>
        <div class="result-tags">
          <span class="tag" style="color:${elColor}">${char.element}</span>
          <span class="tag">${char.rank}</span>
          <span class="tag">${char.faction}</span>
        </div>
      </div>
    </div>
    <div class="result-body">
      <div class="result-section result-anim" style="animation-delay:0.15s">
        <div class="result-section-title">${t('resultCompat')}</div>
        <div class="result-match-score">
          <div class="score-bar-bg">
            <div class="score-bar-fill" id="score-fill"
              style="width:0%;background:linear-gradient(90deg,#e03020,#f0c030,#40c060);box-shadow:0 0 10px rgba(100,200,80,0.4);"></div>
          </div>
          <div class="score-pct" style="color:${char.color}">${pct}%</div>
        </div>
        <p style="margin-top:10px">${compatText(pct)}</p>
      </div>
      <div class="result-section result-anim" style="animation-delay:0.25s">
        <div class="result-section-title">${t('resultPersonality')}</div>
        <p>${char.personality}</p>
      </div>
      <div class="result-section result-anim" style="animation-delay:0.35s">
        <div class="result-section-title">${t('resultLikes')}</div>
        <p>${char.likes}</p>
      </div>
      <div class="result-section result-anim" style="animation-delay:0.45s">
        <div class="result-section-title">${t('resultWhy')}</div>
        <p>${char.why}</p>
      </div>
      <div class="result-section result-anim" style="animation-delay:0.55s">
        <div class="result-section-title">${t('resultIdeal')}</div>
        <p>${char.partner}</p>
      </div>
      <div class="top3 result-anim" style="animation-delay:0.65s">
        <div class="top3-title">${t('resultTop3')}</div>
        <div class="top3-list">
          ${indexed.slice(0, 3).map((x, i) => buildTop3Item(x, i)).join('')}
        </div>
      </div>
    </div>
  `;

  const retryWrap = document.querySelector('.btn-retry-wrap');
  if (retryWrap) {
    retryWrap.classList.remove('result-anim');
    void retryWrap.offsetWidth;
    retryWrap.classList.add('result-anim');
    retryWrap.style.animationDelay = '0.85s';
  }

  const btnSave = document.getElementById('btn-save-image');
  if (btnSave) btnSave.textContent = t('btnSaveImage');

  requestAnimationFrame(() => {
    setTimeout(() => {
      const fill = document.getElementById('score-fill');
      if (fill) fill.style.width = pct + '%';
    }, 400);
  });
}

/**
 * Maps a percentage to a hue-based colour for the top-3 list labels.
 * Low values are red, high values are green.
 *
 * @param {number} pct
 * @returns {string}
 */
function getPctColor(pct) {
  const hue = Math.round(pct * 1.2);
  return `hsl(${hue}, 85%, 55%)`;
}

/**
 * Builds the HTML for a single top-3 list row.
 *
 * @param {{i: number, pct: number}} entry
 * @param {number} pos - 0-based rank position
 * @returns {string}
 */
function buildTop3Item({ i, pct }, pos) {
  const c = state.characters[i];
  const medals = ['🥇', '🥈', '🥉'];
  const color = getPctColor(pct);
  return `
    <div class="top3-item">
      <div class="top3-pos">${medals[pos]}</div>
      <div class="top3-name">${c.name}</div>
      <div class="top3-pts" style="color:${color}">${pct}%</div>
    </div>
  `;
}

/**
 * Resets state and transitions from the result screen back to the intro.
 */
export function resetQuiz() {
  resetState();
  clearProgress();
  transitionScreens('screen-result', 'screen-intro', () => updateLastResultBtn());
}

/**
 * Shows or hides the last result button depending on whether a saved result exists.
 */
function updateLastResultBtn() {
  const btnLast = document.getElementById('btn-last-result');
  const saved = loadResult();
  if (saved) {
    btnLast.textContent = t('btnLastResult');
    btnLast.classList.remove('hidden');
  } else {
    btnLast.classList.add('hidden');
  }
}

/**
 * Restores a saved in-progress session and transitions to the quiz screen.
 * Does nothing if no saved progress exists.
 */
export function resumeFromSaved() {
  const progress = loadProgress();
  if (!progress) return;

  state.current = progress.current;
  state.scores = progress.scores;
  state.history = progress.history;
  state.selected = new Set();

  transitionScreens('screen-intro', 'screen-quiz', () => renderQuestion());
}

/**
 * Loads the last saved result and renders it without retaking the quiz.
 * Does nothing if no saved result exists.
 */
export function showSavedResult() {
  const saved = loadResult();
  if (!saved) return;

  const indexed = saved.indexed;
  const top = indexed[0];
  const char = state.characters[top.i];
  const pct = top.pct;
  const elColor = getElColor(char.elementId);

  transitionScreens('screen-intro', 'screen-result', () => {
    buildResultCard(char, pct, elColor, indexed);
  });
}

/**
 * Captures the result card as a PNG image and triggers a download.
 * Uses modern-screenshot (loaded dynamically from CDN) which relies on the
 * browser's native rendering engine, avoiding html2canvas CSS parsing issues.
 */
export async function saveResultAsImage() {
  const btn = document.getElementById('btn-save-image');
  if (!btn) return;

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳';

  try {
    const resultCard = document.getElementById('result-card');
    if (!resultCard) return;

    const { domToPng } = await import('https://esm.sh/modern-screenshot@4.4.39');

    const dataUrl = await domToPng(resultCard, {
      scale: 2,
      backgroundColor: '#1c1c1c'
    });

    const link = document.createElement('a');
    link.download = 'zzz-quiz-result.png';
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Failed to save result as image:', err);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}
