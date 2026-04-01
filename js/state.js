/**
 * Shared quiz state. Characters and questions are loaded once at init
 * and stay for the session. Everything else resets between runs.
 */

export const state = {
  /** @type {Object[]} */ characters: [],
  /** @type {Object[]} */ questions: [],
  /** @type {number} */ current: 0,
  /** @type {Object.<string, number>} Accumulated trait scores. */ scores: {},
  /** @type {Set<number>} Option indices selected on the current question. */ selected: new Set(),
  /** @type {Array<{selectedSet: Set<number>, deltas: Object.<string, number>}>} */ history: []
};

/**
 * Resets progress fields without touching characters or questions.
 */
export function resetState() {
  state.current = 0;
  state.scores = {};
  state.selected = new Set();
  state.history = [];
}
