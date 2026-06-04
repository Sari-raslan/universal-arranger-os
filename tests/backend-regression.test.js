import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzePath, supportedExtensions } from '../backend/src/services/analyzer.js';
import { listLibraryItems } from '../backend/src/services/library.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const samplesDir = path.join(rootDir, 'samples');

test('library discovery preserves SET folder identity for export/analyze ids', async () => {
  const items = await listLibraryItems(samplesDir);
  const sarSet = items.find((item) => item.id === 'Korg/sar.SET');

  assert.ok(sarSet);
  assert.equal(sarSet.isDirectory, true);
  assert.equal(sarSet.name, 'sar.SET');
});

test('analyzer preserves MIDI, SysEx, and arranger extension support', () => {
  for (const extension of ['.mid', '.midi', '.syx', '.sty', '.set', '.pcg']) {
    assert.ok(supportedExtensions.includes(extension), `${extension} should remain supported`);
  }
});

test('analyzer safely summarizes the sample SET folder', async () => {
  const analysis = await analyzePath(path.join(samplesDir, 'Korg', 'sar.SET'), { rootDir: samplesDir });

  assert.equal(analysis.id, 'Korg/sar.SET');
  assert.equal(analysis.kind, 'directory');
  assert.equal(analysis.deepParserNeeded, true);
  assert.ok(analysis.fileCount > 0);
});
