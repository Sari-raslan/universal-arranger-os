import fs from 'node:fs';
import path from 'node:path';

const root = 'E:/keyboard-manager-clean';
const outputRoot = `${root}/uaos-ai-factory/pa3x-writer-track/run-027-first-prf-like-test-output`;
const fixtureRoot = `${root}/uaos-ai-factory/pa3x-writer-track/owner-fixtures`.toLowerCase();
const manifestPath = `${outputRoot}/UAOS_TEST_UNVERIFIED_MINIMAL_001_MANIFEST.json`;
const readmePath = `${outputRoot}/README_DO_NOT_LOAD_TO_KEYBOARD_RUN_027.md`;
const forbiddenNative = new Set(['.set', '.sty', '.prs', '.kst']);
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
function add(checks, name, pass, detail = '') { checks.push({ name, pass, detail }); }
const files = walk(outputRoot);
const checks = [];
const prfFiles = files.filter((file) => path.extname(file).toLowerCase() === '.prf');
add(checks, 'exactly one .PRF file exists', prfFiles.length === 1, `${prfFiles.length}`);
const otherNative = files.filter((file) => forbiddenNative.has(path.extname(file).toLowerCase()));
add(checks, 'no .SET/.STY/.PRS/.KST exists', otherNative.length === 0, `${otherNative.length}`);
const fixtureOutputs = files.filter((file) => file.replaceAll('\\', '/').toLowerCase().startsWith(fixtureRoot));
add(checks, 'output is not inside fixture folder', fixtureOutputs.length === 0, `${fixtureOutputs.length}`);
const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
add(checks, 'README has DO NOT LOAD warning', readme.toUpperCase().includes('DO NOT LOAD'), readmePath);
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;
add(checks, 'manifest keyboardReady false', manifest?.keyboardReady === false, String(manifest?.keyboardReady));
add(checks, 'manifest usbWriteApproved false', manifest?.usbWriteApproved === false, String(manifest?.usbWriteApproved));
add(checks, 'manifest keyboardLoadApproved false', manifest?.keyboardLoadApproved === false, String(manifest?.keyboardLoadApproved));
const textFiles = files.filter((file) => ['.md', '.json', '.txt'].includes(path.extname(file).toLowerCase()));
const combined = textFiles.map((file) => fs.readFileSync(file, 'utf8').toLowerCase()).join('\n');
const badClaims = [
  'contains proprietary sample',
  'contains audio sample',
  'pa3x-ready',
  'keyboard-ready',
  'device-compatible',
  'write to usb',
  'copy this to usb',
  'load this on pa3x',
  'load on keyboard'
].filter((phrase) => combined.includes(phrase));
add(checks, 'no proprietary sample/audio claim', !badClaims.some((p) => p.includes('sample')), badClaims.join(', '));
add(checks, 'no ready/compatibility claim', !badClaims.some((p) => p.includes('ready') || p.includes('compatible')), badClaims.join(', '));
add(checks, 'no USB write instruction', !badClaims.some((p) => p.includes('usb')), badClaims.join(', '));
const pass = checks.every((check) => check.pass);
const result = {
  status: pass ? 'PASS' : 'BLOCKED',
  generatedAt: new Date().toISOString(),
  outputRoot,
  prfFiles: prfFiles.map((file) => path.relative(outputRoot, file).replaceAll('\\', '/')),
  otherNativeFiles: otherNative.map((file) => path.relative(outputRoot, file).replaceAll('\\', '/')),
  checks,
};
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_027_VALIDATOR_RESULTS.json`, JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(result, null, 2));
if (!pass) process.exit(1);
