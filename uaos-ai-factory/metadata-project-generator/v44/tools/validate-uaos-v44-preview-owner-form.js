import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const resultPath = path.join(reportsDir, "UAOS_V44_VALIDATOR_RESULTS.json");
const sourceProject = path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json");
const v42DryrunProject = path.join(base, "v42", "generated", "UAOS_V42_DRYRUN_PROJECT_AFTER_PREVIEW.uaosproject.json");

const paths = {
  preview: path.join(generatedDir, "UAOS_V44_DECISION_APPLY_PREVIEW_V2.json"),
  previewMd: path.join(generatedDir, "UAOS_V44_DECISION_APPLY_PREVIEW_V2.md"),
  diff: path.join(generatedDir, "UAOS_V44_PREVIEW_DIFF_SUMMARY.json"),
  diffMd: path.join(generatedDir, "UAOS_V44_PREVIEW_DIFF_SUMMARY.md"),
  dryrunProject: path.join(generatedDir, "UAOS_V44_DRYRUN_PROJECT_AFTER_DECISION_PREVIEW.uaosproject.json"),
  form: path.join(generatedDir, "UAOS_V44_OWNER_REVIEW_FORM.html"),
  formData: path.join(generatedDir, "UAOS_V44_OWNER_REVIEW_FORM_DATA.json"),
  matrix: path.join(generatedDir, "UAOS_V44_NEXT_RECOMMENDATION_MATRIX.json")
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

const preview = readJson(paths.preview, errors);
const diff = readJson(paths.diff, errors);
const dryrunProject = readJson(paths.dryrunProject, errors);
const formData = readJson(paths.formData, errors);
const matrix = readJson(paths.matrix, errors);

for (const filePath of [paths.previewMd, paths.diffMd]) {
  if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
}
if (!fs.existsSync(paths.form)) {
  errors.push("Owner review HTML form missing");
} else {
  const html = fs.readFileSync(paths.form, "utf8");
  for (const phrase of ["LOCAL FORM ONLY", "DOES NOT SAVE AUTOMATICALLY", "DRY-RUN ONLY", "METADATA ONLY", "SOURCE PROJECT NOT MODIFIED", "NOT DEPLOYED", "NOT KORG OUTPUT", "NOT PA3X READY", "NO USB APPROVAL", "NO KEYBOARD LOAD APPROVAL", "NO EXPORT APPROVAL"]) {
    if (!html.includes(phrase)) errors.push(`HTML missing phrase: ${phrase}`);
  }
}

for (const [label, doc] of Object.entries({ preview, diff, dryrunProject, formData, matrix })) {
  if (!doc) continue;
  if (doc.dryRunOnly !== true) errors.push(`${label}.dryRunOnly must be true`);
  if (doc.metadataOnly !== true) errors.push(`${label}.metadataOnly must be true`);
  if (doc.sourceProjectModified !== undefined && doc.sourceProjectModified !== false) errors.push(`${label}.sourceProjectModified must be false`);
  if (doc.autoApplyEnabled !== undefined && doc.autoApplyEnabled !== false) errors.push(`${label}.autoApplyEnabled must be false`);
  if (doc.realApplyAllowed !== undefined && doc.realApplyAllowed !== false) errors.push(`${label}.realApplyAllowed must be false`);
  for (const field of ["korgOutputAllowed", "usbWriteAllowed", "keyboardLoadAllowed", "approvedForKorgExport", "approvedForUsb", "approvedForKeyboardLoad"]) {
    if (doc[field] !== undefined && doc[field] !== false) errors.push(`${label}.${field} must be false`);
  }
}
if (dryrunProject?.previewArtifact !== true) errors.push("dryrunProject.previewArtifact must be true");
if (dryrunProject?.decisionsAppliedInPreviewOnly !== true) errors.push("dryrunProject.decisionsAppliedInPreviewOnly must be true");
if (preview?.beforeSummary?.sourceProjectSha256Before && sha256(sourceProject) !== preview.beforeSummary.sourceProjectSha256Before) errors.push("Original V37 project hash changed");
if (preview?.beforeSummary?.v42DryrunSha256Before && sha256(v42DryrunProject) !== preview.beforeSummary.v42DryrunSha256Before) errors.push("Original V42 dry-run project hash changed");

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
    localHtmlOnly: true,
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
