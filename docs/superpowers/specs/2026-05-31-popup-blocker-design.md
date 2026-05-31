# Popup Blocker for streamimdb.ru — Design Spec

**Date:** 2026-05-31  
**Status:** Approved

---

## Problem

`streamimdb.ru` injects ad scripts that attach click listeners to `document` and call `window.open()` on the first user interaction — and periodically afterwards. This opens unwanted new tabs while using the video player. The scripts involved are:

- `https://i.4i3u8ncfz7ygmew8.cfd/*` — obfuscated popunder script loaded in the embed page `<head>`
- `https://histats.com` → `e.dtscout.com` → `t.dtscdn.com/widget` — tracking/ad chain that also registers click-based popunders

---

## Solution

Add a second content script to the existing Chrome extension that overrides `window.open` with a permanent no-op before any page scripts run. This is the standard technique used by ad blockers.

---

## Architecture

### New file: `popup-blocker.js`

Runs in the page's main JS world at `document_start`. Locks `window.open` as a non-writable, non-configurable no-op so ad scripts cannot call or restore it.

```js
(function () {
  'use strict';
  Object.defineProperty(window, 'open', {
    value: function () { return null; },
    writable: false,
    configurable: false
  });
})();
```

Key properties:
- ES5 IIFE with `'use strict'` — consistent with `content.js` conventions
- `writable: false` — ad scripts cannot assign `window.open = ...` to restore the original
- `configurable: false` — ad scripts cannot re-define the property via `Object.defineProperty`
- Returns `null` — the spec-compliant return value when a popup is blocked

### `manifest.json` change

Add a second entry to the `content_scripts` array:

```json
{
  "matches": ["https://streamimdb.ru/*"],
  "js": ["popup-blocker.js"],
  "run_at": "document_start",
  "world": "MAIN"
}
```

- `run_at: "document_start"` — executes before the HTML parser runs, before any `<script>` tags load
- `world: "MAIN"` — runs in the page's JS context (not the isolated content script world), enabling `window.open` override. Requires Chrome 111+.
- `matches: ["https://streamimdb.ru/*"]` — covers both the main site and all embed pages (`/embed/tv/*`, `/embed/movie/*`)

---

## Files Changed

| File | Change |
|---|---|
| `manifest.json` | Add second `content_scripts` entry for `streamimdb.ru` |
| `popup-blocker.js` | New file — ~10 lines, ships with extension |

No new permissions required.

---

## Scope & Constraints

- Only affects `streamimdb.ru` — IMDB content script behaviour is unchanged.
- Blocks all `window.open` calls on `streamimdb.ru`, including any legitimate popups (acceptable trade-off).
- The actual video player lives in an iframe on `brightpathsignals.com` — a different origin. Its `window.open` is in a separate browsing context and is unaffected by this override.
- The `writable: false` + `configurable: false` lock handles the "reappears after a few minutes" pattern: even if ad scripts use `setTimeout` to retry, `window.open` remains a no-op for the entire page session.

---

## Validation

Manual testing (no automated test framework):
1. Load the unpacked extension in `chrome://extensions/`
2. Visit `https://streamimdb.ru/embed/tv/tt0402711`
3. Click anywhere on the page — no new tab should open
4. Wait a few minutes, click again — still no new tab
5. Verify the player still works normally
