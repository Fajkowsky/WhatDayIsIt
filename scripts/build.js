import { createWriteStream, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const srcDir = join(rootDir, 'src');
const distDir = join(rootDir, 'dist');

function bundleContentScript() {
  // Read source files
  const contentScript = readFileSync(join(srcDir, 'content.js'), 'utf8');
  const commonPatterns = readFileSync(join(srcDir, 'patterns/common.js'), 'utf8');
  const enPatterns = readFileSync(join(srcDir, 'patterns/en.js'), 'utf8');
  const plPatterns = readFileSync(join(srcDir, 'patterns/pl.js'), 'utf8');

  // Extract pattern arrays from pattern files
  const extractPatterns = (code) => {
    const match = code.match(/export default \[([\s\S]*?)\];/);
    return match ? match[1].trim() : '';
  };

  // Build the patterns code to inject
  const patternsCode = `
  const commonPatterns = [
    ${extractPatterns(commonPatterns)}
  ];

  const enPatterns = [
    ${extractPatterns(enPatterns)}
  ];

  const plPatterns = [
    ${extractPatterns(plPatterns)}
  ];

  const languagePatterns = {
    common: commonPatterns,
    en: enPatterns,
    pl: plPatterns,
  };

  function getDatePatterns() {
    const urlParams = new URLSearchParams(window.location?.search || '');
    const urlLocale = urlParams.get('locale');
    const htmlLang = document.documentElement?.lang;
    const locale = urlLocale || htmlLang || navigator.language || 'en';
    console.log('Detected locale:', locale, urlLocale ? '(URL override)' : htmlLang ? '(from page)' : '(browser)');
    let datePatterns = [...languagePatterns.common];
    const lang = locale.split('-')[0].toLowerCase();
    if (languagePatterns[lang]) {
      console.log(\`Adding patterns for language: \${lang}\`);
      datePatterns = datePatterns.concat(languagePatterns[lang]);
    } else {
      console.log(\`No specific patterns for \${lang}, using English patterns\`);
      datePatterns = datePatterns.concat(languagePatterns.en);
    }
    return datePatterns;
  }`;

  // Remove import statement and comment from source
  const processedContent = contentScript
    .replace(/import \{ getDatePatterns \} from ['"]\.\/patterns\/index\.js['"];?\n?/g, '')
    .replace(/\/\/ \^ This import is resolved at build time\n?/g, '');

  // Wrap in IIFE and inject patterns
  const bundled = `// WhatDayIsIt - Bundled Content Script
// Generated from src/ - do not edit directly
(function () {
${patternsCode}

${processedContent}
})();
`;

  writeFileSync(join(rootDir, 'content.js'), bundled);
  console.log('Bundled content.js created');
}

async function createZip() {
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true });
  }
  mkdirSync(distDir);

  const manifest = JSON.parse(readFileSync(join(rootDir, 'manifest.json'), 'utf8'));
  const version = manifest.version;
  const zipName = `whatdayisit-v${version}.zip`;
  const filesToInclude = [
    'manifest.json',
    'content.js',
    'background.js',
    'popup.html',
    'popup.js',
    'icon48.png',
    'icon128.png',
  ];

  const output = createWriteStream(join(distDir, zipName));
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log(`Created ${zipName} (${archive.pointer()} bytes)`);
    console.log(`Location: dist/${zipName}`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  for (const file of filesToInclude) {
    const filePath = join(rootDir, file);
    archive.file(filePath, { name: file });
  }

  await archive.finalize();
}

async function build() {
  console.log('Building WhatDayIsIt...\n');
  bundleContentScript();
  await createZip();
  console.log('\nBuild complete!');
}

build().catch(console.error);
