import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const out = path.dirname(fileURLToPath(import.meta.url));
const fixtureMarker = path.normalize('uaos-ai-factory/pa3x-writer-track/owner-fixtures').toLowerCase();
const manifestPath = path.join(out, 'UAOS_TEST_UNVERIFIED_MINIMAL_003_MANIFEST.json');
const resultPath = path.join(out, 'UAOS_PA3X_RUN_032_VALIDATOR_RESULTS.json');
const failures = [];
const warnings = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(out);
const lowerOut = path.normalize(out).toLowerCase();
if (lowerOut.includes(fixtureMarker)) failures.push('Output folder is inside fixture folder');

const prfFiles = files.filter((file) => path.extname(file).toLowerCase() === '.prf');
if (prfFiles.length !== 1) failures.push(`Expected exactly one .PRF file, found ${prfFiles.length}`);
if (!prfFiles.some((file) => path.basename(file) === 'UAOS_TEST_UNVERIFIED_MINIMAL_003.PRF')) failures.push('Approved PRF file name missing');

for (const ext of ['.set', '.sty', '.prs', '.kst']) {
  const matches = files.filter((file) => path.extname(file).toLowerCase() === ext);
  if (matches.length) failures.push(`Forbidden ${ext} file found`);
}

if (!fs.existsSync(manifestPath)) failures.push('Manifest missing');
let manifest = {};
if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
  const required = {
    fileName: 'UAOS_TEST_UNVERIFIED_MINIMAL_003.PRF',
    version: '003',
    outputType: 'TEST_UNVERIFIED_PRF_LIKE_CANDIDATE',
    keyboardReady: false,
    usbWriteApproved: false,
    keyboardLoadApproved: false,
    overwriteAllowed: false,
    fixtureModified: false,
    safetyLabel: 'DO_NOT_LOAD_TO_KEYBOARD',
    inspectionRequiredBeforeUSB: true,
  };
  for (const [key, expected] of Object.entries(required)) {
    if (manifest[key] !== expected) failures.push(`Manifest ${key} expected ${expected}, found ${manifest[key]}`);
  }
}

const allText = files
  .filter((file) => path.extname(file).toLowerCase() === '.md')
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n');
const manifestText = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, '') : '';
const combined = `${allText}\n${manifestText}`;
const forbiddenPositiveClaims = [
  /pa3x-ready/i,
  /keyboardReady\s*[:=]\s*true/i,
  /usbWriteApproved\s*[:=]\s*true/i,
  /keyboardLoadApproved\s*[:=]\s*true/i,
  /overwriteAllowed\s*[:=]\s*true/i,
  /ready for keyboard/i,
  /ready to load/i,
  /load on pa3x now/i,
  /copy to usb/i,
  /write to usb/i,
  /proprietary sample/i,
  /audio data included/i,
];
for (const pattern of forbiddenPositiveClaims) {
  if (pattern.test(combined)) failures.push(`Forbidden unsafe claim matched: ${pattern}`);
}

if (prfFiles.length === 1) {
  const prf = prfFiles[0];
  const data = fs.readFileSync(prf);
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  if (data.length !== 24576) failures.push(`PRF size expected 24576, found ${data.length}`);
  if (manifest.sha256 && manifest.sha256 !== hash) failures.push('Manifest SHA256 mismatch');
  if (!data.includes(Buffer.from('TEST_UNVERIFIED'))) failures.push('PRF missing TEST_UNVERIFIED marker');
  if (data.includes(Buffer.from('PA3X-ready')) || data.includes(Buffer.from('compatible'))) failures.push('PRF contains unsafe readiness wording');
}

const result = {
  status: failures.length ? 'FAIL' : 'PASS',
  checkedAt: new Date().toISOString(),
  outputFolder: out,
  prfFileCount: prfFiles.length,
  failures,
  warnings,
  requiredNextStep: 'Run 033 binary safety inspection before any further approval gate',
};
fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
if (failures.length) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(result, null, 2));




