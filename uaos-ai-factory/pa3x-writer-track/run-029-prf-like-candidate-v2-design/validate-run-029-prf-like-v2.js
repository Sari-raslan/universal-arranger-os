import fs from 'node:fs';
import path from 'node:path';

const root = 'E:/keyboard-manager-clean';
const outputRoot = `${root}/uaos-ai-factory/pa3x-writer-track/run-029-prf-like-candidate-v2-design`;
const fixtureRoot = `${root}/uaos-ai-factory/pa3x-writer-track/owner-fixtures`.toLowerCase();
const manifestPath = `${outputRoot}/UAOS_TEST_UNVERIFIED_MINIMAL_002_MANIFEST.json`;
const readmePath = `${outputRoot}/README_DO_NOT_LOAD_TO_KEYBOARD_RUN_029.md`;
const forbiddenNative = new Set(['.set', '.sty', '.prs', '.kst']);
function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full)); else out.push(full);
  }
  return out;
}
function add(checks, name, pass, detail = '') { checks.push({ name, pass, detail }); }
const files = walk(outputRoot);
const checks = [];
const v2PrfFiles = files.filter((file) => path.basename(file) === 'UAOS_TEST_UNVERIFIED_MINIMAL_002.PRF');
add(checks, 'exactly one v2 .PRF file exists', v2PrfFiles.length === 1, String(v2PrfFiles.length));
const forbiddenFiles = files.filter((file) => forbiddenNative.has(path.extname(file).toLowerCase()));
add(checks, 'no .SET/.STY/.PRS/.KST exists', forbiddenFiles.length === 0, String(forbiddenFiles.length));
const fixtureOutputs = files.filter((file) => file.replaceAll('\\', '/').toLowerCase().startsWith(fixtureRoot));
add(checks, 'output is not inside fixture folder', fixtureOutputs.length === 0, String(fixtureOutputs.length));
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : null;
const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
add(checks, 'README has DO NOT LOAD warning', readme.toUpperCase().includes('DO NOT LOAD'), readmePath);
add(checks, 'manifest has DO NOT LOAD warning', manifest?.safetyLabel === 'DO_NOT_LOAD_TO_KEYBOARD', String(manifest?.safetyLabel));
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
  'compatible with pa3x',
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
  prfFiles: v2PrfFiles.map((file) => path.relative(outputRoot, file).replaceAll('\\', '/')),
  forbiddenNativeFiles: forbiddenFiles.map((file) => path.relative(outputRoot, file).replaceAll('\\', '/')),
  checks,
};
fs.writeFileSync(`${outputRoot}/UAOS_PA3X_RUN_029_VALIDATOR_RESULTS.json`, JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(result, null, 2));
if (!pass) process.exit(1);
