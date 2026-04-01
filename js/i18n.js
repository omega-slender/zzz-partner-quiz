/**
 * Minimal i18n store. Holds the active language, UI strings, and terms
 * (ranks, factions, elements, roles). Populated by setLangData() at init.
 */

export const i18n = {
  strings: {},
  terms: {},
  lang: 'en'
};

/**
 * Replaces the active language data. Called on init and on language switch.
 *
 * @param {string} lang
 * @param {Object} strings
 * @param {Object} terms
 */
export function setLangData(lang, strings, terms) {
  i18n.lang = lang;
  i18n.strings = strings;
  i18n.terms = terms;
}

/**
 * Returns a localised UI string by key. Falls back to the key itself if missing.
 *
 * @param {string} key
 * @returns {string}
 */
export function t(key) {
  return i18n.strings[key] || key;
}

/**
 * Resolves a localised label for an agent attribute ID.
 *
 * @param {string} category - e.g. 'ranks', 'factions', 'elements'
 * @param {string} id
 * @returns {string}
 */
export function term(category, id) {
  if (i18n.terms[category] && i18n.terms[category][id]) {
    return i18n.terms[category][id];
  }
  return id;
}
