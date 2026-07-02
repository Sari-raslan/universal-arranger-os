import fs from 'node:fs';
import path from 'node:path';

const forbiddenExtensions = new Set(['.set', '.sty', '.prs', '.kst', '.pcg']);
const riskyPhrases = ['keyboard-ready', 'write to usb', 'transfer to keyboard', 'proprietary sample copying'];

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

export function validateDryrunPackage(packageDir) {
  const files = walk(packageDir);
  const generatedNative = files.filter(file => forbiddenExtensions.has(path.extname(file).toLowerCase()));
  const phraseHits = [];
  for (const file of files.filter(f => ['.md','.json','.txt'].includes(path.extname(f).toLowerCase()))) {
    const text = fs.readFileSync(file, 'utf8').toLowerCase();
    for (const phrase of riskyPhrases) {
      if (text.includes(phrase)) phraseHits.push({ file, phrase });
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    packageDir,
    filesChecked: files.length,
    generatedNativeFiles: generatedNative,
    riskyPhraseHits: phraseHits,
    packageManifestPresent: files.some(f => path.basename(f).toLowerCase().includes('manifest')),
    status: generatedNative.length === 0 && phraseHits.length === 0 ? 'PASS' : 'BLOCKED'
  };
}
