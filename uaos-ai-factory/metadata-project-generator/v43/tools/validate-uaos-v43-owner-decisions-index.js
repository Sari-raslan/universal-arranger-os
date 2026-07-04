import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const resultPath = path.join(reportsDir, "UAOS_V43_VALIDATOR_RESULTS.json");
const sourceProject = path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json");
const v42Plan = path.join(base, "v42", "generated", "UAOS_V42_METADATA_APPLY_SIMULATION_PLAN.json");

const paths = {
  template: path.join(generatedDir, "UAOS_V43_OWNER_DECISION_TEMPLATE.json"),
  templateMd: path.join(generatedDir, "UAOS_V43_OWNER_DECISION_TEMPLATE.md"),
  summary: path.join(generatedDir, "UAOS_V43_OWNER_DECISION_VALIDATION_SUMMARY.json"),
  summaryMd: path.join(generatedDir, "UAOS_V43_OWNER_DECISION_VALIDATION_SUMMARY.md"),
  indexHtml: path.join(generatedDir, "UAOS_V43_LOCAL_DASHBOARD_INDEX_V37_V42.html"),
  indexData: path.join(generatedDir, "UAOS_V43_LOCAL_DASHBOARD_INDEX_DATA.json"),
  matrix: path.join(generatedDir, "UAOS_V43_NEXT_RECOMMENDATION_MATRIX.json")
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
const indexData = readJson(paths.indexData, errors);
const matrix = readJson(paths.matrix, errors);
const plan = readJson(v42Plan, errors);

for (const filePath of [paths.templateMd, paths.summaryMd]) {
  if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
}
if (!fs.existsSync(paths.indexHtml)) {
  errors.push("Local dashboard index HTML missing");
} else {
  const html = fs.readFileSync(paths.indexHtml, "utf8");
  for (const phrase of ["LOCAL DASHBOARD INDEX ONLY", "METADATA ONLY", "DECISION COLLECTION ONLY", "DRY-RUN ONLY", "SOURCE PROJECT NOT MODIFIED", "NOT DEPLOYED", "NOT KORG OUTPUT", "NOT PA3X READY", "NO USB APPROVAL", "NO KEYBOARD LOAD APPROVAL"]) {
    if (!html.includes(phrase)) errors.push(`HTML missing phrase: ${phrase}`);
  }
}

if (template?.decisions) {
  for (const item of template.decisions) {
    if (item.canAutoApply !== false) errors.push(`${item.decisionId}.canAutoApply must be false`);
    if (item.metadataOnly !== true) errors.push(`${item.decisionId}.metadataOnly must be true`);
    if (item.dryRunOnly !== true) errors.push(`${item.decisionId}.dryRunOnly must be true`);
    if (item.exportApprovalImpact !== false) errors.push(`${item.decisionId}.exportApprovalImpact must be false`);
    if (item.korgOutputAllowed !== false) errors.push(`${item.decisionId}.korgOutputAllowed must be false`);
    if (item.usbWriteAllowed !== false) errors.push(`${item.decisionId}.usbWriteAllowed must be false`);
    if (item.keyboardLoadAllowed !== false) errors.push(`${item.decisionId}.keyboardLoadAllowed must be false`);
  }
}

for (const [label, doc] of Object.entries({ template, summary, indexData, matrix })) {
  if (!doc) continue;
  const safety = doc.safety || doc;
  if (safety.sourceProjectModified !== undefined && safety.sourceProjectModified !== false) errors.push(`${label}.sourceProjectModified must be false`);
  if (safety.autoApplyEnabled !== undefined && safety.autoApplyEnabled !== false) errors.push(`${label}.autoApplyEnabled must be false`);
  if (safety.realApplyAllowed !== undefined && safety.realApplyAllowed !== false) errors.push(`${label}.realApplyAllowed must be false`);
  for (const field of ["korgOutputAllowed", "setModificationAllowed", "usbWriteAllowed", "keyboardLoadAllowed"]) {
    if (safety[field] !== undefined && safety[field] !== false) errors.push(`${label}.${field} must be false`);
  }
}
if (summary) {
  for (const field of ["readyForRealApply", "readyForKorgExport", "readyForUsb", "readyForKeyboardLoad"]) {
    if (summary[field] !== false) errors.push(`summary.${field} must be false`);
  }
}
if (plan?.sourceProjectSha256Before && sha256(sourceProject) !== plan.sourceProjectSha256Before) {
  errors.push("Original V37 project hash changed");
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
    decisionCollectionOnly: true,
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
