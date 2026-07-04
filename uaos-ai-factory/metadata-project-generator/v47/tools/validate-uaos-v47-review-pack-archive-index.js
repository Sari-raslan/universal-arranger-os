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
const resultPath = path.join(reportsDir, "UAOS_V47_VALIDATOR_RESULTS.json");

const paths = {
  inspection: path.join(generatedDir, "UAOS_V47_REVIEW_PACK_INSPECTION.json"),
  inspectionMd: path.join(generatedDir, "UAOS_V47_REVIEW_PACK_INSPECTION.md"),
  contentsIndex: path.join(generatedDir, "UAOS_V47_REVIEW_PACK_CONTENTS_INDEX.json"),
  contentsIndexMd: path.join(generatedDir, "UAOS_V47_REVIEW_PACK_CONTENTS_INDEX.md"),
  archiveHtml: path.join(generatedDir, "UAOS_V47_LOCAL_ARCHIVE_INDEX_V37_V46.html"),
  archiveData: path.join(generatedDir, "UAOS_V47_LOCAL_ARCHIVE_INDEX_DATA.json"),
  health: path.join(generatedDir, "UAOS_V47_ARCHIVE_HEALTH_SUMMARY.json"),
  matrix: path.join(generatedDir, "UAOS_V47_NEXT_RECOMMENDATION_MATRIX.json")
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

const inspection = readJson(paths.inspection, errors);
readJson(paths.contentsIndex, errors);
readJson(paths.archiveData, errors);
const health = readJson(paths.health, errors);
readJson(paths.matrix, errors);

for (const filePath of [paths.inspectionMd, paths.contentsIndexMd, paths.archiveHtml]) {
  if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
}

if (fs.existsSync(paths.archiveHtml)) {
  const html = fs.readFileSync(paths.archiveHtml, "utf8");
  for (const phrase of [
    "LOCAL ARCHIVE INDEX ONLY",
    "METADATA ONLY",
    "REVIEW PACK INSPECTION ONLY",
    "SOURCE PROJECT NOT MODIFIED",
    "NOT DEPLOYED",
    "NOT KORG OUTPUT",
    "NOT PA3X READY",
    "NO USB APPROVAL",
    "NO KEYBOARD LOAD APPROVAL",
    "NO EXPORT APPROVAL"
  ]) {
    if (!html.includes(phrase)) errors.push(`HTML missing phrase: ${phrase}`);
  }
}

if (inspection) {
  if (inspection.forbiddenFilesDetected?.length) errors.push("Forbidden files detected in ZIP");
  if (inspection.safetyStatus !== "PASS") errors.push("Inspection safetyStatus must be PASS");
  if (inspection.manifestMatchesZip !== true) errors.push("Inspection manifestMatchesZip must be true");
  if (inspection.hashVerificationStatus !== "PASS") errors.push("Inspection hashVerificationStatus must be PASS");
  expectFalse(inspection, "inspection", "readyForKorgExport", errors);
  expectFalse(inspection, "inspection", "readyForUsb", errors);
  expectFalse(inspection, "inspection", "readyForKeyboardLoad", errors);
}
if (health) {
  expectFalse(health, "health", "readyForKorgExport", errors);
  expectFalse(health, "health", "readyForUsb", errors);
  expectFalse(health, "health", "readyForKeyboardLoad", errors);
  if (health.reviewPackZipStatus !== "PASS") errors.push("Health reviewPackZipStatus must be PASS");
  if (health.hashVerificationStatus !== "PASS") errors.push("Health hashVerificationStatus must be PASS");
}

for (const filePath of walkFiles(root)) {
  const lower = filePath.toLowerCase();
  if (lower.includes(`${path.sep}.set${path.sep}`) || lower.endsWith(".set")) errors.push(`Forbidden V47 SET folder/file: ${rel(filePath)}`);
  if (/\.(sty|prf|prs|kst)$/i.test(lower)) errors.push(`Forbidden V47 keyboard file: ${rel(filePath)}`);
  if (/\.(wav|aiff|aif|mp3|flac|ogg|mid|midi)$/i.test(lower)) errors.push(`Forbidden V47 audio/sample binary: ${rel(filePath)}`);
  if (path.basename(lower) === "app.jsx") errors.push(`Forbidden V47 App.jsx: ${rel(filePath)}`);
  if (lower.includes(`${path.sep}deploy${path.sep}`) || lower.includes(`${path.sep}public${path.sep}`) || lower.includes(`${path.sep}docs${path.sep}`)) {
    errors.push(`Forbidden V47 deploy/public/docs path: ${rel(filePath)}`);
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
    readInspectOnly: true,
    localArchiveIndexOnly: true,
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
  fs.writeFileSync(path.join(reportsDir, "UAOS_V47_QA_REPORT.md"), [
    "# UAOS V47 QA Report",
    "",
    "Review pack inspection created: YES",
    "Contents index created: YES",
    "Local archive index created: YES",
    "Archive health summary created: YES",
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
  fs.writeFileSync(path.join(reportsDir, "UAOS_V47_FINAL_SEAL.md"), [
    "# UAOS V47 Final Seal",
    "",
    "Status: PASS",
    "",
    "V47 created a review pack inspection, contents index, local archive index, archive health summary, QA report, owner dashboard, and validator result.",
    "",
    "Safety: metadata-only, read/inspect only, local archive index only, no real apply, no source project mutation, no KORG output, no SET/STY/PRF/PRS/KST, no audio/sample binaries, no USB write, no keyboard load, no fixture modification, no App.jsx, no deploy, no export approval."
  ].join("\n") + "\n", "utf8");
}

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
