# WhatDayIsIt - Project Summary

## What Is It?

**WhatDayIsIt** is a Chrome browser extension that automatically detects and highlights dates on any webpage you visit. When you hover over a highlighted date, it shows you what day of the week that date falls on (Monday, Tuesday, etc.).

### The Problem It Solves

Ever looked at a date like "January 15, 2025" and wondered "Wait, is that a Monday or a Tuesday?" You'd normally have to:

1. Open a calendar app
2. Navigate to that month
3. Find the date
4. Check the day

**WhatDayIsIt** does this instantly - just hover over any date on any webpage.

---

## Features

### Core Functionality

- **Automatic date detection** - Finds dates in any format on webpages
- **Day of week tooltip** - Hover over the 🗓 icon to see the day
- **Yellow highlight** - Dates stand out visually on the page
- **Works on all websites** - News, emails, booking sites, etc.

### Supported Date Formats

| Format Type      | Examples                              |
| ---------------- | ------------------------------------- |
| ISO              | `2024-12-25`, `2024-12-25T14:30:00Z`  |
| US Numeric       | `12/25/2024`, `12-25-2024`            |
| EU Numeric       | `25.12.2024`, `25/12/2024`            |
| English Text     | `December 25, 2024`, `Dec 25th, 2024` |
| English Relative | `today`, `tomorrow`, `yesterday`      |
| Polish Text      | `25 grudnia 2024`, `15 stycznia`      |
| Polish Relative  | `dzisiaj`, `jutro`, `wczoraj`, `dziś` |

### User Settings (via popup)

1. **Enable/Disable** - Turn the extension on or off globally
2. **Highlight Toggle** - Show/hide the yellow background (keep just the icon)
3. **Icon Position** - Place the 🗓 icon before or after the date

---

## Technical Architecture

### Tech Stack

- **Platform**: Chrome Extension (Manifest V3)
- **Language**: Vanilla JavaScript (ES2022)
- **Build Tool**: Custom Node.js bundler
- **Testing**: Vitest
- **Linting**: ESLint + Prettier

### File Structure

```
whatdayisit/
├── src/                    # Source code (edit these)
│   ├── content.js          # Main content script
│   └── patterns/           # Date regex patterns
│       ├── common.js       # Universal patterns (ISO, numeric)
│       ├── en.js           # English patterns
│       ├── pl.js           # Polish patterns
│       └── index.js        # Pattern loader
├── scripts/
│   └── build.js            # Bundler script
├── tests/
│   ├── patterns.test.js    # Pattern matching tests
│   └── content.test.js     # Content script logic tests
├── content.js              # Bundled output (generated)
├── popup.html              # Settings popup UI
├── popup.js                # Settings logic
├── manifest.json           # Chrome extension config
├── PRIVACY.md              # Privacy policy
└── CLAUDE.md               # AI assistant instructions
```

### How It Works

1. **Page Load**: Content script injected into every webpage
2. **DOM Walking**: TreeWalker finds all text nodes
3. **Pattern Matching**: Combined regex tests each text node
4. **Highlighting**: Matching dates wrapped in `<mark>` with tooltip
5. **Day Calculation**: JavaScript Date API determines day of week
6. **SPA Support**: MutationObserver watches for dynamic content changes

### Build Process

```
src/content.js + src/patterns/*.js
            ↓
    scripts/build.js (bundler)
            ↓
      content.js (IIFE)
            ↓
    dist/whatdayisit-v1.3.zip
```

The build script:

1. Reads source files
2. Extracts patterns from pattern files
3. Injects `getDatePatterns()` function
4. Wraps everything in an IIFE (Immediately Invoked Function Expression)
5. Creates ZIP for Chrome Web Store

---

## Performance Optimizations

| Optimization          | Purpose                              |
| --------------------- | ------------------------------------ |
| `requestIdleCallback` | Process DOM during browser idle time |
| Batch processing      | Handle 50 nodes at a time            |
| Max nodes limit       | Skip pages with >10,000 text nodes   |
| Debounced observer    | 300ms delay for SPA content changes  |
| Combined regex        | Single pass with all patterns        |

---

## Privacy & Security

- **Zero data collection** - Nothing leaves your browser
- **No analytics** - No tracking whatsoever
- **No external requests** - Works entirely offline
- **Minimal permissions** - Only `activeTab` and `storage`
- **Open source** - Code is fully auditable

---

## Development Commands

```bash
npm run build      # Bundle source → content.js + ZIP
npm run test       # Run 34 unit tests
npm run lint       # Check code style
npm run check      # Lint + format check + tests
npm run format     # Auto-format code
```

---

## Localization

Currently supports:

- 🇺🇸 English (date formats + relative words)
- 🇵🇱 Polish (date formats + relative words)

Adding a new language:

1. Create `src/patterns/{lang}.js`
2. Add to `scripts/build.js`
3. Rebuild

---

## Browser Compatibility

- ✅ Chrome (primary target)
- ✅ Edge (Chromium-based)
- ✅ Brave (Chromium-based)
- ⚠️ Firefox (would need manifest changes)
- ❌ Safari (different extension format)

---

## Version History

| Version | Changes                                                                 |
| ------- | ----------------------------------------------------------------------- |
| 1.0     | Initial release with basic date highlighting                            |
| 1.1     | Added day of week tooltip                                               |
| 1.2     | Added settings popup, SPA support                                       |
| 1.3     | Rebranded to WhatDayIsIt, added highlight toggle, icon position setting |

---

## Store Listing

**Name**: WhatDayIsIt - Date Highlighter & Day Finder

**Summary** (132 chars):

> Instantly see what day any date falls on. Highlights dates on any webpage - hover to see Monday, Tuesday, etc.

**Category**: Productivity

---

## Stats

- **Bundle size**: ~9 KB (zipped)
- **Test coverage**: 34 tests
- **Dependencies**: 0 runtime (dev only: vitest, eslint, prettier, archiver)
- **Lines of code**: ~500 (source)

---

## Contact & Links

- **Privacy Policy**: See PRIVACY.md
- **Issues**: GitHub repository
- **Author**: Dawid Fajkowski

---

_Last updated: December 2024_
