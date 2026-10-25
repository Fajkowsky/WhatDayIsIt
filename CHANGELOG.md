# Changelog

## 1.4.0 — October 25, 2026

- Add a per-tab date-count badge that refreshes when page content changes and clears on disable or navigation.
- Build date markup with DOM nodes so page text is never interpreted as HTML.
- Validate calendar dates, including leap days, before highlighting or counting them.
- Resolve ambiguous numeric dates by page locale while keeping unambiguous dates consistent.
- Parse English abbreviations with periods and Polish month names.
- Reprocess changed page content and refresh the per-tab badge after additions and removals.
- Synchronize preferences to every open tab, preserve the disabled state while presentation preferences change, and cancel obsolete scans.
- Use the production parser and scripts in regression tests and package the same pattern modules used by the extension.
- Clarify that only preferences use Chrome Storage Sync and that creating a ZIP does not publish the extension.
