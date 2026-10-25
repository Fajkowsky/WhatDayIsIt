# WhatDayIsIt

WhatDayIsIt is a Chrome extension that highlights dates found in page text and shows the weekday in a calendar icon tooltip. Date processing runs locally in the content script; page text is not sent anywhere.

## Features

- Highlights valid dates and displays their weekday.
- Keeps the original page text as text; invalid or impossible dates are left unchanged.
- Supports ISO dates and timestamps, numeric dates, English month names and abbreviations, Polish month names, and relative words.
- Lets you turn the extension off, hide the highlight color, and place the icon before or after a date.
- Syncs these three preferences through Chrome Storage Sync: enabled state, highlight state, and icon position.
- Reprocesses dynamic page content and keeps a per-tab badge count.

## Supported formats

| Format   | Examples and rules                                                      |
| -------- | ----------------------------------------------------------------------- |
| ISO      | `2024-12-25`, `2024-12-25T14:30:00Z`                                    |
| Numeric  | `12/25/2024`, `25/12/2024`, `25.12.2024`, `2024-12-25`                  |
| English  | `December 25, 2024`, `Dec. 25, 2024`, `25 December 2024`, `December 25` |
| Polish   | `25 grudnia 2024`, `25 grudzień 2024`, `15 stycznia`                    |
| Relative | `today`, `yesterday`, `tomorrow`, `dzisiaj`, `dziś`, `wczoraj`, `jutro` |

For numeric dates, a component above 12 determines the day position. Otherwise, dots use day/month order, ambiguous slash or dash dates use day/month on Polish pages and month/day on other pages. Thus `03/04/2026` means April 3 on Polish pages and March 4 on English pages; `12/25/2026` remains December 25 on either locale. Two digit years are interpreted as 2000–2099. Calendar-invalid values are not highlighted or counted.

## Install

[Get WhatDayIsIt from the Chrome Web Store](https://chromewebstore.google.com/detail/whatdayisit-date-highligh/cfkjhomjejdhjnhnkbcjamdfjkkpebec). The published listing currently serves v1.3; v1.4 in this repository is not published yet.

### Load the v1.4 source locally

1. Clone this repository and run `npm install`.
2. Run `npm run build`.
3. Open `chrome://extensions/` and enable **Developer mode**.
4. Choose **Load unpacked** and select the repository directory.

## Development and verification

```sh
npm run check       # lint, formatting, and production-code regression tests
npm run build       # generate the content-script IIFE
npm run package     # checks, bundle, and create the release ZIP
node --check content.js
```

The package contains the manifest, bundled content script, background service worker, popup, and extension icons. The generated root `content.js` is ignored by Git. `dist/whatdayisit-v1.4.zip` is a review artifact; creating it does not publish the extension to the Chrome Web Store.

For browser checks, load the unpacked extension in Chrome, open `tests/test-page.html` from a local web server, and check English and Polish locale behavior. The automated tests execute the production parser, bundle, popup, and background service worker with simulated browser APIs. They are not a substitute for an installed-extension browser check.

To reproduce the installed-extension check and regenerate the store screenshots, run `npm run build` first, then use Python with Playwright installed and a Chromium or Chrome for Testing executable that supports loading unpacked extensions:

```sh
python3 scripts/browser-smoke.py --chrome "/path/to/Chrome for Testing"
```

This launches a temporary browser profile, checks English/Polish per-tab badges, dynamic date insertion/removal, and global disable across both tabs, then writes the three PNGs under `assets/store/`. `hero.png`, `hero-store.png`, and `hero-small.png` remain 2560×1600, 1280×800, and 440×280 respectively. The page-count text in the promotional screenshot is explanatory copy; the script separately reads the real per-tab badge values from the extension API.

## Privacy

The extension processes page text locally and has no runtime network requests. It stores only the three settings above using `chrome.storage.sync`. Chrome may sync those preferences to the signed-in user's Chrome browsers according to Chrome Sync settings. See [PRIVACY.md](PRIVACY.md).

## Project structure

```text
src/content.js          DOM scanning and rendering
src/date-parser.js      shared calendar-validating date parser
src/patterns/           locale-specific date matching patterns
scripts/build.js        reusable IIFE bundler and ZIP packager
tests/                  production-code regression tests and test page
assets/store/           Chrome Web Store promotional screenshots
```

## Release history

See [CHANGELOG.md](CHANGELOG.md) for the v1.4 reliability fixes.

## License

MIT

## Author

Dawid Fajkowski
