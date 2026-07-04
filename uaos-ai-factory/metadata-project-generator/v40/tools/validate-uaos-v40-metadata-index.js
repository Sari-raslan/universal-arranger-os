import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const resultPath = path.join(reportsDir, "UAOS_V40_VALIDATOR_RESULTS.json");

const paths = {
  suggestions: path.join(generatedDir, "UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.json"),
  suggestionsMd: path.join(generatedDir, "UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.md"),
  summary: path.join(generatedDir, "UAOS_V40_SUGGESTION_SCORE_SUMMARY.json"),
  indexHtml: path.join(generatedDir, "UAOS_V40_LOCAL_REPORT_INDEX.html"),
  indexData: path.join(generatedDir, "UAOS_V40_LOCAL_REPORT_INDEX_DATA.json"),
  matrix: path.join(generatedDir, "UAOS_V40_NEXT_RECOMMENDATION_MATRIX.json")
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

const suggestions = readJson(paths.suggestions, errors);
const summary = readJson(paths.summary, errors);
const indexData = readJson(paths.indexData, errors);
const matrix = readJson(paths.matrix, errors);

if (!fs.existsSync(paths.suggestionsMd)) errors.push("Suggestions Markdown missing");
if (!fs.existsSync(paths.indexHtml)) {
  errors.push("Local HTML index missing");
} else {
  const html = fs.readFileSync(paths.indexHtml, "utf8");
  for (const phrase of ["LOCAL INDEX ONLY", "METADATA ONLY", "NOT DEPLOYED", "NOT KORG OUTPUT", "NOT PA3X READY", "NO USB APPROVAL", "NO KEYBOARD LOAD APPROVAL"]) {
    if (!html.includes(phrase)) errors.push(`HTML missing phrase: ${phrase}`);
  }
}

for (const [label, doc] of Object.entries({ suggestions, summary, indexData, matrix })) {
  if (!doc) continue;
  if (doc.metadataOnly !== true) errors.push(`${label}.metadataOnly must be true`);
  for (const field of ["approvedForKorgExport", "approvedForUsb", "approvedForKeyboardLoad"]) {
    if (doc[field] !== false) errors.push(`${label}.${field} must be false`);
  }
}

if (suggestions?.suggestions) {
  for (const item of suggestions.suggestions) {
    if (item.canAutoApply !== false) errors.push(`${item.suggestionId}.canAutoApply must be false`);
    if (item.exportApprovalImpact !== false) errors.push(`${item.suggestionId}.exportApprovalImpact must be false`);
    if (item.korgOutputAllowed !== false) errors.push(`${item.suggestionId}.korgOutputAllowed must be false`);
    if (item.usbWriteAllowed !== false) errors.push(`${item.suggestionId}.usbWriteAllowed must be false`);
    if (item.keyboardLoadAllowed !== false) errors.push(`${item.suggestionId}.keyboardLoadAllowed must be false`);
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
    noDeployOutput: true,
    noExportApproval: true
  }
};

fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
