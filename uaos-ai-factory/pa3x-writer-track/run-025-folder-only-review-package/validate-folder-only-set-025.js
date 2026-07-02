import fs from 'node:fs';
import path from 'node:path';

const root = 'E:/keyboard-manager-clean';
const outputRoot = `${root}/uaos-ai-factory/pa3x-writer-track/run-025-folder-only-review-package`;
const fixtureRoot = `${root}/uaos-ai-factory/pa3x-writer-track/owner-fixtures`.toLowerCase();
const setFolder = `${outputRoot}/REVIEW_ONLY/UAOS_PA3X_TEST_UNVERIFIED_FOLDER_ONLY_024.SET`;
const required = ['GLOBAL', 'PERFORM', 'STYLE', 'PAD', 'SONGBOOK'];
const nativeExts = new Set(['.sty', '.prs', '.prf', '.kst']);

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

const checks = [];
function check(name, pass, detail = '') { checks.push({ name, pass, detail }); }

check('.SET folder exists', fs.existsSync(setFolder) && fs.statSync(setFolder).isDirectory(), setFolder);
for (const name of required) {
  const p = path.join(setFolder, name);
  check(`required subfolder ${name} exists`, fs.existsSync(p) && fs.statSync(p).isDirectory(), p);
}
const filesInsideSet = walk(setFolder);
check('no files inside .SET tree', filesInsideSet.length === 0, `${filesInsideSet.length} files`);
const allOutputFiles = walk(outputRoot);
const nativeFiles = allOutputFiles.filter((file) => nativeExts.has(path.extname(file).toLowerCase()));
check('no .STY/.PRS/.PRF/.KST files', nativeFiles.length === 0, `${nativeFiles.length} files`);
const fixtureWrites = allOutputFiles.filter((file) => file.replaceAll('\\', '/').toLowerCase().startsWith(fixtureRoot));
check('nothing written inside owner fixture folder', fixtureWrites.length === 0, `${fixtureWrites.length} files`);

const textFiles = allOutputFiles.filter((file) => ['.md', '.json'].includes(path.extname(file).toLowerCase()));
const reportText = textFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n').toLowerCase();
const hasRequiredWarning = reportText.includes('test / unverified') && reportText.includes('do not load');
check('reports say TEST / UNVERIFIED / DO NOT LOAD', hasRequiredWarning, 'required warning text present');
const forbiddenPositive = [
  'copy this package to usb',
  'transfer this package to pa3x',
  'use this package on pa3x hardware',
  'pa3x-ready',
  'keyboard-ready'
];
const positiveHits = forbiddenPositive.filter((phrase) => reportText.includes(phrase) && !reportText.includes(`do not ${phrase}`));
check('no USB write instructions', !reportText.includes('write to usb'), 'positive USB write phrase absent');
check('no keyboard load instructions', positiveHits.length === 0, positiveHits.join(', '));

const pass = checks.every((item) => item.pass);
const result = {
  status: pass ? 'PASS' : 'BLOCKED',
  generatedAt: new Date().toISOString(),
  setFolder,
  checks,
  filesInsideSet: filesInsideSet.map((file) => path.relative(setFolder, file).replaceAll('\\', '/')),
  nativeFiles: nativeFiles.map((file) => path.relative(outputRoot, file).replaceAll('\\', '/')),
  fixtureWrites,
};
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_025_VALIDATOR_RESULTS.json`, JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(result, null, 2));
if (!pass) process.exit(1);
