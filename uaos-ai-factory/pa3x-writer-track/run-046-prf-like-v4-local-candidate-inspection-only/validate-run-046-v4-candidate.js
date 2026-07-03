import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidateName = 'UAOS_TEST_UNVERIFIED_MINIMAL_004_V4.PRF';
const manifestName = 'UAOS_TEST_UNVERIFIED_MINIMAL_004_V4_MANIFEST.json';
const warningName = 'UAOS_PA3X_RUN_046_DO_NOT_LOAD_WARNING.md';
const resultsName = 'UAOS_PA3X_RUN_046_VALIDATOR_RESULTS.json';

const candidatePath = path.join(__dirname, candidateName);
const manifestPath = path.join(__dirname, manifestName);
const warningPath = path.join(__dirname, warningName);
const resultsPath = path.join(__dirname, resultsName);

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
}

const result = {
  status: 'PASS',
  run: '046',
  checks: [],
  usbWritePerformed: false,
  packageCopyPerformed: false,
  keyboardTransferPerformed: false,
  pa3xLoadPerformed: false,
  fixtureModified: false,
  run037CopyScriptExecuted: false
};

function check(name, pass, detail = '') {
  result.checks.push({ name, pass, detail });
  if (!pass) result.status = 'FAIL';
}

const files = fs.readdirSync(__dirname, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => entry.name);
const prfFiles = files.filter((name) => name.toLowerCase().endsWith('.prf'));
const forbiddenNative = files.filter((name) => /\.(set|sty|prs|kst)$/i.test(name));

check('Exactly one PRF candidate exists', prfFiles.length === 1 && prfFiles[0] === candidateName, prfFiles.join(', '));
check('No SET/STY/PRS/KST files created', forbiddenNative.length === 0, forbiddenNative.join(', '));
check('Candidate exists', fs.existsSync(candidatePath), candidatePath);
check('Manifest exists', fs.existsSync(manifestPath), manifestPath);
check('Warning file exists', fs.existsSync(warningPath), warningPath);

let manifest = {};
if (fs.existsSync(manifestPath)) {
  manifest = readJson(manifestPath);
}

check('Manifest keyboardReady false', manifest.keyboardReady === false, String(manifest.keyboardReady));
check('Manifest usbWriteApproved false', manifest.usbWriteApproved === false, String(manifest.usbWriteApproved));
check('Manifest keyboardLoadApproved false', manifest.keyboardLoadApproved === false, String(manifest.keyboardLoadApproved));
check('Manifest testUnverified true', manifest.testUnverified === true, String(manifest.testUnverified));
check('Manifest fixtureModified false', manifest.fixtureModified === false, String(manifest.fixtureModified));
check('Manifest run037CopyScriptExecuted false', manifest.run037CopyScriptExecuted === false, String(manifest.run037CopyScriptExecuted));

if (fs.existsSync(candidatePath)) {
  check('Candidate SHA256 matches manifest', sha256(candidatePath) === manifest.sha256, sha256(candidatePath));
  check('Candidate byte length matches manifest', fs.statSync(candidatePath).size === manifest.byteLength, String(fs.statSync(candidatePath).size));
}

const warningText = fs.existsSync(warningPath) ? fs.readFileSync(warningPath, 'utf8') : '';
check('Warning says DO NOT LOAD ON PA3X', warningText.includes('DO NOT LOAD ON PA3X'));
check('Warning says DO NOT COPY TO USB', warningText.includes('DO NOT COPY TO USB'));

fs.writeFileSync(resultsPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
