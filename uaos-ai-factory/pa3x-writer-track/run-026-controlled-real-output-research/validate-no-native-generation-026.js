import fs from 'node:fs';
import path from 'node:path';

const outputRoot = 'E:/keyboard-manager-clean/uaos-ai-factory/pa3x-writer-track/run-026-controlled-real-output-research';
const fixtureRoot = 'E:/keyboard-manager-clean/uaos-ai-factory/pa3x-writer-track/owner-fixtures'.toLowerCase();
const nativeExts = new Set(['.set', '.sty', '.prs', '.prf', '.kst']);
const forbiddenPhrases = ['keyboard-ready', 'write to usb', 'copy to usb', 'transfer to keyboard', 'load to keyboard'];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(outputRoot);
const nativeFiles = files.filter((file) => nativeExts.has(path.extname(file).toLowerCase()));
const fixtureWrites = files.filter((file) => file.replaceAll('\\', '/').toLowerCase().startsWith(fixtureRoot));
const textFiles = files.filter((file) => ['.md', '.json'].includes(path.extname(file).toLowerCase()));
const phraseHits = [];
for (const file of textFiles) {
  const rel = path.relative(outputRoot, file).replaceAll('\\', '/');
  const text = fs.readFileSync(file, 'utf8').toLowerCase();
  for (const phrase of forbiddenPhrases) {
    if (text.includes(phrase)) phraseHits.push({ file: rel, phrase });
  }
}
const pass = nativeFiles.length === 0 && fixtureWrites.length === 0 && phraseHits.length === 0;
const result = {
  status: pass ? 'PASS' : 'BLOCKED',
  generatedAt: new Date().toISOString(),
  filesChecked: files.length,
  nativeKeyboardFiles: nativeFiles.map((file) => path.relative(outputRoot, file).replaceAll('\\', '/')),
  fixtureWrites,
  forbiddenPhraseHits: phraseHits,
  noNativeGeneration: nativeFiles.length === 0,
  noFixtureWrites: fixtureWrites.length === 0,
};
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_026_VALIDATOR_RESULTS.json`, JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(result, null, 2));
if (!pass) process.exit(1);

