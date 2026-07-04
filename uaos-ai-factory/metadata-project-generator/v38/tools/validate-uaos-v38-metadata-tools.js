import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const resultPath = path.join(reportsDir, "UAOS_V38_VALIDATOR_RESULTS.json");

const jsonFiles = [
  "UAOS_V38_PROJECT_BUNDLE_INSPECTION.json",
  "UAOS_V38_STYLE_REVIEW_SCORE.json",
  "UAOS_V38_RECOMMENDATION_MATRIX.json",
  "UAOS_V38_PROJECT_HEALTH_SUMMARY.json"
].map((name) => path.join(generatedDir, name));

function rel(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function readJson(filePath, errors) {
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing generated JSON: ${rel(filePath)}`);
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

function expectSafety(doc, label, errors) {
  const fields = ["metadataOnly", "korgOutputAllowed", "setModificationAllowed", "usbWriteAllowed", "keyboardLoadAllowed", "compatibilityClaim", "pa3xReadyClaim"];
  for (const field of fields) {
    if (doc[field] === undefined) errors.push(`${label}.${field} missing`);
  }
  if (doc.metadataOnly !== true) errors.push(`${label}.metadataOnly must be true`);
  for (const field of fields.slice(1)) {
    if (doc[field] !== false) errors.push(`${label}.${field} must be false`);
  }
}

fs.mkdirSync(reportsDir, { recursive: true });
const errors = [];
const warnings = [];
const docs = jsonFiles.map((filePath) => [filePath, readJson(filePath, errors)]).filter(([, doc]) => doc);

for (const [filePath, doc] of docs) {
  expectSafety(doc, rel(filePath), errors);
  if (doc.safety) {
    if (doc.safety.metadataOnly !== true) errors.push(`${rel(filePath)} safety.metadataOnly must be true`);
    for (const field of ["korgOutputAllowed", "setModificationAllowed", "usbWriteAllowed", "keyboardLoadAllowed", "compatibilityClaim", "pa3xReadyClaim"]) {
      if (doc.safety[field] !== false) errors.push(`${rel(filePath)} safety.${field} must be false`);
    }
  }
}

const inspection = docs.find(([filePath]) => filePath.endsWith("UAOS_V38_PROJECT_BUNDLE_INSPECTION.json"))?.[1];
if (!inspection) errors.push("Inspector output missing");
const score = docs.find(([filePath]) => filePath.endsWith("UAOS_V38_STYLE_REVIEW_SCORE.json"))?.[1];
if (!score) {
  errors.push("Scoring output missing");
} else {
  const requiredScores = ["structureCompletenessScore", "dspPlanCompletenessScore", "styleReviewCompletenessScore", "safetyScore", "arrangerReadinessScore", "humanReviewNeedScore"];
  for (const name of requiredScores) {
    const value = score.scores?.[name];
    if (typeof value !== "number" || value < 0 || value > 100) {
      errors.push(`Score ${name} must be a number between 0 and 100`);
    }
  }
  if (typeof score.scores?.safetyScore !== "number") errors.push("safetyScore missing");
}

const allFiles = walk(root);
const forbiddenExt = new Set([".sty", ".prf", ".prs", ".kst"]);
for (const filePath of allFiles) {
  const lower = filePath.toLowerCase();
  if (lower.includes(`${path.sep}.set${path.sep}`) || lower.endsWith(".set" + path.sep)) errors.push(`Forbidden SET folder: ${rel(filePath)}`);
  if (forbiddenExt.has(path.extname(lower))) errors.push(`Forbidden generated file type: ${rel(filePath)}`);
  if (path.basename(lower) === "app.jsx") errors.push(`Forbidden App.jsx: ${rel(filePath)}`);
}

const result = {
  status: errors.length ? "FAIL" : "PASS",
  checkedAt: new Date().toISOString(),
  generatedJsonChecked: jsonFiles.map(rel),
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
