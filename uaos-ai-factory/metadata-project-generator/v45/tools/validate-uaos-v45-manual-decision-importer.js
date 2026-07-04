import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const resultPath = path.join(reportsDir, "UAOS_V45_VALIDATOR_RESULTS.json");

const sourcePaths = {
  v37Project: path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
  v42DryrunProject: path.join(base, "v42", "generated", "UAOS_V42_DRYRUN_PROJECT_AFTER_PREVIEW.uaosproject.json"),
  v44DryrunProject: path.join(base, "v44", "generated", "UAOS_V44_DRYRUN_PROJECT_AFTER_DECISION_PREVIEW.uaosproject.json")
};

const paths = {
  template: path.join(generatedDir, "UAOS_V45_MANUAL_DECISION_IMPORT_TEMPLATE.json"),
  templateMd: path.join(generatedDir, "UAOS_V45_MANUAL_DECISION_IMPORT_TEMPLATE.md"),
  summary: path.join(generatedDir, "UAOS_V45_IMPORTED_DECISION_DRYRUN_SUMMARY.json"),
  summaryMd: path.join(generatedDir, "UAOS_V45_IMPORTED_DECISION_DRYRUN_SUMMARY.md"),
  html: path.join(generatedDir, "UAOS_V45_OWNER_REVIEW_FORM_V2_PRINTABLE.html"),
  sheetMd: path.join(generatedDir, "UAOS_V45_OWNER_REVIEW_PRINTABLE_DECISION_SHEET.md"),
  sheetJson: path.join(generatedDir, "UAOS_V45_OWNER_REVIEW_PRINTABLE_DECISION_SHEET.json"),
  matrix: path.join(generatedDir, "UAOS_V45_NEXT_RECOMMENDATION_MATRIX.json")
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

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(full + path.sep);
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

fs.mkdirSync(reportsDir, { recursive: true });
const errors = [];
const warnings = [];

const template = readJson(paths.template, errors);
const summary = readJson(paths.summary, errors);
const sheet = readJson(paths.sheetJson, errors);
const matrix = readJson(paths.matrix, errors);
for (const filePath of [paths.templateMd, paths.summaryMd, paths.html, paths.sheetMd]) {
  if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
}

if (fs.existsSync(paths.html)) {
  const html = fs.readFileSync(paths.html, "utf8");
  for (const phrase of ["LOCAL PRINTABLE FORM ONLY", "DOES NOT SAVE AUTOMATICALLY", "MANUAL REVIEW ONLY", "DRY-RUN ONLY", "METADATA ONLY", "SOURCE PROJECT NOT MODIFIED", "NOT DEPLOYED", "NOT KORG OUTPUT", "NOT PA3X READY", "NO USB APPROVAL", "NO KEYBOARD LOAD APPROVAL", "NO EXPORT APPROVAL"]) {
    if (!html.includes(phrase)) errors.push(`HTML missing phrase: ${phrase}`);
  }
}

if (template?.decisions) {
  for (const item of template.decisions) {
    if (item.canAutoApply !== false) errors.push(`${item.decisionId}.canAutoApply must be false`);
    if (item.metadataOnly !== true) errors.push(`${item.decisionId}.metadataOnly must be true`);
    if (item.dryRunOnly !== true) errors.push(`${item.decisionId}.dryRunOnly must be true`);
    if (item.realApplyAllowed !== false) errors.push(`${item.decisionId}.realApplyAllowed must be false`);
  }
}
if (summary) {
  for (const field of ["readyForRealApply", "readyForKorgExport", "readyForUsb", "readyForKeyboardLoad"]) {
    if (summary[field] !== false) errors.push(`summary.${field} must be false`);
  }
  if (summary.sourceHashes) {
    if (sha256(sourcePaths.v37Project) !== summary.sourceHashes.v37ProjectSha256) errors.push("Original V37 project hash changed");
    if (sha256(sourcePaths.v42DryrunProject) !== summary.sourceHashes.v42DryrunProjectSha256) errors.push("Original V42 dry-run project hash changed");
    if (sha256(sourcePaths.v44DryrunProject) !== summary.sourceHashes.v44DryrunProjectSha256) errors.push("Original V44 dry-run project hash changed");
  }
}
for (const [label, doc] of Object.entries({ template, summary, sheet, matrix })) {
  if (!doc) continue;
  if (doc.metadataOnly !== true) errors.push(`${label}.metadataOnly must be true`);
  if (doc.dryRunOnly !== undefined && doc.dryRunOnly !== true) errors.push(`${label}.dryRunOnly must be true`);
  for (const field of ["approvedForKorgExport", "approvedForUsb", "approvedForKeyboardLoad"]) {
    if (doc[field] !== undefined && doc[field] !== false) errors.push(`${label}.${field} must be false`);
  }
}

const allFiles = walk(root);
const forbiddenExt = new Set([".sty", ".prf", ".prs", ".kst"]);
for (const filePath of allFiles) {
  const lower = filePath.toLowerCase();
  if (lower.includes(`${path.sep}.set${path.sep}`) || lower.endsWith(".set" + path.sep)) errors.push(`Forbidden SET folder: ${rel(filePath)}`);
  if (forbiddenExt.has(path.extname(lower))) errors.push(`Forbidden generated file type: ${rel(filePath)}`);
  if (path.basename(lower) === "app.jsx") errors.push(`Forbidden App.jsx: ${rel(filePath)}`);
  if (lower.includes(`${path.sep}public${path.sep}`) || lower.includes(`${path.sep}docs${path.sep}`) || lower.includes(`${path.sep}deploy${path.sep}`)) errors.push(`Forbidden deploy output path: ${rel(filePath)}`);
}

const result = {
  status: errors.length ? "FAIL" : "PASS",
  checkedAt: new Date().toISOString(),
  checkedFiles: Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, rel(value)])),
  errors,
  warnings,
  safety: {
    metadataOnly: true,
    dryRunOnly: true,
    manualDecisionImportOnly: true,
    noRealApply: true,
    sourceProjectModified: false,
    noAutoApply: true,
    noKorgOutput: true,
    noSetModification: true,
    noUsbWrite: true,
    noPa3xLoad: true,
    noPackageCopy: true,
    noFixtureModification: true,
    noProprietarySampleExtraction: true,
    appJsUntouched: true,
    noDeployOutput: true,
    noExportApproval: true
  }
};

fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
