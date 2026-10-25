# WhatDayIsIt Project Summary

## Product

WhatDayIsIt is a Chrome Manifest V3 extension that scans page text for valid dates. It wraps valid dates in a highlight and places a calendar icon before or after each date. Hovering over the icon displays the weekday. It preserves the page's text and leaves invalid calendar dates unchanged.

## Supported date formats

- ISO calendar dates and timestamps, such as `2024-12-25` and `2024-12-25T14:30:00Z`
- Numeric dates with slash, dot, or dash separators
- English month names and abbreviations, including `Sept.`
- Polish month names and abbreviations
- English and Polish relative words

Numeric components above 12 establish the day position. Dot-separated dates use day/month order. Ambiguous slash- and dash-separated dates use day/month order on Polish pages and month/day order on other pages. Explicit US dates such as `12/25/2026` resolve consistently. Invalid dates are ignored.

## Preferences

The popup controls the global enabled state, highlight on/off, and icon position. These settings are stored using Chrome Storage Sync, and open tabs react to changes. Badge counts are maintained independently per tab and cleared on disable or navigation.

## Privacy

Page text is processed in the browser and is not sent to WhatDayIsIt servers. The extension has no runtime network requests and stores no page content. Chrome Storage Sync stores only the three settings above. See [PRIVACY.md](PRIVACY.md).

## Chrome Web Store copy

**Name:** WhatDayIsIt - Date Highlighter & Day Finder

**Short description:** See the weekday for dates on any webpage. Highlights valid dates and keeps a per-tab date count up to date.

**Feature summary:** WhatDayIsIt recognizes supported English and Polish date formats, shows weekdays beside valid dates, and updates each tab's count when page content changes. Choose whether to highlight dates and where the calendar icon appears. Only preferences sync through Chrome; page text stays local.

## Project structure

```text
src/content.js          DOM scanning, rendering, observer and settings
src/date-parser.js      shared pure parser with calendar validation
src/patterns/           common, English, Polish patterns and locale selection
scripts/build.js        reusable content bundle and seven-file ZIP package
tests/                  tests that execute production code plus a browser fixture
assets/store/           Chrome Web Store promotional screenshots
```

## Development commands

```sh
npm run check       # lint, formatting, production-code tests
npm run build       # bundle the source into content.js
npm run package     # run checks, build content.js, create the release ZIP
node --check content.js
```

`npm run package` creates `dist/whatdayisit-v1.4.zip`. Automated tests use simulated browser APIs; separately record installed-extension checks as browser evidence. Neither tests nor a ZIP publish to the Chrome Web Store.

## Release history

| Version | Changes                                                                                                                                         |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0–1.2 | Initial date highlighter, weekday tooltip, settings popup, and SPA support                                                                      |
| 1.3     | WhatDayIsIt branding, highlight toggle, and icon position setting                                                                               |
| 1.4     | Safe DOM rendering, validated and locale-aware date parsing, synchronized settings, dynamic count reliability, production-code regression tests |

See [CHANGELOG.md](CHANGELOG.md) and [README.md](README.md) for current release details.
