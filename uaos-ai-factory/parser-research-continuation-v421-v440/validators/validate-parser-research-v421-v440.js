import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const run = path.resolve(__dirname, '..');
const root = path.resolve(run, '..', '..');
const required = [
  "external-review-pack/UAOS_V421_EXTERNAL_PARSER_REVIEW_README.md",
  "external-review-pack/UAOS_V422_PARSER_RESEARCH_SUMMARY_FOR_REVIEW.md",
  "external-review-pack/UAOS_V423_REVIEW_QUESTIONS.md",
  "external-review-pack/UAOS_V424_REVIEW_BOUNDARIES_AND_SAFETY.md",
  "targeted-fixture-strategy/UAOS_V425_FIXTURE_GAP_ANALYSIS.md",
  "targeted-fixture-strategy/UAOS_V426_TARGET_FIXTURE_LIST.md",
  "targeted-fixture-strategy/UAOS_V427_READONLY_FIXTURE_INTAKE_PROTOCOL.md",
  "targeted-fixture-strategy/UAOS_V428_FIXTURE_RISK_CONTROL_PLAN.md",
  "schema-v7-draft/UAOS_V429_READONLY_PARSER_SCHEMA_V7_DRAFT.json",
  "schema-v7-draft/UAOS_V430_SCHEMA_V6_TO_V7_CHANGELOG.md",
  "schema-v7-draft/UAOS_V431_SCHEMA_V7_UNKNOWN_FIELDS.md",
  "schema-v7-draft/UAOS_V432_SCHEMA_V7_REVIEW_NOTES.md",
  "confidence-v7/UAOS_V433_PARSER_CONFIDENCE_MATRIX_V7.md",
  "confidence-v7/UAOS_V434_CONFIDENCE_DELTA_FROM_V6.json",
  "confidence-v7/UAOS_V435_CONFIDENCE_LIMITS_AND_BLOCKERS.md",
  "writer-blocker-map/UAOS_V436_WRITER_BLOCKER_EVIDENCE_MAP.json",
  "writer-blocker-map/UAOS_V437_WRITER_NOT_READY_DECISION.md",
  "dashboards/UAOS_PARSER_RESEARCH_CONTINUATION_V421_V440_DASHBOARD.html",
  "reports/UAOS_V439_QA_REPORT.md",
  "reports/UAOS_V439_MASTER_INDEX.md",
  "final-seal/UAOS_V440_PARSER_RESEARCH_CONTINUATION_FINAL_SEAL.md",
  "reports/UAOS_V440_FINAL_REPORT.md"
];
const forbiddenExt = ['.sty', '.set', '.prf', '.prs', '.kst'];
const results = [];
function check(name, pass, details) { results.push({ name, pass: !!pass, details: details || [] }); }
function walk(dir) {
  let files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) files = files.concat(walk(p));
    else files.push(p);
  }
  return files;
}
const missing = required.filter((rel) => !fs.existsSync(path.join(run, rel)));
check('all_required_files_exist', missing.length === 0, missing);
const schemaPath = path.join(run, 'schema-v7-draft', 'UAOS_V429_READONLY_PARSER_SCHEMA_V7_DRAFT.json');
let schema = null;
try { schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')); check('schema_v7_exists_and_parses', true); }
catch (err) { check('schema_v7_exists_and_parses', false, [String(err)]); }
if (schema) {
  check('schema_v7_readOnly_true', schema.readOnly === true);
  check('writerReady_false', schema.writerReady === false);
  check('nativeOutputAllowed_false', schema.nativeOutputAllowed === false);
  check('usbWriteAllowed_false', schema.usbWriteAllowed === false);
  check('keyboardLoadAllowed_false', schema.keyboardLoadAllowed === false);
  check('fixtureModificationAllowed_false', schema.fixtureModificationAllowed === false);
}
check('confidence_matrix_v7_exists', fs.existsSync(path.join(run, 'confidence-v7', 'UAOS_V433_PARSER_CONFIDENCE_MATRIX_V7.md')));
check('writer_blocker_map_exists', fs.existsSync(path.join(run, 'writer-blocker-map', 'UAOS_V436_WRITER_BLOCKER_EVIDENCE_MAP.json')));
const files = walk(run);
const forbiddenFiles = files.filter((f) => forbiddenExt.includes(path.extname(f).toLowerCase()));
check('no_forbidden_keyboard_package_extensions_generated', forbiddenFiles.length === 0, forbiddenFiles);
const corpus = files
  .filter((f) => !f.includes(path.sep + 'validators' + path.sep))
  .filter((f) => ['.md', '.json', '.html', '.txt'].includes(path.extname(f).toLowerCase()))
  .map((f) => fs.readFileSync(f, 'utf8'))
  .join('\n');
const claimKorg = 'KORG' + '-compatible';
const claimPa3x = 'PA3X' + '-ready';
const badTerms = [claimKorg, claimPa3x, 'USB write executed', 'PA3X load executed', 'deploy executed: YES', 'payment activation: YES'].filter((t) => corpus.includes(t));
check('no_unsafe_claims_or_actions', badTerms.length === 0, badTerms);
let appStatus = '';
try { appStatus = childProcess.execSync('git status --short -- uaos-live-clean/src/App.jsx', { cwd: root, encoding: 'utf8' }).trim(); }
catch (err) { appStatus = String(err); }
check('no_App_jsx_touched', appStatus === '', [appStatus]);
const deployArtifacts = files.filter((f) => /vercel|deploy|dist[\\/]/i.test(path.relative(run, f)));
check('no_deploy_output_modified_in_run', deployArtifacts.length === 0, deployArtifacts);
const result = {
  validator: 'validate-parser-research-v421-v440',
  result: results.every((r) => r.pass) ? 'PASS' : 'FAIL',
  checks: results,
};
fs.writeFileSync(path.join(run, 'reports', 'UAOS_V438_VALIDATOR_RESULTS.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(result.result === 'PASS' ? 0 : 1);
