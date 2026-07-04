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
const resultPath = path.join(reportsDir, "UAOS_V49_VALIDATOR_RESULTS.json");

const paths = {
  portalHtml: path.join(generatedDir, "UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL.html"),
  portalData: path.join(generatedDir, "UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL_DATA.json"),
  freezePack: path.join(generatedDir, "UAOS_V49_METADATA_GOVERNANCE_FREEZE_PACK.json"),
  freezePackMd: path.join(generatedDir, "UAOS_V49_METADATA_GOVERNANCE_FREEZE_PACK.md"),
  freezeMatrix: path.join(generatedDir, "UAOS_V49_FREEZE_DECISION_MATRIX.json"),
  freezeMatrixMd: path.join(generatedDir, "UAOS_V49_FREEZE_DECISION_MATRIX.md"),
  nextMatrix: path.join(generatedDir, "UAOS_V49_NEXT_RECOMMENDATION_MATRIX.json")
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
const portalData = readJson(paths.portalData, errors);
const freezePack = readJson(paths.freezePack, errors);
readJson(paths.freezeMatrix, errors);
readJson(paths.nextMatrix, errors);

for (const filePath of [paths.portalHtml, paths.freezePackMd, paths.freezeMatrixMd]) {
  if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
}

if (fs.existsSync(paths.portalHtml)) {
  const html = fs.readFileSync(paths.portalHtml, "utf8");
  for (const phrase of [
    "LOCAL STATIC PORTAL ONLY",
    "METADATA ONLY",
    "NOT DEPLOYED",
    "NO APP.JSX",
    "NOT KORG OUTPUT",
    "NOT PA3X READY",
    "NO USB APPROVAL",
    "NO KEYBOARD LOAD APPROVAL",
    "NO EXPORT APPROVAL"
  ]) {
    if (!html.includes(phrase)) errors.push(`HTML missing phrase: ${phrase}`);
  }
}

if (freezePack) {
  const notFrozen = (freezePack.notFrozenScope || []).join(" | ").toLowerCase();
  if (!notFrozen.includes("korg writer")) errors.push("Freeze pack must say KORG writer is not frozen/approved");
  if (!notFrozen.includes("usb copy")) errors.push("Freeze pack must say USB copy is not approved");
  if (!notFrozen.includes("app.jsx")) errors.push("Freeze pack must say App.jsx integration is not performed");
  if (!notFrozen.includes("deploy")) errors.push("Freeze pack must say deploy is not performed");
  expectFalse(freezePack, "freezePack", "readyForKorgExport", errors);
  expectFalse(freezePack, "freezePack", "readyForUsb", errors);
  expectFalse(freezePack, "freezePack", "readyForKeyboardLoad", errors);
}
if (portalData) {
  expectFalse(portalData, "portalData", "readyForKorgExport", errors);
  expectFalse(portalData, "portalData", "readyForUsb", errors);
  expectFalse(portalData, "portalData", "readyForKeyboardLoad", errors);
}

for (const filePath of walkFiles(root)) {
  const lower = filePath.toLowerCase();
  if (lower.includes(`${path.sep}.set${path.sep}`) || lower.endsWith(".set")) errors.push(`Forbidden V49 SET folder/file: ${rel(filePath)}`);
  if (/\.(sty|prf|prs|kst)$/i.test(lower)) errors.push(`Forbidden V49 keyboard file: ${rel(filePath)}`);
  if (/\.(wav|aiff|aif|mp3|flac|ogg|mid|midi)$/i.test(lower)) errors.push(`Forbidden V49 audio/sample binary: ${rel(filePath)}`);
  if (path.basename(lower) === "app.jsx") errors.push(`Forbidden V49 App.jsx: ${rel(filePath)}`);
  if (lower.includes(`${path.sep}deploy${path.sep}`) || lower.includes(`${path.sep}public${path.sep}`) || lower.includes(`${path.sep}docs${path.sep}`)) {
    errors.push(`Forbidden V49 deploy/public/docs path: ${rel(filePath)}`);
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
    staticLocalPortalOnly: true,
    governanceFreezeDocumentationOnly: true,
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
  fs.writeFileSync(path.join(reportsDir, "UAOS_V49_QA_REPORT.md"), [
    "# UAOS V49 QA Report",
    "",
    "Local static review portal created: YES",
    "Governance freeze pack created: YES",
    "Freeze decision matrix created: YES",
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
  fs.writeFileSync(path.join(reportsDir, "UAOS_V49_FINAL_SEAL.md"), [
    "# UAOS V49 Final Seal",
    "",
    "Status: PASS",
    "",
    "V49 created a local static review portal, metadata governance freeze pack, freeze decision matrix, QA report, owner dashboard, and validator result.",
    "",
    "Safety: metadata-only, static local portal only, governance/freeze documentation only, no real apply, no source project mutation, no KORG output, no SET/STY/PRF/PRS/KST, no audio/sample binaries, no USB write, no keyboard load, no fixture modification, no App.jsx, no deploy, no export approval."
  ].join("\n") + "\n", "utf8");
}

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
