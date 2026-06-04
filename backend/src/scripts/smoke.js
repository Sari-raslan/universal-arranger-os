import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzePath, supportedExtensions } from '../services/analyzer.js';
import { listLibraryItems } from '../services/library.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..', '..');
const samplesDir = path.join(rootDir, 'samples');

const library = await listLibraryItems(samplesDir);

if (!Array.isArray(library)) {
  throw new Error('Library endpoint source did not return an array.');
}

if (!supportedExtensions.includes('.mid') || !supportedExtensions.includes('.set')) {
  throw new Error('Expected MIDI and SET extensions to remain supported.');
}

if (library.length) {
  const first = library[0];
  const analysis = await analyzePath(path.join(samplesDir, first.id), { rootDir: samplesDir });
  if (!analysis.id || !analysis.name) {
    throw new Error('Analyzer returned an incomplete result.');
  }
}

console.log(`Smoke passed: ${library.length} library item(s), ${supportedExtensions.length} supported extension(s).`);


