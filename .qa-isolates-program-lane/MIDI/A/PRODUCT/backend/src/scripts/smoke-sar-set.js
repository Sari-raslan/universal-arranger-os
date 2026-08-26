import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzePath } from '../services/analyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..', '..');
const samplesDir = path.join(rootDir, 'samples');
const sarSetPath = path.join(samplesDir, 'Korg', 'sar.SET');

await fs.access(sarSetPath);
const analysis = await analyzePath(sarSetPath, { rootDir: samplesDir });

if (analysis.id !== 'Korg/sar.SET') {
  throw new Error(`Unexpected sar.SET id: ${analysis.id}`);
}

if (analysis.kind !== 'directory' || !analysis.deepParserNeeded) {
  throw new Error('sar.SET should remain a safely summarized proprietary directory.');
}

if (!analysis.fileCount || !analysis.children?.length) {
  throw new Error('sar.SET analysis should include contained file summaries.');
}

if (!analysis.extensionCounts || !analysis.extensionCounts['.pcg'] || !analysis.extensionCounts['.sty']) {
  throw new Error('sar.SET analysis should include expected Korg extension counts.');
}

console.log(`sar.SET smoke passed: ${analysis.fileCount} files, ${analysis.children.length} preview children.`);
