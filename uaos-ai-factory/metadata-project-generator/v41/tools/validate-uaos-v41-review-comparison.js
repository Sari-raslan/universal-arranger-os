import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const resultPath = path.join(reportsDir, "UAOS_V41_VALIDATOR_RESULTS.json");

const paths = {
  pack: path.join(generatedDir, "UAOS_V41_SUGGESTION_REVIEW_PACK.json"),
  packMd: path.join(generatedDir, "UAOS_V41_SUGGESTION_REVIEW_PACK.md"),
  form: path.join(generatedDir, "UAOS_V41_SUGGESTION_OWNER_DECISION_FORM.md"),
  matrix: path.join(generatedDir, "UAOS_V41_LOCAL_PROJECT_COMPARISON_MATRIX.json"),
  matrixMd: path.join(generatedDir, "UAOS_V41_LOCAL_PROJECT_COMPARISON_MATRIX.md"),
  scorecard: path.join(generatedDir, "UAOS_V41_PROJECT_COMPARISON_SCORECARD.json"),
  recommendation: path.join(generatedDir, "UAOS_V41_NEXT_RECOMMENDATION_MATRIX.json")
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

const pack = readJson(paths.pack, errors);
const matrix = readJson(paths.matrix, errors);
const scorecard = readJson(paths.scorecard, errors);
const recommendation = readJson(paths.recommendation, errors);

for (const filePath of [paths.packMd, paths.form, paths.matrixMd]) {
  if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
}

if (pack?.reviewItems) {
  for (const item of pack.reviewItems) {
    if (item.canAutoApply !== false) errors.push(`${item.reviewItemId}.canAutoApply must be false`);
    if (item.metadataOnly !== true) errors.push(`${item.reviewItemId}.metadataOnly must be true`);
    if (item.exportApprovalImpact !== false) errors.push(`${item.reviewItemId}.exportApprovalImpact must be false`);
    if (item.korgOutputAllowed !== false) errors.push(`${item.reviewItemId}.korgOutputAllowed must be false`);
    if (item.usbWriteAllowed !== false) errors.push(`${item.reviewItemId}.usbWriteAllowed must be false`);
    if (item.keyboardLoadAllowed !== false) errors.push(`${item.reviewItemId}.keyboardLoadAllowed must be false`);
  }
}

for (const [label, doc] of Object.entries({ pack, matrix, scorecard, recommendation })) {
  if (!doc) continue;
  if (doc.metadataOnly !== true) errors.push(`${label}.metadataOnly must be true`);
  for (const field of ["approvedForKorgExport", "approvedForUsb", "approvedForKeyboardLoad"]) {
    if (doc[field] !== false) errors.push(`${label}.${field} must be false`);
  }
}

if (scorecard) {
  if (scorecard.exportReadinessScore !== 0) errors.push("exportReadinessScore must be 0");
  if (scorecard.usbReadinessScore !== 0) errors.push("usbReadinessScore must be 0");
  if (scorecard.keyboardLoadReadinessScore !== 0) errors.push("keyboardLoadReadinessScore must be 0");
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
    staticHtmlJsonMdOnly: true,
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
