import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = 'E:\\keyboard-manager-clean\\uaos-ai-factory\\pa3x-writer-track\\run-035-isolated-usb-package-folder-only';
const manifestPath = path.join(root, 'UAOS_PA3X_RUN_035_USB_REVIEW_MANIFEST.json');
const candidateRelative = path.join('USB_REVIEW_ONLY_DO_NOT_COPY_TO_USB', 'UAOS_PA3X_TEST_UNVERIFIED_035.SET', 'PERFORM', 'UAOS_TEST_UNVERIFIED_MINIMAL_003.PRF');
const candidatePath = path.join(root, candidateRelative);

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

const result = {
  status: 'PASS',
  validatorRun: '038',
  usbWritePerformed: false,
  keyboardTransferPerformed: false,
  pa3xLoadPerformed: false,
  fixtureModified: false,
  appJsModified: false,
  checks: []
};

function check(name, pass, detail) {
  result.checks.push({ name, pass, detail });
  if (!pass) result.status = 'FAIL';
}

check('Run 035 folder exists', fs.existsSync(root), root);
check('Manifest exists', fs.existsSync(manifestPath), manifestPath);
check('Candidate exists', fs.existsSync(candidatePath), candidatePath);

let manifest = {};
if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
}

check('keyboardReady false', manifest.keyboardReady === false, String(manifest.keyboardReady));
check('usbWriteApproved false', manifest.usbWriteApproved === false, String(manifest.usbWriteApproved));
check('keyboardLoadApproved false', manifest.keyboardLoadApproved === false, String(manifest.keyboardLoadApproved));
check('overwriteAllowed false', manifest.overwriteAllowed === false, String(manifest.overwriteAllowed));
check('Candidate name is TEST_UNVERIFIED', path.basename(candidatePath) === 'UAOS_TEST_UNVERIFIED_MINIMAL_003.PRF', path.basename(candidatePath));

if (fs.existsSync(root)) {
  const prfs = listFiles(root).filter((file) => file.toLowerCase().endsWith('.prf'));
  check('Exactly one PRF in Run 035 package', prfs.length === 1, String(prfs.length));
}

if (fs.existsSync(candidatePath)) {
  check('Candidate SHA256 matches manifest', sha256(candidatePath) === String(manifest.candidateSha256 || '').toLowerCase(), sha256(candidatePath));
  check('Candidate byte length matches manifest', fs.statSync(candidatePath).size === manifest.candidateBytes, String(fs.statSync(candidatePath).size));
}

const output = path.join(__dirname, 'UAOS_PA3X_RUN_038_PRECOPY_VALIDATOR_RESULTS.json');
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
