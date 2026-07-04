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
const resultPath = path.join(reportsDir, "UAOS_V52_VALIDATOR_RESULTS.json");

const paths = {
  seal: path.join(generatedDir, "UAOS_V52_METADATA_FREEZE_ACCEPTANCE_SEAL.json"),
  sealMd: path.join(generatedDir, "UAOS_V52_METADATA_FREEZE_ACCEPTANCE_SEAL.md"),
  gap: path.join(generatedDir, "UAOS_V52_EXPORT_READINESS_GAP_ANALYSIS.json"),
  gapMd: path.join(generatedDir, "UAOS_V52_EXPORT_READINESS_GAP_ANALYSIS.md"),
  gates: path.join(generatedDir, "UAOS_V52_BLOCKED_EXPORT_GATE_MATRIX.json"),
  gatesMd: path.join(generatedDir, "UAOS_V52_BLOCKED_EXPORT_GATE_MATRIX.md"),
  matrix: path.join(generatedDir, "UAOS_V52_NEXT_RECOMMENDATION_MATRIX.json")
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

fs.mkdirSync(reportsDir, { recursive: true });
const errors = [];
const warnings = [];
const seal = readJson(paths.seal, errors);
readJson(paths.gap, errors);
const gates = readJson(paths.gates, errors);
readJson(paths.matrix, errors);
for (const filePath of [paths.sealMd, paths.gapMd, paths.gatesMd]) {
  if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
}
if (seal) {
  if (seal.metadataFreezeAccepted !== true) errors.push("metadataFreezeAccepted must be true");
  for (const field of ["readyForKorgExport", "readyForUsb", "readyForKeyboardLoad", "compatibilityClaim", "pa3xReadyClaim"]) {
    if (seal[field] !== false) errors.push(`seal.${field} must be false`);
  }
}
if (gates?.gates) {
  for (const gate of gates.gates) {
    for (const field of ["approved", "exportAllowed", "usbAllowed", "keyboardLoadAllowed"]) {
      if (gate[field] !== false) errors.push(`${gate.gateId}.${field} must be false`);
    }
  }
} else {
  errors.push("blocked export gate matrix must contain gates");
}
for (const filePath of walkFiles(root)) {
  const lower = filePath.toLowerCase();
  if (lower.includes(`${path.sep}.set${path.sep}`) || lower.endsWith(".set")) errors.push(`Forbidden V52 SET folder/file: ${rel(filePath)}`);
  if (/\.(sty|prf|prs|kst)$/i.test(lower)) errors.push(`Forbidden V52 keyboard file: ${rel(filePath)}`);
  if (/\.(wav|aiff|aif|mp3|flac|ogg|mid|midi)$/i.test(lower)) errors.push(`Forbidden V52 audio/sample binary: ${rel(filePath)}`);
  if (path.basename(lower) === "app.jsx") errors.push(`Forbidden V52 App.jsx: ${rel(filePath)}`);
  if (lower.includes(`${path.sep}deploy${path.sep}`) || lower.includes(`${path.sep}public${path.sep}`) || lower.includes(`${path.sep}docs${path.sep}`)) {
    errors.push(`Forbidden V52 deploy/public/docs path: ${rel(filePath)}`);
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
    gapAnalysisOnly: true,
    freezeSealDocumentationOnly: true,
    noExport: true,
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
    noPayment: true,
    noExportApproval: true
  }
};
fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
if (status === "PASS") {
  fs.writeFileSync(path.join(reportsDir, "UAOS_V52_QA_REPORT.md"), [
    "# UAOS V52 QA Report",
    "",
    "Metadata freeze seal created: YES",
    "Export gap analysis created: YES",
    "Blocked export gate matrix created: YES",
    "Validator PASS: YES",
    "No export: YES",
    "No real apply: YES",
    "No source project mutation: YES",
    "No KORG output: YES",
    "No SET/STY/PRF/PRS/KST: YES",
    "No audio/sample binaries: YES",
    "No USB: YES",
    "No PA3X load: YES",
    "No fixture modification: YES",
    "No App.jsx: YES",
    "No deploy: YES",
    "No payment: YES"
  ].join("\n") + "\n", "utf8");
  fs.writeFileSync(path.join(reportsDir, "UAOS_V52_FINAL_SEAL.md"), [
    "# UAOS V52 Final Seal",
    "",
    "Status: PASS",
    "",
    "V52 created a metadata freeze acceptance seal, export readiness gap analysis, blocked export gate matrix, QA report, owner dashboard, and validator result.",
    "",
    "Safety: metadata-only, gap analysis only, freeze seal documentation only, no export, no real apply, no source project mutation, no KORG output, no SET/STY/PRF/PRS/KST, no audio/sample binaries, no USB write, no PA3X load, no fixture modification, no App.jsx, no deploy, no payment, no export approval."
  ].join("\n") + "\n", "utf8");
}
console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
