/**
 * localStorage wrapper for the quiz. All reads and writes are try/catched
 * so the app doesn't break in private browsing or when storage is full.
 *
 * Keys used: lang, progress, result (all under the PREFIX namespace).
 */

const PREFIX = 'zzz-compat-quiz-';

/**
 * Saves the preferred language for the quiz.
 *
 * @param {string} lang
 */
export function saveLang(lang) {
  try { localStorage.setItem(PREFIX + 'lang', lang); }
  catch (e) { console.warn('localStorage is disabled or full:', e); }
}

/**
 * Loads the saved language preference.
 *
 * @returns {string|null}
 */
export function loadSavedLang() {
  try { return localStorage.getItem(PREFIX + 'lang'); }
  catch (e) { return null; }
}

/**
 * Saves current quiz progress. Sets in history are serialised to arrays.
 *
 * @param {typeof import('./state.js').state} state
 */
export function saveProgress(state) {
  const data = {
    current: state.current,
    scores: state.scores,
    history: state.history.map(h => ({
      selected: [...h.selectedSet],
      deltas: h.deltas
    }))
  };
  try { localStorage.setItem(PREFIX + 'progress', JSON.stringify(data)); }
  catch (e) { console.warn('localStorage is disabled or full:', e); }
}

/**
 * Loads saved progress. Arrays in history are restored to Sets.
 *
 * @returns {{current: number, scores: Object, history: Array}|null}
 */
export function loadProgress() {
  let raw = null;
  try { raw = localStorage.getItem(PREFIX + 'progress'); }
  catch (e) { return null; }
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return {
      current: data.current,
      scores: data.scores,
      history: data.history.map(h => ({
        selectedSet: new Set(h.selected),
        deltas: h.deltas
      }))
    };
  } catch { return null; }
}

/**
 * Removes saved progress. Called on quiz completion or restart.
 */
export function clearProgress() {
  try { localStorage.removeItem(PREFIX + 'progress'); }
  catch (e) { }
}

/**
 * Saves the top-3 results from a completed run.
 *
 * @param {{indexed: Array<{i: number, pct: number}>}} data
 */
export function saveResult(data) {
  try { localStorage.setItem(PREFIX + 'result', JSON.stringify(data)); }
  catch (e) { console.warn('localStorage is disabled or full:', e); }
}

/**
 * Loads the saved quiz result.
 *
 * @returns {{indexed: Array<{i: number, pct: number}>}|null}
 */
export function loadResult() {
  let raw = null;
  try { raw = localStorage.getItem(PREFIX + 'result'); }
  catch (e) { return null; }
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}
