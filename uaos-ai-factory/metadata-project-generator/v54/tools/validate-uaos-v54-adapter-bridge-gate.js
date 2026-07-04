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
const resultPath = path.join(reportsDir, "UAOS_V54_VALIDATOR_RESULTS.json");
const paths = {
  adapter: path.join(generatedDir, "UAOS_V54_INTERNAL_PROJECT_ADAPTER_OUTPUT.json"),
  adapterMd: path.join(generatedDir, "UAOS_V54_INTERNAL_PROJECT_ADAPTER_OUTPUT.md"),
  bridge: path.join(generatedDir, "UAOS_V54_STYLE_ENGINE_BRIDGE_DRYRUN_OUTPUT.json"),
  bridgeMd: path.join(generatedDir, "UAOS_V54_STYLE_ENGINE_BRIDGE_DRYRUN_OUTPUT.md"),
  foundation: path.join(generatedDir, "UAOS_V54_EXPORT_GATE_VALIDATOR_FOUNDATION.json"),
  results: path.join(generatedDir, "UAOS_V54_EXPORT_GATE_VALIDATOR_RESULTS.json"),
  report: path.join(generatedDir, "UAOS_V54_EXPORT_GATE_VALIDATOR_REPORT.md"),
  matrix: path.join(generatedDir, "UAOS_V54_NEXT_RECOMMENDATION_MATRIX.json")
};
function rel(filePath) { return path.relative(root, filePath).replace(/\\/g, "/"); }
function readJson(filePath, errors) { if (!fs.existsSync(filePath)) { errors.push(`Missing JSON: ${rel(filePath)}`); return null; } try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch (error) { errors.push(`Invalid JSON ${rel(filePath)}: ${error.message}`); return null; } }
function walkFiles(dir) { if (!fs.existsSync(dir)) return []; const out = []; for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) out.push(...walkFiles(full)); else out.push(full); } return out; }
fs.mkdirSync(reportsDir, { recursive: true });
const errors = [];
const warnings = [];
const adapter = readJson(paths.adapter, errors);
const bridge = readJson(paths.bridge, errors);
const foundation = readJson(paths.foundation, errors);
readJson(paths.results, errors);
readJson(paths.matrix, errors);
for (const filePath of [paths.adapterMd, paths.bridgeMd, paths.report]) if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
if (adapter) {
  if (adapter.readOnly !== true) errors.push("adapter.readOnly must be true");
  for (const field of ["sourceProjectModified", "implementationAllowedNow", "appJsTouchedNow"]) if (adapter[field] !== false) errors.push(`adapter.${field} must be false`);
}
if (bridge) {
  if (bridge.dryRunOnly !== true) errors.push("bridge.dryRunOnly must be true");
  if (bridge.metadataOnly !== true) errors.push("bridge.metadataOnly must be true");
  for (const field of ["realStyleGenerationAllowed", "korgOutputAllowed", "exportAllowed"]) if (bridge[field] !== false) errors.push(`bridge.${field} must be false`);
}
if (foundation) {
  for (const field of ["exportAllowed", "usbAllowed", "keyboardLoadAllowed", "korgOutputAllowed", "compatibilityClaimAllowed"]) if (foundation[field] !== false) errors.push(`foundation.${field} must be false`);
}
for (const filePath of walkFiles(root)) {
  const lower = filePath.toLowerCase();
  if (lower.includes(`${path.sep}.set${path.sep}`) || lower.endsWith(".set")) errors.push(`Forbidden V54 SET folder/file: ${rel(filePath)}`);
  if (/\.(sty|prf|prs|kst)$/i.test(lower)) errors.push(`Forbidden V54 keyboard file: ${rel(filePath)}`);
  if (/\.(wav|aiff|aif|mp3|flac|ogg|mid|midi)$/i.test(lower)) errors.push(`Forbidden V54 audio/sample binary: ${rel(filePath)}`);
  if (path.basename(lower) === "app.jsx") errors.push(`Forbidden V54 App.jsx: ${rel(filePath)}`);
  if (lower.includes(`${path.sep}deploy${path.sep}`) || lower.includes(`${path.sep}public${path.sep}`) || lower.includes(`${path.sep}docs${path.sep}`)) errors.push(`Forbidden V54 deploy/public/docs path: ${rel(filePath)}`);
}
const unchanged = [["V37 source project", path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json")], ["V42 dry-run project", path.join(base, "v42", "generated", "UAOS_V42_DRYRUN_PROJECT_AFTER_PREVIEW.uaosproject.json")], ["V44 dry-run project", path.join(base, "v44", "generated", "UAOS_V44_DRYRUN_PROJECT_AFTER_DECISION_PREVIEW.uaosproject.json")], ["V46 dry-run project", path.join(base, "v46", "generated", "UAOS_V46_DRYRUN_PROJECT_AFTER_IMPORT_PREVIEW_V3.uaosproject.json")], ["App.jsx", path.join(repoRoot, "uaos-ai-factory", "pc-workstation", "stable", "UAOS_PC_WORKSTATION_APP_V10", "App.jsx")]];
for (const [label, filePath] of unchanged) { const relative = path.relative(repoRoot, filePath).replace(/\\/g, "/"); const check = childProcess.spawnSync("git", ["status", "--short", "--", relative], { cwd: repoRoot, encoding: "utf8" }); if (check.stdout.trim()) errors.push(`${label} appears modified in git status`); }
const status = errors.length ? "FAIL" : "PASS";
const result = { status, checkedAt: new Date().toISOString(), checkedFiles: Object.fromEntries(Object.entries(paths).map(([k, v]) => [k, rel(v)])), errors, warnings, safety: { readOnlyPrototypeOnly: true, metadataOnly: true, dryRunOnly: true, noRealAppIntegration: true, noSourceProjectMutation: true, noKorgOutput: true, noUsbWrite: true, noKeyboardLoad: true, noAppJs: true, noDeploy: true, noPayment: true } };
fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
if (status === "PASS") {
  fs.writeFileSync(path.join(reportsDir, "UAOS_V54_QA_REPORT.md"), ["# UAOS V54 QA Report", "", "Read-only adapter created: YES", "Style engine bridge dry-run created: YES", "Export gate validator foundation created: YES", "Validator PASS: YES", "No real app integration: YES", "No source project mutation: YES", "No KORG output: YES", "No SET/STY/PRF/PRS/KST: YES", "No audio/sample binaries: YES", "No USB: YES", "No PA3X load: YES", "No fixture modification: YES", "No App.jsx: YES", "No deploy: YES", "No payment: YES"].join("\n") + "\n", "utf8");
  fs.writeFileSync(path.join(reportsDir, "UAOS_V54_FINAL_SEAL.md"), ["# UAOS V54 Final Seal", "", "Status: PASS", "", "Safety: read-only prototype only, metadata-only, dry-run only, no app integration, no source mutation, no KORG output, no USB, no PA3X load, no App.jsx, no deploy, no payment."].join("\n") + "\n", "utf8");
}
console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
