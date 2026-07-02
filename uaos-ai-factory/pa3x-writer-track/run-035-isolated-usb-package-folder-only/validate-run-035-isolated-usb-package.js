import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const out = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(out, 'UAOS_PA3X_RUN_035_USB_REVIEW_MANIFEST.json');
const resultPath = path.join(out, 'UAOS_PA3X_RUN_035_VALIDATOR_RESULTS.json');
const failures = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(out);
const prfFiles = files.filter((file) => path.extname(file).toLowerCase() === '.prf');
const forbidden = files.filter((file) => ['.sty', '.prs', '.kst'].includes(path.extname(file).toLowerCase()));

const expected = path.join(
  out,
  'USB_REVIEW_ONLY_DO_NOT_COPY_TO_USB',
  'UAOS_PA3X_TEST_UNVERIFIED_035.SET',
  'PERFORM',
  'UAOS_TEST_UNVERIFIED_MINIMAL_003.PRF'
);

if (!fs.existsSync(expected)) failures.push('Expected candidate PRF is missing');
if (prfFiles.length !== 1) failures.push(`Expected exactly one PRF, found ${prfFiles.length}`);
if (prfFiles.length === 1 && path.normalize(prfFiles[0]) !== path.normalize(expected)) {
  failures.push('PRF is not in the expected isolated review location');
}
if (forbidden.length) failures.push(`Forbidden STY/PRS/KST files found: ${forbidden.length}`);

const normalizedOut = path.normalize(out).toLowerCase();
if (/^[a-df-z]:\\?$/i.test(normalizedOut) || normalizedOut.includes('\\usb') && !normalizedOut.includes('do_not_copy_to_usb')) {
  failures.push('Output appears to target a real USB path');
}
if (normalizedOut.includes('\\owner-fixtures\\')) failures.push('Output is inside owner fixture folder');

let manifest = {};
if (!fs.existsSync(manifestPath)) {
  failures.push('Manifest missing');
} else {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
  const required = {
    keyboardReady: false,
    usbWriteApproved: false,
    keyboardLoadApproved: false,
    overwriteAllowed: false,
    fixtureModified: false,
    safetyLabel: 'TEST_UNVERIFIED_DO_NOT_LOAD',
    realUsbPathUsed: false,
    keyboardTransfer: false,
    pa3xLoad: false,
  };
  for (const [key, expectedValue] of Object.entries(required)) {
    if (manifest[key] !== expectedValue) failures.push(`Manifest ${key} mismatch`);
  }
}

const textFiles = files.filter((file) =>
  ['.md', '.json'].includes(path.extname(file).toLowerCase()) &&
  path.normalize(file) !== path.normalize(resultPath)
);
const combined = textFiles.map((file) => fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')).join('\n');
for (const requiredText of ['DO NOT COPY TO USB', 'DO NOT LOAD ON PA3X']) {
  if (!combined.includes(requiredText)) failures.push(`Missing warning text: ${requiredText}`);
}
for (const unsafe of [/keyboardReady\s*[:=]\s*true/i, /usbWriteApproved\s*[:=]\s*true/i, /keyboardLoadApproved\s*[:=]\s*true/i, /overwriteAllowed\s*[:=]\s*true/i, /PA3X-ready/i, /compatible with PA3X/i]) {
  if (unsafe.test(combined)) failures.push(`Unsafe claim matched: ${unsafe}`);
}

let candidate = null;
if (fs.existsSync(expected)) {
  const data = fs.readFileSync(expected);
  candidate = {
    file: path.relative(out, expected).replace(/\\/g, '/'),
    bytes: data.length,
    sha256: crypto.createHash('sha256').update(data).digest('hex'),
  };
}

const result = {
  status: failures.length ? 'FAIL' : 'PASS',
  checkedAt: new Date().toISOString(),
  outputFolder: out,
  prfFileCount: prfFiles.length,
  forbiddenStylePerformancePadFiles: forbidden.length,
  candidate,
  failures,
};

fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
if (failures.length) process.exit(1);
