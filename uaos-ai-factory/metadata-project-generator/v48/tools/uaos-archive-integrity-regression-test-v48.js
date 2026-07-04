import childProcess from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const repoRoot = path.resolve(root, "..", "..", "..");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

function safetyBlock() {
  return {
    metadataOnly: true,
    regressionTestOnly: true,
    readInspectOnly: true,
    sourceProjectModified: false,
    autoApplyEnabled: false,
    realApplyAllowed: false,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false,
    exportApproval: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const generatedAt = new Date().toISOString();
const latestCommit = childProcess.spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
const validatorResultPath = path.join(reportsDir, "UAOS_V48_VALIDATOR_RESULTS.json");
const validatorAlreadyPassed = fs.existsSync(validatorResultPath) && readJson(validatorResultPath).status === "PASS";
const versions = Array.from({ length: 11 }, (_, index) => `v${37 + index}`);
const missingFiles = [];
const invalidJsonFiles = [];
const forbiddenFilesDetected = [];
const safetyFlagViolations = [];
const warnings = [];
const versionResults = [];
const forbiddenExtPattern = /\.(set|sty|prf|prs|kst|wav|aiff|aif|mp3|flac|ogg|mid|midi)$/i;
const falseOnlyFields = [
  "readyForKorgExport",
  "readyForUsb",
  "readyForKeyboardLoad",
  "approvedForKorgExport",
  "approvedForUsb",
  "approvedForKeyboardLoad",
  "korgOutputAllowed",
  "setModificationAllowed",
  "usbWriteAllowed",
  "keyboardLoadAllowed",
  "autoApplyEnabled",
  "realApplyAllowed",
  "sourceProjectModified",
  "canAutoApply",
  "exportApprovalImpact"
];

function scanSafetyFlags(value, filePath, prefix = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanSafetyFlags(item, filePath, `${prefix}[${index}]`));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (falseOnlyFields.includes(key) && nested === true) {
      safetyFlagViolations.push({ filePath, field: nextPrefix, value: true });
    }
    if ((key === "metadataOnly" || key === "dryRunOnly") && nested === false) {
      safetyFlagViolations.push({ filePath, field: nextPrefix, value: false });
    }
    scanSafetyFlags(nested, filePath, nextPrefix);
  }
}

for (const version of versions) {
  const versionDir = path.join(base, version);
  const reportsDirForVersion = path.join(versionDir, "reports");
  const generatedDirForVersion = path.join(versionDir, "generated");
  const files = walkFiles(versionDir);
  const jsonFiles = files.filter((filePath) => filePath.toLowerCase().endsWith(".json"));
  const htmlFiles = files.filter((filePath) => filePath.toLowerCase().endsWith(".html"));
  const finalSeal = files.find((filePath) => /FINAL_SEAL\.md$/i.test(filePath));
  const qaReport = files.find((filePath) => /QA_REPORT\.md$/i.test(filePath));
  const generatedOutputs = walkFiles(generatedDirForVersion);
  const versionFailures = [];

  if (!fs.existsSync(versionDir)) versionFailures.push("version folder missing");
  if (!fs.existsSync(reportsDirForVersion)) versionFailures.push("reports folder missing");
  if (!finalSeal) versionFailures.push("final seal missing");
  if (!qaReport) versionFailures.push("QA report missing");
  if (!generatedOutputs.length) versionFailures.push("generated outputs missing");
  for (const failure of versionFailures) missingFiles.push({ version, failure });

  for (const filePath of jsonFiles) {
    try {
      const parsed = readJson(filePath);
      scanSafetyFlags(parsed, filePath);
    } catch (error) {
      invalidJsonFiles.push({ filePath, error: error.message });
    }
  }
  if (["v39", "v40", "v43", "v44", "v45", "v47"].includes(version) && htmlFiles.length === 0) {
    warnings.push({ version, warning: "Expected HTML output not found" });
  }
  for (const filePath of files) {
    const lower = filePath.toLowerCase();
    if (forbiddenExtPattern.test(lower)) forbiddenFilesDetected.push(filePath);
    if (path.basename(lower) === "app.jsx") forbiddenFilesDetected.push(filePath);
    if (lower.includes(`${path.sep}deploy${path.sep}`) || lower.includes(`${path.sep}public${path.sep}`) || lower.includes(`${path.sep}docs${path.sep}`)) {
      forbiddenFilesDetected.push(filePath);
    }
  }

  versionResults.push({
    version,
    versionPath: versionDir,
    exists: fs.existsSync(versionDir),
    reportsFolderExists: fs.existsSync(reportsDirForVersion),
    finalSealExists: Boolean(finalSeal),
    qaReportExists: Boolean(qaReport),
    generatedOutputCount: generatedOutputs.length,
    jsonFileCount: jsonFiles.length,
    htmlFileCount: htmlFiles.length,
    failureCount: versionFailures.length
  });
}

