import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzePath } from '../services/analyzer.js';
import { ensureDir } from '../services/library.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..', '..');
const samplePath = path.join(rootDir, 'samples', 'Korg', 'sar.SET');
const docsDir = path.join(rootDir, 'docs');

await ensureDir(docsDir);
const analysis = await analyzePath(samplePath, { rootDir: path.join(rootDir, 'samples') });
await fs.writeFile(path.join(docsDir, 'sar-set-analysis.json'), `${JSON.stringify(analysis, null, 2)}\n`);

const notes = [
  '# sar.SET Safe Analysis',
  '',
  `Analyzed at: ${analysis.analyzedAt}`,
  `Detected brand: ${analysis.possibleBrand}`,
  `Files inspected: ${analysis.fileCount}`,
  `Total bytes: ${analysis.size}`,
  '',
  'This is a directory-based arranger keyboard set. The analyzer only extracts safe metadata, extension counts, short ASCII strings, and hex previews. It does not decode proprietary style, sound, PCM, or performance payloads.',
  '',
  '## Extension counts',
  '',
  ...Object.entries(analysis.extensionCounts || {}).sort().map(([ext, count]) => `- ${ext}: ${count}`),
  '',
  '## Parser note',
  '',
  analysis.deepParserNeeded
    ? 'Deep parsing is marked as needed because Korg SET internals include proprietary subformats.'
    : 'Deep parsing was not required.'
];

await fs.writeFile(path.join(docsDir, 'sar-set-notes.md'), `${notes.join('\n')}\n`);
console.log(`Wrote ${path.join(docsDir, 'sar-set-analysis.json')}`);
console.log(`Wrote ${path.join(docsDir, 'sar-set-notes.md')}`);
