// Date pattern loader module
import commonPatterns from './common.js';
import enPatterns from './en.js';
import plPatterns from './pl.js';

// Map of available language patterns
const languagePatterns = {
  common: commonPatterns,
  en: enPatterns,
  pl: plPatterns,
};

/**
 * Gets date patterns based on website's language
 * Priority: URL param > html lang attribute > navigator.language > fallback to 'en'
 * @returns {Array} An array of regular expressions for matching dates
 */
export function getDatePatterns() {
  // Allow override via URL param for testing: ?locale=en
  const urlParams = new URLSearchParams(window.location?.search || '');
  const urlLocale = urlParams.get('locale');

  // Detect website language from <html lang="..."> attribute
  const htmlLang = document.documentElement?.lang;

  // Priority: URL param > html lang > browser language > fallback
  const locale = urlLocale || htmlLang || navigator.language || 'en';
  console.log(
    'Detected locale:',
    locale,
    urlLocale ? '(URL override)' : htmlLang ? '(from page)' : '(browser)'
  );

  // Start with common patterns
  let datePatterns = [...languagePatterns.common];

  // Add locale-specific patterns
  const lang = locale.split('-')[0].toLowerCase();

  if (languagePatterns[lang]) {
    console.log(`Adding patterns for language: ${lang}`);
    datePatterns = datePatterns.concat(languagePatterns[lang]);
  } else {
    console.log(`No specific patterns for ${lang}, using English patterns`);
    datePatterns = datePatterns.concat(languagePatterns.en);
  }

  return datePatterns;
}
