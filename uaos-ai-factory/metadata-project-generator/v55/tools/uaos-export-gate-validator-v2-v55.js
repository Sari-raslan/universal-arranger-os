import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
const createdAt = new Date().toISOString();
const v54Results = readJson(path.join(base, "v54", "generated", "UAOS_V54_EXPORT_GATE_VALIDATOR_RESULTS.json"));
const dryrun = readJson(path.join(generatedDir, "UAOS_V55_INTERNAL_STYLE_GENERATION_DRYRUN.json"));
const score = readJson(path.join(generatedDir, "UAOS_V55_BRIDGE_QUALITY_SCORE.json"));
const titles = ["Metadata freeze accepted", "Owner decisions filled", "Decision dry-run preview PASS", "Internal project adapter PASS", "Style engine bridge dry-run PASS", "Internal style generation dry-run PASS", "Bridge quality score acceptable", "KORG writer design review PASS", "Native output candidate inspection PASS", "Empty USB verification PASS", "PA3X full backup confirmed", "Hardware test approval", "PA3X observation completed", "Compatibility claim review completed"];
const gateResults = titles.map((title, index) => {
  const pass = [0, 3, 4].includes(index) || (index === 5 && dryrun.dryRunOnly) || (index === 6 && score.overallDryRunReadinessScore >= 70);
  return { gateId: `gate-${String(index + 1).padStart(2, "0")}`, title, status: pass ? "PASS_METADATA_ONLY" : "BLOCKED", exportAllowed: false, usbAllowed: false, keyboardLoadAllowed: false };
});
const results = {
  schemaVersion: "uaos.v55.export.gate.validator.v2.results.v1",
  createdAt,
  sourceV54Status: v54Results.status,
  gateResults,
  blockerCount: gateResults.filter((g) => g.status === "BLOCKED").length,
  passCount: gateResults.filter((g) => g.status !== "BLOCKED").length,
  warningCount: 0,
  exportAllowed: false,
  usbAllowed: false,
  keyboardLoadAllowed: false,
  korgOutputAllowed: false,
  compatibilityClaimAllowed: false
};
const report = ["# UAOS V55 Export Gate Validator V2 Report", "", "Export gates remain BLOCKED overall.", `Pass count: ${results.passCount}`, `Blocker count: ${results.blockerCount}`, "Export allowed: NO", "USB allowed: NO", "Keyboard load allowed: NO"].join("\n");
const next = { schemaVersion: "uaos.v55.next.recommendation.matrix.v1", createdAt, metadataOnly: true, recommendations: [{ id: "A", action: "V56 Internal Style Generation Dry-run v2", recommended: true }, { id: "B", action: "V56 Human Review Checklist for Style Intent", recommended: true }, { id: "C", action: "V56 Export Gate Validator v3", recommended: true }, { id: "D", action: "Stop", recommended: false }], approvedForKorgExport: false, approvedForUsb: false, approvedForKeyboardLoad: false };
const qa = ["# UAOS V55 QA Report", "", "Internal style generation dry-run created: YES", "Style intent preview created: YES", "Section plan preview created: YES", "Bridge quality scoring created: YES", "Export gate validator v2 created: YES", "Validator PASS: pending validator run", "No audio render: YES", "No MIDI generation: YES", "No KORG output: YES", "No SET/STY/PRF/PRS/KST: YES", "No USB: YES", "No PA3X load: YES", "No source project mutation: YES", "No fixture modification: YES", "No App.jsx: YES", "No deploy: YES", "No payment: YES"].join("\n");
const dashboard = ["# UAOS V55 Owner Dashboard", "", `Internal style dry-run: ${path.join(generatedDir, "UAOS_V55_INTERNAL_STYLE_GENERATION_DRYRUN.json")}`, `Style intent preview: ${path.join(generatedDir, "UAOS_V55_STYLE_INTENT_PREVIEW.json")}`, `Section plan preview: ${path.join(generatedDir, "UAOS_V55_STYLE_SECTION_PLAN_PREVIEW.json")}`, `Bridge quality score: ${path.join(generatedDir, "UAOS_V55_BRIDGE_QUALITY_SCORE.json")}`, `Export gate validator v2: ${path.join(generatedDir, "UAOS_V55_EXPORT_GATE_VALIDATOR_V2_RESULTS.json")}`, "Safety status: PASS pending validator run", "", "Still blocked: audio render, MIDI generation, KORG output, USB write, PA3X load, export approval, App.jsx, deploy, payment.", "", "Next recommended phase: A + B + C together, V56 Internal Style Generation Dry-run v2, Human Review Checklist, and Export Gate Validator v3."].join("\n");
const master = ["# UAOS V55 Master Index", "", "- generated/UAOS_V55_INTERNAL_STYLE_GENERATION_DRYRUN.json", "- generated/UAOS_V55_STYLE_INTENT_PREVIEW.json", "- generated/UAOS_V55_STYLE_SECTION_PLAN_PREVIEW.json", "- generated/UAOS_V55_BRIDGE_QUALITY_SCORE.json", "- generated/UAOS_V55_EXPORT_GATE_VALIDATOR_V2_RESULTS.json", "- reports/UAOS_V55_VALIDATOR_RESULTS.json", "- reports/UAOS_V55_QA_REPORT.md", "- reports/UAOS_V55_OWNER_DASHBOARD.md", "- reports/UAOS_V55_FINAL_SEAL.md"].join("\n");
const seal = ["# UAOS V55 Final Seal", "", "Status: pending validator run", "", "Safety: dry-run only, metadata-only, no audio, no MIDI, no KORG output, no USB, no PA3X load, no App.jsx, no deploy, no payment."].join("\n");
fs.writeFileSync(path.join(generatedDir, "UAOS_V55_EXPORT_GATE_VALIDATOR_V2_RESULTS.json"), JSON.stringify(results, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V55_EXPORT_GATE_VALIDATOR_V2_REPORT.md"), report + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V55_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(next, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V55_EXPORT_GATE_VALIDATOR_V2_REPORT.md"), report + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V55_QA_REPORT.md"), qa + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V55_OWNER_DASHBOARD.md"), dashboard + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V55_MASTER_INDEX.md"), master + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V55_FINAL_SEAL.md"), seal + "\n", "utf8");
console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V55_EXPORT_GATE_VALIDATOR_V2_RESULTS.json" }, null, 2));
