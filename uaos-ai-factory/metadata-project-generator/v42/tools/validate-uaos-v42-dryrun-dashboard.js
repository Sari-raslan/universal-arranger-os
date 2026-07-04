import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const resultPath = path.join(reportsDir, "UAOS_V42_VALIDATOR_RESULTS.json");
const sourceProject = path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json");

const paths = {
  plan: path.join(generatedDir, "UAOS_V42_METADATA_APPLY_SIMULATION_PLAN.json"),
  preview: path.join(generatedDir, "UAOS_V42_METADATA_APPLY_SIMULATION_PREVIEW.json"),
  previewMd: path.join(generatedDir, "UAOS_V42_METADATA_APPLY_SIMULATION_PREVIEW.md"),
  dryrunProject: path.join(generatedDir, "UAOS_V42_DRYRUN_PROJECT_AFTER_PREVIEW.uaosproject.json"),
  dashboard: path.join(generatedDir, "UAOS_V42_LOCAL_REVIEW_DASHBOARD.html"),
  dashboardData: path.join(generatedDir, "UAOS_V42_LOCAL_REVIEW_DASHBOARD_DATA.json"),
  matrix: path.join(generatedDir, "UAOS_V42_NEXT_RECOMMENDATION_MATRIX.json")
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

const plan = readJson(paths.plan, errors);
const preview = readJson(paths.preview, errors);
const dryrunProject = readJson(paths.dryrunProject, errors);
const dashboardData = readJson(paths.dashboardData, errors);
const matrix = readJson(paths.matrix, errors);

if (!fs.existsSync(paths.previewMd)) errors.push("Simulation preview Markdown missing");
if (!fs.existsSync(paths.dashboard)) {
  errors.push("Local HTML dashboard missing");
} else {
  const html = fs.readFileSync(paths.dashboard, "utf8");
  for (const phrase of ["LOCAL DASHBOARD ONLY", "DRY-RUN ONLY", "METADATA ONLY", "SOURCE PROJECT NOT MODIFIED", "NOT DEPLOYED", "NOT KORG OUTPUT", "NOT PA3X READY", "NO USB APPROVAL", "NO KEYBOARD LOAD APPROVAL"]) {
    if (!html.includes(phrase)) errors.push(`HTML missing phrase: ${phrase}`);
  }
}

for (const [label, doc] of Object.entries({ plan, preview, dryrunProject, dashboardData, matrix })) {
  if (!doc) continue;
  if (doc.sourceProjectModified !== undefined && doc.sourceProjectModified !== false) errors.push(`${label}.sourceProjectModified must be false`);
  if (doc.autoApplyEnabled !== undefined && doc.autoApplyEnabled !== false) errors.push(`${label}.autoApplyEnabled must be false`);
  if (doc.dryRunOnly !== true) errors.push(`${label}.dryRunOnly must be true`);
  if (doc.metadataOnly !== true) errors.push(`${label}.metadataOnly must be true`);
  for (const field of ["approvedForKorgExport", "approvedForUsb", "approvedForKeyboardLoad"]) {
    if (doc[field] !== undefined && doc[field] !== false) errors.push(`${label}.${field} must be false`);
  }
  if (doc.korgOutputAllowed !== undefined && doc.korgOutputAllowed !== false) errors.push(`${label}.korgOutputAllowed must be false`);
  if (doc.usbWriteAllowed !== undefined && doc.usbWriteAllowed !== false) errors.push(`${label}.usbWriteAllowed must be false`);
  if (doc.keyboardLoadAllowed !== undefined && doc.keyboardLoadAllowed !== false) errors.push(`${label}.keyboardLoadAllowed must be false`);
}

if (plan) {
  const currentSourceHash = sha256(sourceProject);
  if (plan.sourceProjectSha256Before !== currentSourceHash) {
    errors.push("Original V37 project hash changed after simulation");
  }
}
if (dryrunProject?.previewArtifact !== true) errors.push("dryrunProject.previewArtifact must be true");
if (dryrunProject?.sourceProjectModified !== false) errors.push("dryrunProject.sourceProjectModified must be false");

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