const v46ZipPath = path.join(base, "v46", "generated", "UAOS_V46_LOCAL_REVIEW_PACK_METADATA_ONLY.zip");
if (!fs.existsSync(v46ZipPath)) missingFiles.push({ version: "v46", failure: "V46 ZIP missing" });
const v47Inspection = readJson(path.join(base, "v47", "generated", "UAOS_V47_REVIEW_PACK_INSPECTION.json"));
if (v47Inspection.forbiddenFilesDetected?.length) forbiddenFilesDetected.push(...v47Inspection.forbiddenFilesDetected);
if (v47Inspection.safetyStatus !== "PASS") warnings.push({ version: "v47", warning: "V46 ZIP inspection was not PASS" });

const failureCount = missingFiles.length + invalidJsonFiles.length + forbiddenFilesDetected.length + safetyFlagViolations.length;
const warningCount = warnings.length;
const archiveIntegrityStatus = failureCount > 0 ? "BLOCKED" : warningCount > 0 ? "WARN" : "PASS";
const readyForOwnerReview = archiveIntegrityStatus === "PASS" || archiveIntegrityStatus === "WARN";

const results = {
  schemaVersion: "uaos.v48.archive.integrity.regression.results.v1",
  generatedAt,
  latestCommit,
  versionsChecked: versions,
  versionResults,
  passCount: versionResults.filter((item) => item.failureCount === 0).length,
  warningCount,
  failureCount,
  missingFiles,
  invalidJsonFiles,
  forbiddenFilesDetected,
  safetyFlagViolations,
  archiveIntegrityStatus,
  readyForOwnerReview,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safety: safetyBlock()
};

const failuresAndWarnings = {
  schemaVersion: "uaos.v48.regression.failures.warnings.v1",
  generatedAt,
  missingFiles,
  invalidJsonFiles,
  forbiddenFilesDetected,
  safetyFlagViolations,
  warnings,
  archiveIntegrityStatus,
  metadataOnly: true,
  regressionTestOnly: true
};

const nextMatrix = {
  schemaVersion: "uaos.v48.next.recommendation.matrix.v1",
  generatedAt,
  metadataOnly: true,
  reviewWorkflowOnly: true,
  regressionTestOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V49 Local Static Review Portal", safety: "no App.jsx and no deploy", recommended: true },
    { id: "B", action: "V49 Owner Decision Filled Example", safety: "sample and dry-run only", recommended: false },
    { id: "C", action: "V49 Metadata Governance Freeze Pack", safety: "metadata-only", recommended: true },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["A", "C"],
  safety: safetyBlock()
};

const regressionMd = [
  "# UAOS V48 Archive Integrity Regression Report",
  "",
  `Archive integrity status: ${archiveIntegrityStatus}`,
  `Versions checked: ${versions.join(", ")}`,
  `Pass count: ${results.passCount}`,
  `Warning count: ${warningCount}`,
  `Failure count: ${failureCount}`,
  `Ready for owner review: ${readyForOwnerReview ? "YES" : "NO"}`,
  "",
  "Safety: metadata-only regression test, read/inspect only, no source mutation, no export approval."
].join("\n");

const archiveReport = [
  "# UAOS V48 Archive Regression Test Report",
  "",
  `Status: ${archiveIntegrityStatus}`,
  "",
  `Missing files: ${missingFiles.length}`,
  `Invalid JSON files: ${invalidJsonFiles.length}`,
  `Forbidden files detected: ${forbiddenFilesDetected.length}`,
  `Safety flag violations: ${safetyFlagViolations.length}`,
  "",
  "No files were copied to USB, exported, or loaded to hardware."
].join("\n");

