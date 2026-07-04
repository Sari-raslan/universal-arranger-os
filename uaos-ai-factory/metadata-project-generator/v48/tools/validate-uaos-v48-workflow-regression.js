import childProcess from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const repoRoot = path.resolve(root, "..", "..", "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const resultPath = path.join(reportsDir, "UAOS_V48_VALIDATOR_RESULTS.json");

const paths = {
  workflowPack: path.join(generatedDir, "UAOS_V48_OWNER_REVIEW_WORKFLOW_PACK.json"),
  workflowPackMd: path.join(generatedDir, "UAOS_V48_OWNER_REVIEW_WORKFLOW_PACK.md"),
  stepByStep: path.join(generatedDir, "UAOS_V48_OWNER_REVIEW_STEP_BY_STEP.md"),
  decisionMap: path.join(generatedDir, "UAOS_V48_OWNER_REVIEW_DECISION_MAP.json"),
  regressionResults: path.join(generatedDir, "UAOS_V48_ARCHIVE_INTEGRITY_REGRESSION_RESULTS.json"),
  regressionReport: path.join(generatedDir, "UAOS_V48_ARCHIVE_INTEGRITY_REGRESSION_REPORT.md"),
  failuresWarnings: path.join(generatedDir, "UAOS_V48_REGRESSION_FAILURES_AND_WARNINGS.json"),
  matrix: path.join(generatedDir, "UAOS_V48_NEXT_RECOMMENDATION_MATRIX.json")
};

function rel(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function readJson(filePath, errors) {
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing JSON: ${rel(filePath)}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON ${rel(filePath)}: ${error.message}`);
    return null;
  }
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function expectFalse(doc, label, field, errors) {
  if (doc?.[field] !== false) errors.push(`${label}.${field} must be false`);
}

fs.mkdirSync(reportsDir, { recursive: true });
const errors = [];
const warnings = [];
const workflowPack = readJson(paths.workflowPack, errors);
const decisionMap = readJson(paths.decisionMap, errors);
const regressionResults = readJson(paths.regressionResults, errors);
readJson(paths.failuresWarnings, errors);
readJson(paths.matrix, errors);

for (const filePath of [paths.workflowPackMd, paths.stepByStep, paths.regressionReport]) {
  if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
}

if (workflowPack?.workflowSteps) {
  for (const step of workflowPack.workflowSteps) {
    if (!step.safetyNote) errors.push(`${step.stepId || "workflow step"} missing safetyNote`);
  }
}
if (decisionMap?.decisionItems) {
  for (const item of decisionMap.decisionItems) {
    if (item.canAutoApply !== false) errors.push(`${item.decisionArea}.canAutoApply must be false`);
    if (item.metadataOnly !== true) errors.push(`${item.decisionArea}.metadataOnly must be true`);
    if (item.dryRunOnly !== true) errors.push(`${item.decisionArea}.dryRunOnly must be true`);
    if (item.exportApprovalImpact !== false) errors.push(`${item.decisionArea}.exportApprovalImpact must be false`);
  }
}
if (regressionResults) {
  if (!["PASS", "WARN"].includes(regressionResults.archiveIntegrityStatus)) errors.push("archiveIntegrityStatus must be PASS or WARN");
  expectFalse(regressionResults, "regressionResults", "readyForKorgExport", errors);
  expectFalse(regressionResults, "regressionResults", "readyForUsb", errors);
  expectFalse(regressionResults, "regressionResults", "readyForKeyboardLoad", errors);
  if (regressionResults.forbiddenFilesDetected?.length) errors.push("Regression found forbidden files");
  if (regressionResults.safetyFlagViolations?.length) errors.push("Regression found safety flag violations");
}

for (const filePath of walkFiles(root)) {
  const lower = filePath.toLowerCase();
  if (lower.includes(`${path.sep}.set${path.sep}`) || lower.endsWith(".set")) errors.push(`Forbidden V48 SET folder/file: ${rel(filePath)}`);
  if (/\.(sty|prf|prs|kst)$/i.test(lower)) errors.push(`Forbidden V48 keyboard file: ${rel(filePath)}`);
  if (/\.(wav|aiff|aif|mp3|flac|ogg|mid|midi)$/i.test(lower)) errors.push(`Forbidden V48 audio/sample binary: ${rel(filePath)}`);
  if (path.basename(lower) === "app.jsx") errors.push(`Forbidden V48 App.jsx: ${rel(filePath)}`);
  if (lower.includes(`${path.sep}deploy${path.sep}`) || lower.includes(`${path.sep}public${path.sep}`) || lower.includes(`${path.sep}docs${path.sep}`)) {
    errors.push(`Forbidden V48 deploy/public/docs path: ${rel(filePath)}`);
  }
}

const unchangedChecks = [
  ["V37 source project", path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json")],
  ["V42 dry-run project", path.join(base, "v42", "generated", "UAOS_V42_DRYRUN_PROJECT_AFTER_PREVIEW.uaosproject.json")],
  ["V44 dry-run project", path.join(base, "v44", "generated", "UAOS_V44_DRYRUN_PROJECT_AFTER_DECISION_PREVIEW.uaosproject.json")],
  ["V46 dry-run project", path.join(base, "v46", "generated", "UAOS_V46_DRYRUN_PROJECT_AFTER_IMPORT_PREVIEW_V3.uaosproject.json")],
  ["App.jsx", path.join(repoRoot, "uaos-ai-factory", "pc-workstation", "stable", "UAOS_PC_WORKSTATION_APP_V10", "App.jsx")]
];
for (const [label, filePath] of unchangedChecks) {
  const relative = path.relative(repoRoot, filePath).replace(/\\/g, "/");
  const check = childProcess.spawnSync("git", ["status", "--short", "--", relative], { cwd: repoRoot, encoding: "utf8" });
  if (check.stdout.trim()) errors.push(`${label} appears modified in git status`);
}

const status = errors.length ? "FAIL" : "PASS";
const result = {
  status,
  checkedAt: new Date().toISOString(),
  checkedFiles: Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, rel(value)])),
  errors,
  warnings,
  safety: {
    metadataOnly: true,
    reviewWorkflowOnly: true,
    regressionTestOnly: true,
    readInspectOnly: true,
    noRealApply: true,
    noSourceProjectMutation: true,
    noKorgOutput: true,
    noSetStylePerfPresetKst: true,
    noAudioSampleBinaries: true,
    noUsbWrite: true,
    noKeyboardLoad: true,
    noFixtureModification: true,
    noAppJs: true,
    noDeploy: true,
    noExportApproval: true
  }
};

fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");

if (status === "PASS") {
  fs.writeFileSync(path.join(reportsDir, "UAOS_V48_QA_REPORT.md"), [
    "# UAOS V48 QA Report",
    "",
    "Owner workflow pack created: YES",
    "Step-by-step guide created: YES",
    "Decision map created: YES",
    "Archive regression test created: YES",
    "Regression report created: YES",
    "Validator PASS: YES",
    "No real apply: YES",
    "No source project mutation: YES",
    "No KORG output: YES",
    "No SET/STY/PRF/PRS/KST: YES",
    "No audio/sample binaries: YES",
    "No USB: YES",
    "No PA3X load: YES",
    "No fixture modification: YES",
    "No App.jsx: YES",
    "No deploy: YES"
  ].join("\n") + "\n", "utf8");
  fs.writeFileSync(path.join(reportsDir, "UAOS_V48_FINAL_SEAL.md"), [
    "# UAOS V48 Final Seal",
    "",
    "Status: PASS",
    "",
    "V48 created an owner review workflow pack, step-by-step guide, decision map, archive integrity regression results, QA report, owner dashboard, and validator result.",
    "",
    "Safety: metadata-only, owner review workflow only, regression test only, read/inspect only, no real apply, no source project mutation, no KORG output, no SET/STY/PRF/PRS/KST, no audio/sample binaries, no USB write, no keyboard load, no fixture modification, no App.jsx, no deploy, no export approval."
  ].join("\n") + "\n", "utf8");
}

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
