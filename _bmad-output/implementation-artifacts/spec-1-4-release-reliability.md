---
title: 'WhatDayIsIt 1.4 release reliability'
type: 'bugfix'
created: '2026-10-25'
status: 'done'
route: 'dispatch'
baseline_commit: 'fe575e772b775e9602c8f51db3e8849bf5e0fae1'
review_loop_iteration: 0
context: ['README.md', 'CLAUDE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The existing v1.4 date-count badge is implemented, but assessment reproduced unsafe HTML interpretation, inconsistent disabling, stale counts after content removal, and invalid or ambiguous date parsing. The listing and release documentation still describe v1.3.

**Approach:** Deliver the approved badge and reliability fixes as one v1.4 release, with tests executing production code and updated release materials. The user approved implementation of all assessment findings and confirmed continuation.

## Boundaries & Constraints

**Always:** Preserve the local version bumps to manifest 1.4 and package 1.4.0. Keep page processing offline, existing English/Polish detection, before/after icons, highlight toggle, and per-tab badge isolation. Preserve website text exactly. Store only preferences using Chrome Sync. Retain explicit US dates and use Polish day/month ordering on Polish pages; unambiguous numeric components determine ordering across locales.

**Never:** Collect page data, introduce runtime network requests or a framework, modify unrelated work, or represent simulated browser evidence as an installed-extension test. Preparing code, a PR and a ZIP does not publish to the Chrome Web Store.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| Page safety | Literal escaped HTML beside a date | Text remains literal; only valid date gets markup | Never interpret page text as HTML |
| Valid dates | Leap day, numeric formats, English abbreviations with periods, Polish month names | Correct weekday and exactly one badge count per occurrence | Invalid dates stay unchanged and uncounted |
| Numeric ordering | `03/04/2026` on Polish versus US English pages | April 3 versus March 4; explicit `12/25/2026` remains December 25 | Reject impossible components |
| Dynamic content | Date insertion, removal, replacement, or changed text | Current visible date markup and badge count agree | Avoid observing extension writes repeatedly |
| Global settings | Disable with multiple open tabs; change presentation while disabled | All tabs react; disabled tabs stay unhighlighted with cleared badges | Preferences still save on restricted pages |
| Async processing | Disable or change settings during a large scan | Stale work cannot restore highlights or stale badge counts | Cancel obsolete passes safely |
| Navigation | Move a tab to a new page | Badge resets and new scan updates only that tab | Ignore missing or malformed sender information |

</frozen-after-approval>

## Code Map

- `src/content.js`: owns DOM scanning, markup, observer, idle batches and content messages; replace HTML interpolation and consolidate settings state.
- `src/patterns/*.js`: owns matching and locale selection; reuse these exact modules in the bundle, avoiding duplicated detection code.
- `src/date-parser.js`: new pure parser extracted from content script, shared by production bundle and parser tests.
- `background.js`, `popup.js`, `popup.html`: existing badge handlers and settings UI; use storage changes for propagation and label existing controls accessibly.
- `scripts/build.js`: custom IIFE bundle and seven-file ZIP; keep generated root `content.js` ignored and make bundling reusable for tests.
- `tests/*.test.js`: replace copied content/background logic with execution of actual scripts; retain pattern tests and add realistic fixtures.
- `README.md`, `PRIVACY.md`, `SUMMARY.md`, `assets/store/`, `package-lock.json`: update release identity, verified feature descriptions and Chrome Sync explanation.

## Tasks & Acceptance

**Execution:**

- [x] `src/date-parser.js`, `src/patterns/*.js`, `scripts/build.js` — validate calendar dates, resolve numeric ordering and abbreviations, and bundle actual modules — keep parsing and packaging consistent.
- [x] `src/content.js` — create markup with DOM nodes, synchronize settings, cancel obsolete idle work and handle dynamic removals — preserve page text and correct counts.
- [x] `popup.js`, `popup.html`, `background.js` — persist settings for all tabs, retain disabled state and robust badge updates — keep controls and per-tab state predictable.
- [x] `tests/` — execute production parser, bundle, background and popup against the matrix, including cancellation — prevent the reproduced defects from returning.
- [x] `README.md`, `PRIVACY.md`, `SUMMARY.md`, `CHANGELOG.md`, `assets/store/`, `package-lock.json` — refresh release notes, store copy, screenshots, verification instructions and lockfile metadata — make the release reviewable.
- [x] `scripts/build.js`, release ZIP and Git branch — run checks, inspect package contents and prepare reproducible browser verification — deliver reviewable implementation with evidence; independent review and GitHub delivery follow implementation.

**Acceptance Criteria:**

- Given the release sources, when checks and packaging run, then lint, formatting, production-code regression tests and bundle syntax pass and the ZIP contains the expected extension files with manifest version 1.4.
- Given the release materials, when compared with implemented behavior, then they accurately describe the badge, numeric-date policy, toggle options, supported formats and preference synchronization.
- Given browser evidence, when reporting completion, then simulated APIs, actual browser rendering and installed-extension behavior are distinguished explicitly.

## Implementation Notes

- Baseline revision: `fe575e772b775e9602c8f51db3e8849bf5e0fae1`. Existing manifest/package version edits belong to this task; preserved on `release/1.4-reliability`.
- Intent gaps: none; the assessment and implementation approval define scope. Chrome Web Store publication remains an external release step.
- Footprint: content/parser/pattern modules, popup/background handlers, bundling/tests, and release materials; no runtime dependencies or new permissions planned.
- Production-backed regression suite replaces copied logic. Root review additionally caught container clearing and non-clickable visual toggles; fixed both and exercised their actual DOM interactions.
- Matrix audit: page safety/validity/order covered by content/parser tests; insertion/removal/replacement by content tests and real browser; shared settings and disabled state by content/popup tests and real browser; idle cancellation/detachment by content tests; navigation/malformed senders by actual background script tests.
- Verification: `npm run package` passes 38 tests plus lint/format checks; generated bundle syntax passes. ZIP has seven expected files, matches their source bytes, and declares manifest 1.4.
- Real unpacked-extension Chrome for Testing check: English/Polish badges 4/35; insertion and whole-parent removal update the actual badge 4/5/4; global disable clears both pages and badges. Store PNGs remain 2560x1600, 1280x800 and 440x280.
- Independent review completed with three separate reviewers. Fixed stale initialization/settings reads, stale disable-query badge clearing, early ISO years including year-zero leap day, and normal-suite insertion coverage. Older matching/accessibility limits are documented in deferred-work.md rather than represented as new regressions.
- Final verification after review: `npm run package` passes 42 tests, lint and formatting; bundle syntax and seven ZIP/source byte comparisons pass. Installed Chrome for Testing checks pass again on this final build; `npm audit --omit=dev --json` reports zero runtime advisories. Existing development dependency advisories were not upgraded in this release.
- Final package: 41439 bytes; SHA-256 `32ab768ea7da840c6ba5b3ff02cad0be1243d1f678ffa47e74adfee3e474101f`. Source delivery does not constitute Chrome Web Store submission or publication.
- Chrome Web Store submission on October 25, 2026: removed the unused activeTab permission, rebuilt and reverified all 42 tests plus real browser behavior, and uploaded the final 41431-byte ZIP with SHA-256 `48316e41c22ddd2bd2cda24fbeb4554329280647b76a1309dc35ed731564218c`. Pending review was verified at 16:06 UTC with automatic publication enabled; the public listing remained on 1.3. See [release record](../../docs/releases/1.4.md).

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Evidence and route |
| --- | --- | --- |
| Blind 1: ordinal suffix spelling | low | The parser accepts `March 1th, 2024`, as before; the underlying calendar date and weekday remain correct. Reject the cosmetic grammar enhancement because it adds suffix-validation branches for an uncommon input. |
| Blind 2: English abbreviation without year/period | medium | Existing `src/patterns/en.js` requires a period for no-year abbreviations; `Jan 1` is not detected. Defer this pre-existing matching limitation. |
| Blind 3: Polish abbreviation without year | medium | Existing Polish abbreviation pattern requires a year, although the parser can resolve a no-year abbreviation. Defer this pre-existing format extension. |
| Blind 4: mixed numeric separators | low | Existing matcher and parser permit mixed separators. The resulting date can still be calendar-valid; reject uncommon notation tightening because it adds matching rules unrelated to a wrong calendar result. |
| Blind 5: years below 100 | low | Newly added validation rejects valid early four-digit years because `new Date(year, month, day)` remaps them to 1900-1999. Patch construction before calendar comparison. Shared root with Edge 1. |
| Blind 6: live language attribute changes | medium | Existing observer does not watch `lang` attributes; SPA locale switches can retain prior date semantics until another text mutation. Defer pre-existing locale-refresh support. |
| Blind 7: dates split across inline elements | medium | TreeWalker processes independent text nodes, unchanged from baseline, so split month/day strings are not joined. Defer this pre-existing DOM matching limitation. |
| Blind 8: editable page regions | medium | Existing parent-tag exclusions do not cover contenteditable editors; date markup may interfere with editor-managed content. Defer the pre-existing editable-region policy. |
| Blind 9: keyboard/screen-reader weekday access | medium | The existing calendar icon remains hover-only without a focusable control or accessible weekday name. Defer this pre-existing interaction change. |
| Blind 10: embedded frames | low | Existing manifest injects only into the top document; embedded document dates are not scanned. Defer documenting or extending existing frame coverage. |
| Edge 1: early-year Date construction | low | Same verified constructor/validation interaction as Blind 5; patch once while retaining both review records. |
| Edge 2: stale initial storage read | high | Startup callback writes settings unconditionally after the onChanged handler can apply a newer disabled snapshot. Patch stale-read ordering and prove disable wins with delayed callback tests. |
| Edge 3: stale disable tab query | medium | Disable callback performs async `tabs.query`; enable does not invalidate its pending clear, so it can clear fresh badges. Patch callback generation ordering and add a delayed-query test. |
| Verification 1: insertion absent from normal test command | medium | Production content tests cover replacement/removal but insertion is checked only by separately run browser smoke. Add production-bundle insertion and badge assertions to the standard suite. |

## Verification

- `npm run package` — lint, formatting, tests, bundle and ZIP succeed.
- `node --check content.js` — generated IIFE is valid JavaScript.
- Inspect ZIP entries, version and content against source; run Chrome smoke scenarios and generate current release screenshots.
- Independent review followed by focused fixes and relevant verification; report any external publication boundary plainly.
