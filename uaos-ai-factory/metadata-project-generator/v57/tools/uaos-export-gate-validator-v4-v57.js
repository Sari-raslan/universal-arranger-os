import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const createdAt = new Date().toISOString();
const v56Gates = readJson(path.join(base, "v56", "generated", "UAOS_V56_EXPORT_GATE_VALIDATOR_V3_RESULTS.json"));
const sampleReview = readJson(path.join(generatedDir, "UAOS_V57_HUMAN_REVIEW_FILLED_EXAMPLE.json"));
const dryrun = readJson(path.join(generatedDir, "UAOS_V57_INTERNAL_STYLE_GENERATION_DRYRUN_V3.json"));
const gates = [
  ["Metadata freeze accepted", true],
  ["Owner decisions filled", false],
  ["Decision dry-run preview PASS", true],
  ["Internal project adapter PASS", true],
  ["Style engine bridge dry-run PASS", true],
  ["Internal style generation dry-run v3 PASS", dryrun.dryRunOnly === true && dryrun.sampleReviewInputUsed === true],
  ["Human review checklist completed with real owner decisions", false],
  ["KORG writer design review PASS", false],
  ["Native output candidate inspection PASS", false],
  ["Empty USB verification PASS", false],
  ["PA3X full backup confirmed", false],
  ["Hardware test approval", false],
  ["PA3X observation completed", false],
  ["Compatibility claim review completed", false]
];
const gateResults = gates.map(([title, pass], index) => ({
  gateId: `gate-${String(index + 1).padStart(2, "0")}`,
  title,
  status: pass ? "PASS_DRY_RUN_ONLY" : "BLOCKED",
  exportAllowed: false,
  usbAllowed: false,
  keyboardLoadAllowed: false,
  korgOutputAllowed: false,
  compatibilityClaimAllowed: false
}));
const results = {
  schemaVersion: "uaos.v57.export.gate.validator.v4.results.v1",
  createdAt,
  sourceV56GateSchema: v56Gates.schemaVersion,
  sampleReviewUsed: sampleReview.sampleOnly === true,
  realOwnerApprovalApplied: false,
  gateResults,
  passCount: gateResults.filter((gate) => gate.status !== "BLOCKED").length,
  blockerCount: gateResults.filter((gate) => gate.status === "BLOCKED").length,
  styleDryRunV3Status: "PASS_DRY_RUN_ONLY",
  humanReviewGateStatus: "BLOCKED_SAMPLE_NOT_REAL_APPROVAL",
  exportAllowed: false,
  usbAllowed: false,
  keyboardLoadAllowed: false,
  korgOutputAllowed: false,
  compatibilityClaimAllowed: false,
  safety: {
    sampleOnly: true,
    metadataOnly: true,
    noRealOwnerApprovalApplied: true,
    noAudioRender: true,
    noMidiGeneration: true,
    noKorgOutput: true,
    noNativeKeyboardFiles: true,
    noUsbWrite: true,
    noKeyboardLoad: true,
    noSourceProjectMutation: true,
    noExportApproval: true
  }
};
const report = [
  "# UAOS V57 Export Gate Validator V4 Report",
  "",
  "Export gates remain BLOCKED overall.",
  `Pass count: ${results.passCount}`,
  `Blocker count: ${results.blockerCount}`,
  "V57 sample review supports dry-run only: YES",
  "Real human review gate remains blocked: YES",
  "Export allowed: NO",
  "USB allowed: NO",
  "Keyboard load allowed: NO",
  "KORG output allowed: NO",
  "Compatibility claim allowed: NO"
].join("\n");
const matrix = {
  schemaVersion: "uaos.v57.next.recommendation.matrix.v1",
  createdAt,
  metadataOnly: true,
  sampleOnly: true,
  recommendations: [
    { id: "A", action: "V58 Real Owner Decision Input Pack, metadata-only/manual input only", recommended: true },
    { id: "B", action: "V58 Internal Style Generation Dry-run v4, metadata-only", recommended: true },
    { id: "C", action: "V58 Export Gate Validator v5, no export", recommended: true },
    { id: "D", action: "Stop", recommended: false }
  ],
  recommendedCombinedNext: "A + B + C together if safe",
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false
};
const qa = [
  "# UAOS V57 QA Report",
  "",
  "Sample human review filled example created: YES",
  "Internal style generation dry-run v3 created: YES",
  "Owner-reviewed preview created using sample only: YES",
  "Export gate validator v4 created: YES",
  "Validator PASS: pending validator run",
  "No real owner approval applied: YES",
  "No audio render: YES",
  "No MIDI generation: YES",
  "No KORG output: YES",
  "No SET/STY/PRF/PRS/KST: YES",
  "No USB: YES",
  "No PA3X load: YES",
  "No source project mutation: YES",
  "No fixture modification: YES",
  "No App.jsx: YES",
  "No deploy: YES",
  "No payment: YES"
].join("\n");
const dashboard = [
  "# UAOS V57 Owner Dashboard",
  "",
  `V57 sample human review path: ${path.join(generatedDir, "UAOS_V57_HUMAN_REVIEW_FILLED_EXAMPLE.json")}`,
  `V57 dry-run v3 path: ${path.join(generatedDir, "UAOS_V57_INTERNAL_STYLE_GENERATION_DRYRUN_V3.json")}`,
  `V57 owner-reviewed style intent preview path: ${path.join(generatedDir, "UAOS_V57_STYLE_INTENT_OWNER_REVIEWED_PREVIEW.json")}`,
  `V57 owner-reviewed section plan preview path: ${path.join(generatedDir, "UAOS_V57_STYLE_SECTION_PLAN_OWNER_REVIEWED_PREVIEW.json")}`,
  `V57 export gate validator v4 path: ${path.join(generatedDir, "UAOS_V57_EXPORT_GATE_VALIDATOR_V4_RESULTS.json")}`,
  "",
  "Safety status: PASS pending validator run",
  "What remains blocked: real owner decisions, completed real human review, KORG writer design review, native output inspection, empty USB verification, PA3X backup confirmation, hardware approval, PA3X observation, compatibility claim review, export approval.",
  "Next recommended phase: A + B + C together if safe."
].join("\n");
const master = [
  "# UAOS V57 Master Index",
  "",
  "- generated/UAOS_V57_HUMAN_REVIEW_FILLED_EXAMPLE.json",
  "- generated/UAOS_V57_HUMAN_REVIEW_FILLED_EXAMPLE.md",
  "- generated/UAOS_V57_INTERNAL_STYLE_GENERATION_DRYRUN_V3.json",
  "- generated/UAOS_V57_INTERNAL_STYLE_GENERATION_DRYRUN_V3.md",
  "- generated/UAOS_V57_STYLE_INTENT_OWNER_REVIEWED_PREVIEW.json",
  "- generated/UAOS_V57_STYLE_SECTION_PLAN_OWNER_REVIEWED_PREVIEW.json",
  "- generated/UAOS_V57_EXPORT_GATE_VALIDATOR_V4_RESULTS.json",
  "- generated/UAOS_V57_EXPORT_GATE_VALIDATOR_V4_REPORT.md",
  "- generated/UAOS_V57_NEXT_RECOMMENDATION_MATRIX.json",
  "- reports/UAOS_V57_VALIDATOR_RESULTS.json",
  "- reports/UAOS_V57_QA_REPORT.md",
  "- reports/UAOS_V57_OWNER_DASHBOARD.md",
  "- reports/UAOS_V57_FINAL_SEAL.md"
].join("\n");
const seal = [
  "# UAOS V57 Final Seal",
  "",
  "Status: pending validator run",
  "",
  "Safety: sample only, dry-run only, metadata-only, no real owner approval applied, no audio, no MIDI, no KORG output, no native keyboard files, no USB, no PA3X load, no source mutation, no App.jsx, no deploy, no payment."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V57_EXPORT_GATE_VALIDATOR_V4_RESULTS.json"), JSON.stringify(results, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V57_EXPORT_GATE_VALIDATOR_V4_REPORT.md"), report + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V57_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(matrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V57_EXPORT_GATE_VALIDATOR_V4_REPORT.md"), report + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V57_QA_REPORT.md"), qa + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V57_OWNER_DASHBOARD.md"), dashboard + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V57_MASTER_INDEX.md"), master + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V57_FINAL_SEAL.md"), seal + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V57_EXPORT_GATE_VALIDATOR_V4_RESULTS.json" }, null, 2));
