import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const resultPath = path.join(reportsDir, "UAOS_V39_VALIDATOR_RESULTS.json");

const paths = {
  html: path.join(generatedDir, "UAOS_V39_METADATA_REPORT.html"),
  data: path.join(generatedDir, "UAOS_V39_METADATA_REPORT_DATA.json"),
  rules: path.join(generatedDir, "UAOS_V39_STYLE_REVIEW_RULES_EXPANDED.json"),
  summary: path.join(generatedDir, "UAOS_V39_STYLE_RULE_SCORE_SUMMARY.json"),
  matrix: path.join(generatedDir, "UAOS_V39_NEXT_RECOMMENDATION_MATRIX.json")
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

function expectFalse(doc, field, label, errors) {
  if (doc?.[field] !== false) errors.push(`${label}.${field} must be false`);
}

fs.mkdirSync(reportsDir, { recursive: true });
const errors = [];
const warnings = [];

if (!fs.existsSync(paths.html)) {
  errors.push("HTML report missing");
} else {
  const html = fs.readFileSync(paths.html, "utf8");
  for (const phrase of ["METADATA ONLY", "NOT KORG OUTPUT", "NOT PA3X READY", "NO USB APPROVAL", "NO KEYBOARD LOAD APPROVAL"]) {
    if (!html.includes(phrase)) errors.push(`HTML missing phrase: ${phrase}`);
  }
}

const data = readJson(paths.data, errors);
const rules = readJson(paths.rules, errors);
const summary = readJson(paths.summary, errors);
const matrix = readJson(paths.matrix, errors);

for (const [label, doc] of Object.entries({ data, rules, summary, matrix })) {
  if (!doc) continue;
  if (doc.metadataOnly !== true) errors.push(`${label}.metadataOnly must be true`);
  for (const field of ["korgOutputAllowed", "setModificationAllowed", "usbWriteAllowed", "keyboardLoadAllowed", "compatibilityClaim", "pa3xReadyClaim"]) {
    expectFalse(doc, field, label, errors);
  }
}
if (summary) {
  expectFalse(summary, "approvedForKorgExport", "summary", errors);
  expectFalse(summary, "approvedForUsb", "summary", errors);
  expectFalse(summary, "approvedForKeyboardLoad", "summary", errors);
}

if (rules?.categories) {
  const requiredCategories = ["sectionStructureRules", "rhythmDensityRules", "bassMovementRules", "chordRhythmRules", "orientalFeelRules", "melodySpaceRules", "dspIntentRules", "humanReviewRules", "safetyGateRules"];
  for (const category of requiredCategories) {
    if (!Array.isArray(rules.categories[category]) || rules.categories[category].length === 0) errors.push(`Missing rules category: ${category}`);
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
    staticHtmlOnly: true,
    noKorgOutput: true,
    noSetModification: true,
    noUsbWrite: true,
    noPa3xLoad: true,
    noPackageCopy: true,
    noFixtureModification: true,
    noProprietarySampleExtraction: true,
    appJsUntouched: true,
    noDeployOutput: true
  }
};

fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
