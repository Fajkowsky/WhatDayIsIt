# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WhatDayIsIt** is a Chrome extension (Manifest V3) that detects and highlights dates on web pages. It supports multiple locales (English and Polish) with locale-based pattern selection. Shows day of week via tooltip on calendar icon.

## Development

**Commands:**

- `npm run test` - Run unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix lint issues
- `npm run format` - Format code with Prettier
- `npm run check` - Run lint, format check, and tests
- `npm run build` - Bundle source and create ZIP for Chrome Web Store
- `npm run package` - Run checks then build

**Load in Chrome:**

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory

**Manual testing:** Open `tests/test-page.html` in Chrome after loading the extension. Use `?locale=en` or `?locale=pl` URL parameter to test different locales.

**Workflow:** Edit `src/` files → `npm run build` → `npm run check` → Reload extension → Test

## Architecture

### Source of Truth

- **`src/content.js`** - Main content script source (EDIT THIS FILE)
- **`src/patterns/*.js`** - Pattern files for each language
- **`scripts/build.js`** - Bundler that combines source into `content.js`
- **`content.js`** - Generated/bundled output (DO NOT EDIT DIRECTLY)

### Build Process

The build script reads `src/content.js`, injects patterns from `src/patterns/`, wraps in IIFE, and outputs to `content.js`. This ensures single source of truth.

### User Settings (stored in chrome.storage.sync)

1. **enabled** - Global on/off switch (default: true)
2. **highlightEnabled** - Yellow background highlight toggle (default: true)
3. **iconPosition** - Calendar icon position: 'before' or 'after' date (default: 'after')

### Key Files

- **popup.html/popup.js** - Extension popup with settings UI
- **manifest.json** - Chrome extension manifest (v3)

## Important Implementation Details

### HTML Structure

Icon is placed OUTSIDE the `<mark>` element to prevent yellow background on icon:

```html
<mark class="date-hl">2024-12-25</mark
><span class="date-hl-icon">🗓<span class="date-hl-tooltip">Wednesday</span></span>
```

### CSS Classes

- `.date-hl` - Yellow background highlight
- `.date-hl-no-bg` - No background (when highlight disabled), must have `background: transparent` to override `<mark>` default
- `.date-hl-icon` - Calendar icon, must have `background: transparent`
- Both highlight classes need `color: inherit` to preserve page text colors

### ProcessBatch Skip Logic

Must check BOTH classes to prevent re-processing:

```javascript
if (node.parentElement?.closest('.date-hl, .date-hl-no-bg')) continue;
```

### Remove Highlights

1. Remove icons first (`.date-hl-icon`)
2. Then remove marks and restore text content

### SPA Support

MutationObserver watches for DOM changes with 300ms debounce.

## Adding a New Language

1. Create `src/patterns/{lang}.js` exporting an array of regex patterns
2. Add to `scripts/build.js` in the `bundleContentScript` function
3. Register in the `languagePatterns` object

## Common Gotchas

- `<mark>` element has default yellow background in browsers - must explicitly set `background: transparent` when needed
- JavaScript `\b` word boundary doesn't work with Unicode characters (Polish ą, ć, etc.) - use lookahead/lookbehind instead
- Chrome content scripts don't support ES modules - must bundle to IIFE
- Always run `npm run build` after editing `src/` files
