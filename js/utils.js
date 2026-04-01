/**
 * Small UI helpers used across multiple modules.
 */

import { t } from './i18n.js';

/**
 * Maps a compatibility percentage to one of four localised tier strings.
 *
 * @param {number} pct
 * @returns {string}
 */
export function compatText(pct) {
  if (pct >= 80) return t('compatHigh');
  if (pct >= 60) return t('compatMedHigh');
  if (pct >= 40) return t('compatMedLow');
  return t('compatLow');
}

/**
 * Plays a CSS exit animation on fromId, then reveals toId with an entry
 * animation. onReady fires in between so content can be built before the
 * screen becomes visible. Also scrolls back to the top.
 *
 * @param {string}   fromId
 * @param {string}   toId
 * @param {Function} onReady
 */
export function transitionScreens(fromId, toId, onReady) {
  const fromEl = document.getElementById(fromId);
  const toEl = document.getElementById(toId);

  fromEl.classList.add('screen-exit');
  fromEl.classList.remove('screen-enter');

  setTimeout(() => {
    fromEl.classList.add('hidden');
    fromEl.classList.remove('screen-exit');

    if (onReady) onReady();

    toEl.classList.remove('hidden');
    toEl.classList.add('screen-enter');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toEl.addEventListener('animationend', function handler() {
      toEl.classList.remove('screen-enter');
      toEl.removeEventListener('animationend', handler);
    });
  }, 300);
}
