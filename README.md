# ZZZ Partner Quiz ⚡💘

A personality-based web quiz that discovers which female agent from **Zenless Zone Zero** would be your ideal partner. Built with vanilla HTML, CSS, and JavaScript, featuring a cassette-player / EZStudio aesthetic, animated backgrounds, multilingual support (EN/ES), and a save-result system.

> ⚠️ **This is an unofficial fan project.** It is not affiliated with, endorsed by, or associated with miHoYo / HoYoverse in any way. All rights to Zenless Zone Zero, its characters, names, images, and lore belong exclusively to **miHoYo / HoYoverse**.

---

## 🎯 Overview

ZZZ Partner Quiz is a personal and portfolio project inspired by the world of Zenless Zone Zero. It presents the player with a series of personality questions and uses a trait-alignment scoring system to match them with one of several female agents from the game. Results include a compatibility score, a character banner with dynamic visual effects, and a top-3 ranking.

The quiz is fully bilingual (English and Spanish), saves progress locally so you can resume a session, and lets you save your result as an image to share.

---

## ✨ Features

### 🎮 Quiz System
- **Trait-based scoring** 📊: Each answer contributes weighted deltas to character trait scores, ensuring nuanced matches.
- **Multi-select support** ✅: Some questions allow multiple answers, rewarding more expressive responses.
- **Back navigation** ↩️: Full back-button history — change your mind without restarting.
- **Progress persistence** 💾: Saves your current session to `localStorage` so you can resume later.

### 🖼️ Results Screen
- **Dynamic character banner** 🌟: Each result displays a character-colored glowing banner with animated effects.
- **Compatibility score** 🎯: A percentage score with a colour-coded progress bar and compatibility tier label.
- **Top-3 ranking** 🏆: See your three closest matches, not just the winner.
- **Save as image** 📸: Export your result card as a PNG to share anywhere.

### 🌍 Internationalization
- **English and Spanish** 🌐: Full translation of all UI strings, questions, and character descriptions.
- **Auto-detection** 🔍: Automatically picks your browser's preferred language on first visit.
- **In-quiz switching** 🔄: Change language at any time from the intro screen.

### 🎨 Design & UX
- **EZStudio / cassette aesthetic** 📼: Custom CSS design inspired by the in-game New Eridu interface.
- **Animated background** ✨: Canvas-based dot-grid with cursor-reactive cross markers and a scan-line sweep.
- **Floating emblem** 🌀: Gyroscopic SVG emblem that reacts to cursor position.
- **Smooth transitions** 🎞️: Screen enter/exit animations, option slide-ins, and result reveal sequences.
- **LCD ticker & display** 📟: Scrolling text tickers on both the header and footer panels.

---

## 🚀 Getting Started

The quiz is live and playable right now via GitHub Pages — no setup needed:

**👉 [omega-slender.github.io/zzz-partner-quiz](https://omega-slender.github.io/zzz-partner-quiz)**

If you want to run it locally, no build step, no dependencies, and no installation are required. Just serve it with any static file server:

```bash
# Python
python -m http.server 8080

# Node.js (npx, no install)
npx serve .
```

Then visit `http://localhost:8080` in any modern browser.

---

## 🛠️ Tech Stack

- **Vanilla HTML5 / CSS3 / ES Modules** — no frameworks, no bundlers.
- **Canvas API** — background animation and result image export.
- **localStorage** — progress and result persistence.
- **Google Fonts** — Barlow Condensed, Barlow, Share Tech Mono.
- **`color-mix()`** — CSS-native per-character dynamic theming on the result banner.

---

## ⚖️ Disclaimer

This is an **unofficial fan project** created for personal and portfolio purposes. It is **not** affiliated with, sponsored by, or approved by miHoYo / HoYoverse.

All names, characters, images, artwork, and lore related to **Zenless Zone Zero** are the exclusive intellectual property of **miHoYo / HoYoverse**. They are referenced here solely for non-commercial fan appreciation.

**Support the official game!** 👉 [zenless.hoyoverse.com](https://zenless.hoyoverse.com/)

---

## 🙏 Special Thanks

A very special shout-out to **[JoshuaSk](https://x.com/JoshuaSk14)** ⭐ — this project would not have been possible without his invaluable help and corrections. His support throughout the development process made all the difference. Thank you!

---

## 👨‍💻 Author

Created and maintained by **Omega Slender**.

<a href="https://linktr.ee/omega_slender"><img src="https://img.shields.io/badge/Linktree-1de9b6?style=for-the-badge&logo=linktree&logoColor=white" alt="Linktree" height="28"></a>
<a href="https://ko-fi.com/omega_slender"><img src="https://img.shields.io/badge/Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white" alt="Ko-fi" height="28"></a>

---

## 📄 License

This project is released under a **Custom All Rights Reserved License**. You may **not** copy, modify, distribute, or use this project or any of its parts without explicit written permission from the author. See [`LICENSE`](LICENSE) for full terms.

---

⭐ If you find this library useful, consider giving it a star!