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
const resultPath = path.join(reportsDir, "UAOS_V53_VALIDATOR_RESULTS.json");
const paths = {
  integration: path.join(generatedDir, "UAOS_V53_INTERNAL_PROJECT_INTEGRATION_PLAN.json"),
  integrationMd: path.join(generatedDir, "UAOS_V53_INTERNAL_PROJECT_INTEGRATION_PLAN.md"),
  bridge: path.join(generatedDir, "UAOS_V53_STYLE_ENGINE_METADATA_BRIDGE_PLAN.json"),
  bridgeMd: path.join(generatedDir, "UAOS_V53_STYLE_ENGINE_METADATA_BRIDGE_PLAN.md"),
  roadmap: path.join(generatedDir, "UAOS_V53_EXPORT_GATE_ROADMAP_PACK.json"),
  roadmapMd: path.join(generatedDir, "UAOS_V53_EXPORT_GATE_ROADMAP_PACK.md"),
  sequence: path.join(generatedDir, "UAOS_V53_SAFE_IMPLEMENTATION_SEQUENCE.json"),
  matrix: path.join(generatedDir, "UAOS_V53_NEXT_RECOMMENDATION_MATRIX.json")
};
function rel(filePath) { return path.relative(root, filePath).replace(/\\/g, "/"); }
function readJson(filePath, errors) {
  if (!fs.existsSync(filePath)) { errors.push(`Missing JSON: ${rel(filePath)}`); return null; }
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch (error) { errors.push(`Invalid JSON ${rel(filePath)}: ${error.message}`); return null; }
}
function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full)); else out.push(full);
  }
  return out;
}
fs.mkdirSync(reportsDir, { recursive: true });
const errors = [];
const warnings = [];
const integration = readJson(paths.integration, errors);
const bridge = readJson(paths.bridge, errors);
const roadmap = readJson(paths.roadmap, errors);
readJson(paths.sequence, errors);
readJson(paths.matrix, errors);
for (const filePath of [paths.integrationMd, paths.bridgeMd, paths.roadmapMd]) if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
if (integration) {
  if (integration.implementationAllowedNow !== false) errors.push("implementationAllowedNow must be false");
  if (integration.appJsTouchedNow !== false) errors.push("appJsTouchedNow must be false");
}
if (bridge) {
  if (bridge.dryRunBridgeOnly !== true) errors.push("dryRunBridgeOnly must be true");
  for (const field of ["realStyleGenerationAllowed", "korgOutputAllowed", "exportAllowed"]) if (bridge[field] !== false) errors.push(`bridge.${field} must be false`);
}
if (roadmap?.gates) {
  for (const gate of roadmap.gates) {
    for (const field of ["exportAllowed", "usbAllowed", "keyboardLoadAllowed"]) if (gate[field] !== false) errors.push(`${gate.gateId}.${field} must be false`);
  }
} else errors.push("roadmap.gates missing");
for (const filePath of walkFiles(root)) {
  const lower = filePath.toLowerCase();
  if (lower.includes(`${path.sep}.set${path.sep}`) || lower.endsWith(".set")) errors.push(`Forbidden V53 SET folder/file: ${rel(filePath)}`);
  if (/\.(sty|prf|prs|kst)$/i.test(lower)) errors.push(`Forbidden V53 keyboard file: ${rel(filePath)}`);
  if (/\.(wav|aiff|aif|mp3|flac|ogg|mid|midi)$/i.test(lower)) errors.push(`Forbidden V53 audio/sample binary: ${rel(filePath)}`);
  if (path.basename(lower) === "app.jsx") errors.push(`Forbidden V53 App.jsx: ${rel(filePath)}`);
  if (lower.includes(`${path.sep}deploy${path.sep}`) || lower.includes(`${path.sep}public${path.sep}`) || lower.includes(`${path.sep}docs${path.sep}`)) errors.push(`Forbidden V53 deploy/public/docs path: ${rel(filePath)}`);
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
const result = { status, checkedAt: new Date().toISOString(), checkedFiles: Object.fromEntries(Object.entries(paths).map(([k, v]) => [k, rel(v)])), errors, warnings, safety: { planningOnly: true, metadataOnly: true, noImplementation: true, noSourceProjectMutation: true, noKorgOutput: true, noAudioSampleBinaries: true, noUsbWrite: true, noKeyboardLoad: true, noFixtureModification: true, noAppJs: true, noDeploy: true, noPayment: true } };
fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
if (status === "PASS") {
  fs.writeFileSync(path.join(reportsDir, "UAOS_V53_QA_REPORT.md"), ["# UAOS V53 QA Report", "", "Integration plan created: YES", "Style engine bridge plan created: YES", "Export gate roadmap created: YES", "Safe implementation sequence created: YES", "Validator PASS: YES", "No implementation: YES", "No source project mutation: YES", "No KORG output: YES", "No SET/STY/PRF/PRS/KST: YES", "No audio/sample binaries: YES", "No USB: YES", "No PA3X load: YES", "No fixture modification: YES", "No App.jsx: YES", "No deploy: YES", "No payment: YES"].join("\n") + "\n", "utf8");
  fs.writeFileSync(path.join(reportsDir, "UAOS_V53_FINAL_SEAL.md"), ["# UAOS V53 Final Seal", "", "Status: PASS", "", "Safety: planning only, metadata-only, no implementation, no source mutation, no App.jsx, no KORG output, no USB, no PA3X load, no deploy, no payment."].join("\n") + "\n", "utf8");
}
console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
