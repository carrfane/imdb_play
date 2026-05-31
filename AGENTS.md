# Agent Instructions for imdb_play

## Project Overview

`imdb_play` is a Chrome Browser Extension (Manifest V3) that injects a "Watch on PlayIMDB" button into IMDB title pages. It has no build system, no framework, and no runtime dependencies — the extension ships as vanilla JavaScript, CSS, and a manifest file.

A secondary set of Node.js + Playwright developer scripts exists for local visual testing and DOM inspection; these are never packaged into the extension.

---

## Tech Stack

- **Extension runtime:** Vanilla JavaScript (ES5 IIFE), plain CSS3, Chrome MV3 manifest
- **Dev tooling:** Node.js, Playwright (`^1.59.1`) — for local development only
- **No bundler, no transpiler, no test framework**

---

## Repository Layout

```
imdb_play/
├── manifest.json          # Chrome Extension entry point (MV3)
├── content.js             # Core content script — DOM observation and button injection
├── styles.css             # Styles for the injected button (#playimdb-btn)
├── inspect_imdb.js        # Dev: Playwright DOM inspector for IMDB pages
├── hero_button_test.js    # Dev: Playwright button injection visual test
├── run_imdb_task.js       # Dev: Playwright full end-to-end task runner
├── package.json           # Node.js config (Playwright devDependency only)
└── README.md              # Project documentation
```

---

## Key Domain Concepts

| Concept | Details |
|---|---|
| **IMDB Title ID** | `tt\d+` extracted from the URL path (e.g., `tt14186672`). Central data point the extension uses. |
| **PlayIMDB URL** | `https://www.playimdb.com/title/{titleId}/` — destination of the injected button. |
| **Hero Section** | IMDB's React-rendered title hero, targeted via `data-testid="hero__pageTitle"`. |
| **MutationObserver** | Used to detect when IMDB's client-side React rendering has added the hero section to the DOM. |
| **Idempotent injection** | `document.getElementById('playimdb-btn')` guard prevents double-injection. |

---

## Code Conventions

- **ES5 IIFE with `'use strict'`** in `content.js` — do not introduce ES modules, `import`, or `export` in the content script.
- **`data-testid` selectors** — target IMDB DOM elements by `data-testid` attributes, not by CSS class names (React auto-generates those and they break).
- **No external runtime dependencies** — `content.js` and `styles.css` must remain self-contained. Never add npm packages that ship into the extension.
- **IMDB gold color** `#F5C518` — used for the button to match IMDB's brand.
- **Localized URL matching** — the manifest covers both `https://www.imdb.com/title/*` and `https://www.imdb.com/*/title/*` for region-prefixed URLs.

---

## Extension Files (Ship These)

Only these three files are part of the Chrome extension and should be treated as production code:

1. `manifest.json`
2. `content.js`
3. `styles.css`

---

## Dev Scripts (Do Not Ship)

The following scripts use Playwright to simulate or inspect the extension behavior in headless Chromium. Run them with `node <script>`:

- `node inspect_imdb.js` — prints IMDB hero DOM structure for debugging selectors
- `node hero_button_test.js` — injects button, captures screenshot around the button area
- `node run_imdb_task.js` — full injection test with full-page and focused screenshots

Screenshots are saved as `*.png` and are excluded from git.

---

## When Making Changes

### Modifying button injection logic (`content.js`)
- Keep the IIFE wrapper and `'use strict'` directive.
- Preserve the idempotent guard (`getElementById('playimdb-btn')` check at both the top and inside the observer callback).
- Keep the `MutationObserver` pattern — do not replace with `DOMContentLoaded` or `window.onload`; IMDB uses client-side React rendering.
- If IMDB changes their DOM structure, update the `data-testid` selector. Use `inspect_imdb.js` to discover current selectors.

### Modifying styles (`styles.css`)
- Scope all rules to `#playimdb-btn` to avoid leaking styles into the IMDB page.
- Maintain the IMDB gold (`#F5C518`) for hover/active states.

### Modifying the manifest (`manifest.json`)
- Keep the `matches` array covering both plain and region-prefixed IMDB title URLs.
- Do not add permissions beyond what is required — the extension currently needs no extra permissions.

### Adding dev scripts
- Follow the existing async IIFE pattern with Playwright.
- Clean up browser/context in a `finally` block to avoid hanging processes.
- Do not add dev scripts to `manifest.json`; they are never loaded by Chrome.

---

## No Automated Tests

There is no test framework. Manual validation is done by:
1. Loading the unpacked extension in `chrome://extensions/` and visiting an IMDB title page.
2. Running the Playwright dev scripts (`node hero_button_test.js`, `node run_imdb_task.js`) and inspecting the saved screenshots.

---

## Common Pitfalls

- **IMDB DOM changes:** IMDB regularly rebuilds their React components, which can change `data-testid` values or DOM nesting. If the button stops injecting, run `node inspect_imdb.js` to inspect current DOM structure.
- **MutationObserver not firing:** If the observer is set up too late or the selector changes, the button will not appear. Always test after IMDB updates.
- **Double injection:** The idempotent guards prevent this, but if the observer is ever restructured, ensure the `getElementById` check is preserved inside the callback.
- **Screenshot artifacts:** Running dev scripts generates `*.png` files. These are gitignored — do not commit them.
