# Play on PlayIMDB — Chrome Extension

A lightweight Chrome Extension that injects a **"Watch on PlayIMDB"** button into every IMDB title page, linking directly to the corresponding title on [PlayIMDB](https://www.playimdb.com).

## How it works

When you visit any IMDB title page, the extension:

1. Extracts the title ID (e.g. `tt14186672`) from the URL
2. Waits for IMDB's React-rendered hero section to load
3. Injects a styled button below the title metadata row
4. Clicking the button opens `https://www.playimdb.com/title/{id}/` in a new tab

## Supported URLs

The extension activates on all IMDB title pages, including localized variants:

- `https://www.imdb.com/title/*` — English (default)
- `https://www.imdb.com/*/title/*` — Localized (e.g. `/es/`, `/fr/`, `/de/`, etc.)

## Installation (unpacked)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the project folder
5. Navigate to any IMDB title page — the button will appear below the title

## Project structure

```
imdb_play/
├── manifest.json         # Chrome Extension manifest (MV3)
├── content.js            # Content script — DOM injection logic
├── styles.css            # Button styles injected alongside the content script
├── inspect_imdb.js       # Playwright script — DOM inspection/debug tool
├── hero_button_test.js   # Playwright script — visual button injection test
├── run_imdb_task.js      # Playwright script — full task runner with screenshots
└── package.json          # Node.js deps (Playwright, for dev scripts only)
```

## Development scripts

The Playwright scripts are developer tools for prototyping and verifying the extension's behavior against the live IMDB DOM without manually reloading the extension.

```bash
npm install

# Inspect the IMDB hero DOM structure
node inspect_imdb.js

# Run a full end-to-end simulation with screenshots
node run_imdb_task.js

# Visual validation — injects the button and verifies placement
node hero_button_test.js
```

> Screenshots are saved as `.png` files in the project root and are excluded from version control.

## Tech stack

- Vanilla JavaScript (ES5 IIFE, `MutationObserver`)
- Plain CSS3
- Chrome Extension Manifest V3
- [Playwright](https://playwright.dev) (dev tooling only)
