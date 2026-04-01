/**
 * App-wide constants. Just element colours for now.
 */

/** @type {Object.<string, string>} Hex colours keyed by element ID. */
const EL_COLORS = {
  fire: '#ff5030',
  ice: '#64d8f8',
  electric: '#c896ff',
  physical: '#ffc060',
  ether: '#80ffb0',
  sharp_blade: '#2dd9b8',
  auric_ink: '#d4a850',
  frost: '#a8e0f0'
};

/**
 * Returns the hex colour for an element ID, or a neutral grey if unknown.
 *
 * @param {string|undefined} elementId
 * @returns {string}
 */
export function getElColor(elementId) {
  return EL_COLORS[elementId] || '#aaa';
}
