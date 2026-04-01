/**
 * App entry point. Exposes quiz functions on window for inline HTML handlers,
 * wires up the resume popup and language switch, then boots the app.
 */

import { init, startQuiz, nextQuestion, prevQuestion, resetQuiz, resumeFromSaved, showSavedResult, saveResultAsImage } from './quiz.js';
import { initBackgroundAnimation, initEmblemAnimation } from './animations.js';
import { saveLang, loadSavedLang, clearProgress } from './storage.js';

window.startQuiz = startQuiz;
window.nextQuestion = nextQuestion;
window.prevQuestion = prevQuestion;
window.resetQuiz = resetQuiz;
window.showLastResult = showSavedResult;
window.saveResultAsImage = saveResultAsImage;

/**
 * Dismisses the resume popup. Resumes the saved session if doResume is true,
 * otherwise discards the saved progress.
 *
 * @param {boolean} doResume
 */
window.dismissPopup = function (doResume) {
  document.getElementById('popup-resume').classList.add('hidden');
  if (doResume) {
    resumeFromSaved();
  } else {
    clearProgress();
  }
};

/**
 * Switches the active language, persists the choice, and re-runs init.
 *
 * @param {string} lang
 */
window.selectLang = async function (lang) {
  const buttons = document.querySelectorAll('.lang-btn');
  buttons.forEach(btn => { btn.disabled = true; });

  saveLang(lang);
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  try {
    await init(lang);
  } catch (err) {
    console.error('Failed to switch language:', err);
  } finally {
    buttons.forEach(btn => { btn.disabled = false; });
  }
};

/**
 * Returns 'es' for Spanish browser locales, 'en' for everything else.
 *
 * @returns {string}
 */
function getPreferredLang() {
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang && browserLang.toLowerCase().startsWith('es')) {
    return 'es';
  }
  return 'en';
}

// Resolve language, init, show page, start animations.
(async () => {
  const savedLang = loadSavedLang() || getPreferredLang();

  try {
    await init(savedLang);
  } catch (err) {
    console.error('Failed to initialize quiz:', err);
  }

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === savedLang);
  });

  const loader = document.getElementById('app-loader');
  if (loader) loader.remove();

  document.body.style.visibility = 'visible';
  initEmblemAnimation();
  initBackgroundAnimation();
})();
