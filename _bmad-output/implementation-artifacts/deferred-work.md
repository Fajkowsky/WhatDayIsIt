# Deferred work

- source_spec: `spec-1-4-release-reliability.md`
  summary: Recognize yearless English month abbreviations without a period.
  evidence: The unchanged English short-month pattern requires a period, so `Jan 1` is not detected even though full month names work without a year.
- source_spec: `spec-1-4-release-reliability.md`
  summary: Recognize yearless Polish month abbreviations.
  evidence: Existing Polish abbreviation patterns require a year; examples such as `15 sty` do not reach the parser.
- source_spec: `spec-1-4-release-reliability.md`
  summary: Refresh date interpretation when an SPA changes its language attribute.
  evidence: The original mutation observer watches text and children rather than `lang`; changing only language does not trigger a scan.
- source_spec: `spec-1-4-release-reliability.md`
  summary: Detect dates split across adjacent inline elements.
  evidence: Existing scanning processes each text node independently, so `<span>December</span> 25, 2024` is not one match.
- source_spec: `spec-1-4-release-reliability.md`
  summary: Define and enforce exclusions for editable page regions.
  evidence: Existing SCRIPT/STYLE/TEXTAREA/INPUT exclusions do not protect contenteditable DOM, which can be managed by a page editor.
- source_spec: `spec-1-4-release-reliability.md`
  summary: Expose weekday information to keyboard and screen-reader users.
  evidence: Calendar icons currently reveal tooltip text only on hover and have no focus target or accessible weekday name.
- source_spec: `spec-1-4-release-reliability.md`
  summary: Document or extend date detection inside embedded frames.
  evidence: The existing manifest omits all_frames and processes only the top document; this release preserves that behavior.