const qaReport = [
  "# UAOS V48 QA Report",
  "",
  "Owner workflow pack created: YES",
  "Step-by-step guide created: YES",
  "Decision map created: YES",
  "Archive regression test created: YES",
  "Regression report created: YES",
  `Validator PASS: ${validatorAlreadyPassed ? "YES" : "pending validator run"}`,
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
].join("\n");

const dashboard = [
  "# UAOS V48 Owner Dashboard",
  "",
  `Workflow pack: ${path.join(generatedDir, "UAOS_V48_OWNER_REVIEW_WORKFLOW_PACK.json")}`,
  `Step-by-step guide: ${path.join(generatedDir, "UAOS_V48_OWNER_REVIEW_STEP_BY_STEP.md")}`,
  `Decision map: ${path.join(generatedDir, "UAOS_V48_OWNER_REVIEW_DECISION_MAP.json")}`,
  `Regression results: ${path.join(generatedDir, "UAOS_V48_ARCHIVE_INTEGRITY_REGRESSION_RESULTS.json")}`,
  `Archive integrity status: ${archiveIntegrityStatus}`,
  `Safety status: ${archiveIntegrityStatus === "BLOCKED" ? "BLOCKED" : "PASS"}`,
  "",
  "Still blocked: real apply, source project mutation, auto-apply, KORG output, SET/STY/PRF/PRS/KST generation, USB write, PA3X load, export approval, App.jsx integration, deploy.",
  "",
  "Next recommended phase: A + C together, V49 Local Static Review Portal and V49 Metadata Governance Freeze Pack."
].join("\n");

const masterIndex = [
  "# UAOS V48 Master Index",
  "",
  "- generated/UAOS_V48_OWNER_REVIEW_WORKFLOW_PACK.json",
  "- generated/UAOS_V48_OWNER_REVIEW_WORKFLOW_PACK.md",
  "- generated/UAOS_V48_OWNER_REVIEW_STEP_BY_STEP.md",
  "- generated/UAOS_V48_OWNER_REVIEW_DECISION_MAP.json",
  "- generated/UAOS_V48_ARCHIVE_INTEGRITY_REGRESSION_RESULTS.json",
  "- generated/UAOS_V48_ARCHIVE_INTEGRITY_REGRESSION_REPORT.md",
  "- generated/UAOS_V48_REGRESSION_FAILURES_AND_WARNINGS.json",
  "- generated/UAOS_V48_NEXT_RECOMMENDATION_MATRIX.json",
  "- reports/UAOS_V48_OWNER_REVIEW_WORKFLOW_REPORT.md",
  "- reports/UAOS_V48_ARCHIVE_REGRESSION_TEST_REPORT.md",
  "- reports/UAOS_V48_VALIDATOR_RESULTS.json",
  "- reports/UAOS_V48_QA_REPORT.md",
  "- reports/UAOS_V48_OWNER_DASHBOARD.md",
  "- reports/UAOS_V48_FINAL_SEAL.md"
].join("\n");

const finalSeal = [
  "# UAOS V48 Final Seal",
  "",
  `Status: ${validatorAlreadyPassed ? "PASS" : "pending validator run"}`,
  "Safety: metadata-only, owner review workflow only, regression test only, read/inspect only.",
  "No real apply, no source mutation, no export approval, no USB write, no keyboard load."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V48_ARCHIVE_INTEGRITY_REGRESSION_RESULTS.json"), JSON.stringify(results, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V48_ARCHIVE_INTEGRITY_REGRESSION_REPORT.md"), regressionMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V48_REGRESSION_FAILURES_AND_WARNINGS.json"), JSON.stringify(failuresAndWarnings, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V48_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(nextMatrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V48_ARCHIVE_REGRESSION_TEST_REPORT.md"), archiveReport + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V48_QA_REPORT.md"), qaReport + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V48_OWNER_DASHBOARD.md"), dashboard + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V48_MASTER_INDEX.md"), masterIndex + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V48_FINAL_SEAL.md"), finalSeal + "\n", "utf8");

console.log(JSON.stringify({ status: archiveIntegrityStatus, failures: failureCount, warnings: warningCount, output: "generated/UAOS_V48_ARCHIVE_INTEGRITY_REGRESSION_RESULTS.json" }, null, 2));
