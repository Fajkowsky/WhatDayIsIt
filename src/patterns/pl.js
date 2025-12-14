// Polish date formats
export default [
  // Common Polish date formats - DD.MM.YYYY
  /\b\d{1,2}\.\d{1,2}\.\d{4}\b/gi,

  // Day + month name + year
  /\b\d{1,2}\s+(?:stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\s+\d{4}\b/gi,
  /\b\d{1,2}\s+(?:styczeń|luty|marzec|kwiecień|maj|czerwiec|lipiec|sierpień|wrzesień|październik|listopad|grudzień)\s+\d{4}\b/gi,

  // Day + month short name + year
  /\b\d{1,2}\s+(?:sty|lut|mar|kwi|maj|cze|lip|sie|wrz|paź|lis|gru)\.?\s+\d{4}\b/gi,

  // Special words (using lookahead/lookbehind for Unicode compatibility)
  /(?<![a-ząćęłńóśźż])(?:dzisiaj|dziś|wczoraj|jutro)(?![a-ząćęłńóśźż])/gi,

  // Day-month combinations
  /\b\d{1,2}\s+(?:stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)\b/gi,
];
