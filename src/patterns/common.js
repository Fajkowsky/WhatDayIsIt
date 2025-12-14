// Common date patterns used across different locales
export default [
  // MM/DD/YYYY or DD/MM/YYYY or YYYY/MM/DD
  /\b\d{1,2}[-./]\d{1,2}[-./]\d{2,4}\b/gi,

  // YYYY-MM-DD ISO format
  /\b\d{4}-\d{2}-\d{2}\b/gi,

  // Dates with time
  /\b\d{1,2}[-./]\d{1,2}[-./]\d{2,4}\s+\d{1,2}:\d{2}(:\d{2})?\s*(am|pm|AM|PM)?\b/gi,
  /\b\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}(:\d{2})?\s*(am|pm|AM|PM)?\b/gi,

  // ISO timestamp format
  /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?\b/gi,
];
