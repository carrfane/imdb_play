# Popup Blocker for streamimdb.ru — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a content script to the extension that permanently blocks `window.open` on `streamimdb.ru` before any ad scripts can run.

**Architecture:** A new `popup-blocker.js` file runs in the page's main JS world at `document_start`, overriding `window.open` with a non-writable, non-configurable no-op via `Object.defineProperty`. The manifest is updated to inject it on `streamimdb.ru/*`.

**Tech Stack:** Vanilla JavaScript (ES5 IIFE), Chrome Extension Manifest V3

---

### Task 1: Create `popup-blocker.js`

**Files:**
- Create: `popup-blocker.js`

- [ ] **Step 1: Create the file**

Create `/Users/hectorcarrillo/Documents/own_projects/imdb_play/popup-blocker.js` with the following content:

```js
(function () {
  'use strict';

  // Permanently override window.open with a no-op.
  // writable: false and configurable: false prevent ad scripts from
  // restoring the original, even via Object.defineProperty.
  Object.defineProperty(window, 'open', {
    value: function () { return null; },
    writable: false,
    configurable: false
  });
})();
```

- [ ] **Step 2: Verify the file exists and has correct content**

Run:
```bash
cat popup-blocker.js
```

Expected output: the exact content above — an IIFE with `'use strict'` and `Object.defineProperty`.

- [ ] **Step 3: Commit**

```bash
git add popup-blocker.js
git commit -m "feat: add popup-blocker content script for streamimdb.ru"
```

---

### Task 2: Update `manifest.json`

**Files:**
- Modify: `manifest.json`

- [ ] **Step 1: Read the current manifest**

Open `manifest.json`. Current content:

```json
{
  "manifest_version": 3,
  "name": "Play on PlayIMDB",
  "version": "1.0.0",
  "description": "Adds a Play button on IMDB title pages that redirects to PlayIMDB.",
  "content_scripts": [
    {
      "matches": ["https://www.imdb.com/title/*", "https://www.imdb.com/*/title/*"],
      "js": ["content.js"],
      "css": ["styles.css"],
      "run_at": "document_idle"
    }
  ]
}
```

- [ ] **Step 2: Add the popup-blocker content script entry**

Replace the entire file with:

```json
{
  "manifest_version": 3,
  "name": "Play on PlayIMDB",
  "version": "1.1.0",
  "description": "Adds a Play button on IMDB title pages that redirects to PlayIMDB. Blocks popups on streamimdb.ru.",
  "content_scripts": [
    {
      "matches": ["https://www.imdb.com/title/*", "https://www.imdb.com/*/title/*"],
      "js": ["content.js"],
      "css": ["styles.css"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://streamimdb.ru/*"],
      "js": ["popup-blocker.js"],
      "run_at": "document_start",
      "world": "MAIN"
    }
  ]
}
```

Key changes:
- `version` bumped to `1.1.0`
- `description` updated to mention popup blocking
- New `content_scripts` entry for `streamimdb.ru/*` with `run_at: "document_start"` and `world: "MAIN"`

- [ ] **Step 3: Verify the manifest is valid JSON**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('valid JSON')"
```

Expected output: `valid JSON`

- [ ] **Step 4: Commit**

```bash
git add manifest.json
git commit -m "feat: register popup-blocker.js on streamimdb.ru in manifest"
```

---

### Task 3: Manual validation

No automated test framework exists. Validate manually:

- [ ] **Step 1: Load the extension in Chrome**

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle top-right)
3. Click **Load unpacked**
4. Select the `/Users/hectorcarrillo/Documents/own_projects/imdb_play/` directory
5. If the extension was already loaded, click the **refresh** icon on the extension card

- [ ] **Step 2: Verify popup-blocker.js is injected on streamimdb.ru**

1. Navigate to `https://streamimdb.ru/`
2. Open Chrome DevTools (F12) → Console
3. Run:
   ```js
   window.open.toString()
   ```
4. Expected output: `"function () { return null; }"` (the no-op)
   - If it shows `"function open() { [native code] }"`, the script did not inject correctly — check that `world: "MAIN"` is in the manifest and the extension was reloaded.

- [ ] **Step 3: Verify popup is blocked on embed page**

1. Navigate to `https://streamimdb.ru/embed/tv/tt0402711`
2. Click anywhere on the page (player area, background, etc.)
3. Expected: **no new tab opens**
4. Wait 2-3 minutes, click again
5. Expected: **still no new tab opens**

- [ ] **Step 4: Verify IMDB feature is unaffected**

1. Navigate to `https://www.imdb.com/title/tt0402711/`
2. Confirm the "Watch on PlayIMDB" button still appears below the title metadata
3. Click it — confirm it opens `https://www.playimdb.com/title/tt0402711/` in a new tab

- [ ] **Step 5: Verify window.open is NOT blocked on unrelated sites**

1. Navigate to `https://www.google.com/`
2. Open DevTools Console, run:
   ```js
   window.open.toString()
   ```
3. Expected: `"function open() { [native code] }"` — the native function, unmodified

- [ ] **Step 6: Commit validation notes (optional)**

If all checks pass, no code changes needed. The feature is complete.
