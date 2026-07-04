import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const resultPath = path.join(reportsDir, "UAOS_V37_VALIDATOR_RESULTS.json");

const required = {
  project: path.join(generatedDir, "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
  dsp: path.join(generatedDir, "UAOS_EXAMPLE_DSP_PLAN_V37.json"),
  style: path.join(generatedDir, "UAOS_EXAMPLE_STYLE_REVIEW_PLAN_V37.json"),
  manifest: path.join(generatedDir, "UAOS_EXAMPLE_PROJECT_BUNDLE_MANIFEST_V37.json")
};

function rel(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function readJson(filePath, errors) {
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing file: ${rel(filePath)}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON: ${rel(filePath)} ${error.message}`);
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

function expect(value, expected, label, errors) {
  if (value !== expected) errors.push(`${label} expected ${expected} but found ${value}`);
}

fs.mkdirSync(reportsDir, { recursive: true });
const errors = [];
const warnings = [];

const project = readJson(required.project, errors);
const dsp = readJson(required.dsp, errors);
const style = readJson(required.style, errors);
const manifest = readJson(required.manifest, errors);

if (project) {
  if (!project.schemaVersion) errors.push("Project schemaVersion missing");
  expect(project.safety && project.safety.metadataOnly, true, "project.safety.metadataOnly", errors);
  expect(project.safety && project.safety.korgOutputAllowed, false, "project.safety.korgOutputAllowed", errors);
  expect(project.safety && project.safety.setModificationAllowed, false, "project.safety.setModificationAllowed", errors);
  expect(project.safety && project.safety.usbWriteAllowed, false, "project.safety.usbWriteAllowed", errors);
  expect(project.safety && project.safety.keyboardLoadAllowed, false, "project.safety.keyboardLoadAllowed", errors);
  expect(project.safety && project.safety.compatibilityClaim, false, "project.safety.compatibilityClaim", errors);
  expect(project.safety && project.safety.pa3xReadyClaim, false, "project.safety.pa3xReadyClaim", errors);
}
if (dsp) {
  if (!dsp.schemaVersion) errors.push("DSP schemaVersion missing");
  expect(dsp.safety && dsp.safety.metadataOnly, true, "dsp.safety.metadataOnly", errors);
  expect(dsp.safety && dsp.safety.audioRenderAllowed, false, "dsp.safety.audioRenderAllowed", errors);
  expect(dsp.safety && dsp.safety.pluginExecutionAllowed, false, "dsp.safety.pluginExecutionAllowed", errors);
}
if (style) {
  if (!style.schemaVersion) errors.push("Style review schemaVersion missing");
  expect(style.reviewStatus && style.reviewStatus.humanReviewRequired, true, "style.reviewStatus.humanReviewRequired", errors);
  expect(style.reviewStatus && style.reviewStatus.keyboardTestRequired, true, "style.reviewStatus.keyboardTestRequired", errors);
  expect(style.reviewStatus && style.reviewStatus.keyboardTestCompleted, false, "style.reviewStatus.keyboardTestCompleted", errors);
  expect(style.reviewStatus && style.reviewStatus.approvedForKorgExport, false, "style.reviewStatus.approvedForKorgExport", errors);
}
if (manifest) {
  if (!manifest.schemaVersion) errors.push("Manifest schemaVersion missing");
  expect(manifest.safety && manifest.safety.metadataOnly, true, "manifest.safety.metadataOnly", errors);
  expect(manifest.safety && manifest.safety.noKorgOutput, true, "manifest.safety.noKorgOutput", errors);
  expect(manifest.safety && manifest.safety.noSetModification, true, "manifest.safety.noSetModification", errors);
}

const allFiles = walk(root);
const forbiddenExt = new Set([".sty", ".prf", ".prs", ".kst"]);
for (const filePath of allFiles) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(`${path.sep}.set${path.sep}`) || lower.includes(`${path.sep}.set${path.sep}`) || lower.endsWith(".set" + path.sep)) {
    errors.push(`Forbidden SET folder found: ${rel(filePath)}`);
  }
  if (forbiddenExt.has(path.extname(lower))) {
    errors.push(`Forbidden generated file type found: ${rel(filePath)}`);
  }
  if (path.basename(filePath).toLowerCase() === "app.jsx") {
    errors.push(`Forbidden App.jsx found in V37 folder: ${rel(filePath)}`);
  }
}

const result = {
  status: errors.length ? "FAIL" : "PASS",
  checkedAt: new Date().toISOString(),
  files: Object.fromEntries(Object.entries(required).map(([key, value]) => [key, rel(value)])),
  errors,
  warnings,
  safety: {
    metadataOnly: true,
    noKorgOutput: true,
    noSetModification: true,
    noUsbWrite: true,
    noPa3xLoad: true,
    noPackageCopy: true,
    noFixtureModification: true,
    noProprietarySampleExtraction: true,
    appJsUntouched: true
  }
};

fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
