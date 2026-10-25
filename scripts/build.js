import { createWriteStream, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import archiver from 'archiver';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const srcDir = join(rootDir, 'src');
const distDir = join(rootDir, 'dist');

function source(path) {
  return readFileSync(join(srcDir, path), 'utf8');
}

function bundleContentScript({ write = true } = {}) {
  const patternFiles = ['common', 'en', 'pl'];
  const patternCode = patternFiles
    .map((name) =>
      source(`patterns/${name}.js`).replace('export default', `const ${name}Patterns =`)
    )
    .join('\n');
  const indexCode = source('patterns/index.js')
    .replace(/^import commonPatterns from '\.\/common\.js';\n/m, '')
    .replace(/^import enPatterns from '\.\/en\.js';\n/m, '')
    .replace(/^import plPatterns from '\.\/pl\.js';\n/m, '')
    .replace('export function getDatePatterns', 'function getDatePatterns');
  const parserCode = source('date-parser.js').replace('export { parseDate };', '');
  const contentCode = source('content.js')
    .replace(/^import \{ getDatePatterns \} from '\.\/patterns\/index\.js';\n/m, '')
    .replace(/^\/\/ \^ This import is resolved at build time\n/m, '')
    .replace(/^import \{ parseDate \} from '\.\/date-parser\.js';\n/m, '');
  const bundled = `// WhatDayIsIt - Bundled Content Script\n// Generated from src/ - do not edit directly\n(function () {\n${patternCode}\n${indexCode}\n${parserCode}\n${contentCode}\n})();\n`;
  if (write) {
    writeFileSync(join(rootDir, 'content.js'), bundled);
    console.log('Bundled content.js created');
  }
  return bundled;
}

async function createZip() {
  if (existsSync(distDir)) rmSync(distDir, { recursive: true });
  mkdirSync(distDir, { recursive: true });
  const { version } = JSON.parse(readFileSync(join(rootDir, 'manifest.json'), 'utf8'));
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
  const closed = new Promise((resolve, reject) => {
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
  });
  archive.pipe(output);
  for (const file of filesToInclude) archive.file(join(rootDir, file), { name: file });
  await archive.finalize();
  await closed;
  console.log(`Created ${zipName} (${archive.pointer()} bytes)`);
  return join('dist', zipName);
}

async function build() {
  console.log('Building WhatDayIsIt...\n');
  bundleContentScript();
  await createZip();
  console.log('\nBuild complete!');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export { bundleContentScript, createZip };
