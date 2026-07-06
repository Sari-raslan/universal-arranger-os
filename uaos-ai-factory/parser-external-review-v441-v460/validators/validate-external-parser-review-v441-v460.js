import fs from 'fs';
import path from 'path';
import childProcess from 'child_process';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const run = path.resolve(__dirname, '..');
const root = path.resolve(run, '..', '..');
const required = [
  "review-package/UAOS_V441_EXTERNAL_REVIEW_START_HERE.md",
  "review-package/UAOS_V442_REVIEW_SCOPE_AND_BOUNDARIES.md",
  "review-package/UAOS_V443_PARSER_SCHEMA_V7_REVIEW_COPY.json",
  "review-package/UAOS_V444_CONFIDENCE_MATRIX_V7_REVIEW_COPY.md",
  "reviewer-forms/UAOS_V445_EXTERNAL_REVIEW_QUESTIONNAIRE.md",
  "reviewer-forms/UAOS_V446_REVIEWER_FINDINGS_TEMPLATE.json",
  "reviewer-forms/UAOS_V447_REVIEWER_RISK_RATING_FORM.md",
  "reviewer-forms/UAOS_V448_REVIEWER_SIGNOFF_NOT_WRITER_APPROVAL.md",
  "intake-gate/UAOS_V449_REVIEW_INTAKE_PROTOCOL.md",
  "intake-gate/UAOS_V450_REVIEW_RESPONSE_IMPORT_TEMPLATE.json",
  "intake-gate/UAOS_V451_REVIEW_RESPONSE_VALIDATION_RULES.md",
  "intake-gate/UAOS_V452_REVIEW_DECISION_GATE.md",
  "review-risk-map/UAOS_V453_EXTERNAL_REVIEW_RISK_MAP.json",
  "review-risk-map/UAOS_V454_WRITER_BLOCKERS_AFTER_REVIEW.md",
  "review-risk-map/UAOS_V455_FIXTURE_GAPS_AFTER_REVIEW.md",
  "review-risk-map/UAOS_V456_SCHEMA_V8_PLANNING_NOTES.md",
  "dashboards/UAOS_EXTERNAL_PARSER_REVIEW_V441_V460_DASHBOARD.html",
  "reports/UAOS_V458_QA_REPORT.md",
  "reports/UAOS_V459_MASTER_INDEX.md",
  "final-seal/UAOS_V460_EXTERNAL_PARSER_REVIEW_FINAL_SEAL.md",
  "reports/UAOS_V460_FINAL_REPORT.md"
];
const forbiddenExt = ['.sty', '.set', '.prf', '.prs', '.kst'];
const checks = [];
function check(name, pass, details = []) { checks.push({ name, pass: !!pass, details }); }
function walk(dir) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walk(p)); else out.push(p);
  }
  return out;
}
const missing = required.filter((rel) => !fs.existsSync(path.join(run, rel)));
check('all_required_review_package_files_exist', missing.length === 0, missing);
function parseJson(rel, name) {
  try { return JSON.parse(fs.readFileSync(path.join(run, rel), 'utf8')); }
  catch (err) { check(name, false, [String(err)]); return null; }
}
const schema = parseJson('review-package/UAOS_V443_PARSER_SCHEMA_V7_REVIEW_COPY.json', 'schema_review_copy_exists_and_parses');
if (schema) {
  check('schema_review_copy_exists_and_parses', true);
  check('writer_ready_false', schema.writerReady === false);
  check('nativeOutputAllowed_false', schema.nativeOutputAllowed === false);
  check('usbWriteAllowed_false', schema.usbWriteAllowed === false);
  check('keyboardLoadAllowed_false', schema.keyboardLoadAllowed === false);
}
const findings = parseJson('reviewer-forms/UAOS_V446_REVIEWER_FINDINGS_TEMPLATE.json', 'reviewer_findings_template_parses');
if (findings) check('reviewer_findings_template_parses', true);
const response = parseJson('intake-gate/UAOS_V450_REVIEW_RESPONSE_IMPORT_TEMPLATE.json', 'review_response_import_template_parses');
if (response) check('review_response_import_template_parses', true);
const risk = parseJson('review-risk-map/UAOS_V453_EXTERNAL_REVIEW_RISK_MAP.json', 'risk_map_exists_and_parses');
if (risk) {
  check('risk_map_exists_and_parses', true);
  check('risk_map_writer_ready_false', risk.writer_ready === false);
  check('risk_map_nativeOutputAllowed_false', risk.nativeOutputAllowed === false);
  check('risk_map_usbWriteAllowed_false', risk.usbWriteAllowed === false);
  check('risk_map_keyboardLoadAllowed_false', risk.keyboardLoadAllowed === false);
}
const files = walk(run);
const forbidden = files.filter((f) => forbiddenExt.includes(path.extname(f).toLowerCase()));
check('no_forbidden_keyboard_package_extensions_generated', forbidden.length === 0, forbidden);
const corpus = files
  .filter((f) => !f.includes(path.sep + 'validators' + path.sep))
  .filter((f) => ['.md', '.json', '.html', '.txt'].includes(path.extname(f).toLowerCase()))
  .map((f) => fs.readFileSync(f, 'utf8'))
  .join('\n');
const badTerms = ['KORG' + '-compatible', 'PA3X' + '-ready', 'USB write executed', 'PA3X load executed', 'deploy executed: YES'].filter((t) => corpus.includes(t));
check('no_unsafe_claims_or_actions', badTerms.length === 0, badTerms);
let appStatus = '';
try { appStatus = childProcess.execSync('git status --short -- uaos-live-clean/src/App.jsx', { cwd: root, encoding: 'utf8' }).trim(); }
catch (err) { appStatus = String(err); }
check('no_App_jsx_touched', appStatus === '', [appStatus]);
const deployArtifacts = files.filter((f) => /vercel|deploy|dist[\\/]/i.test(path.relative(run, f)));
check('no_deploy_output_modified_in_run', deployArtifacts.length === 0, deployArtifacts);
const result = { validator: 'validate-external-parser-review-v441-v460', result: checks.every((c) => c.pass) ? 'PASS' : 'FAIL', checks };
fs.writeFileSync(path.join(run, 'reports', 'UAOS_V457_VALIDATOR_RESULTS.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
process.exit(result.result === 'PASS' ? 0 : 1);
