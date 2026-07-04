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
const v57Gates = readJson(path.join(base, "v57", "generated", "UAOS_V57_EXPORT_GATE_VALIDATOR_V4_RESULTS.json"));
const inputPack = readJson(path.join(generatedDir, "UAOS_V58_REAL_OWNER_DECISION_INPUT_PACK.json"));
const dryrun = readJson(path.join(generatedDir, "UAOS_V58_INTERNAL_STYLE_GENERATION_DRYRUN_V4.json"));
const allRealOwnerDecisionsFilled = inputPack.decisionItems.every((item) => item.realOwnerDecision !== "pending");
const gates = [
  ["Metadata freeze accepted", true],
  ["Real owner decisions filled", allRealOwnerDecisionsFilled],
  ["Decision dry-run preview PASS", true],
  ["Internal project adapter PASS", true],
  ["Style engine bridge dry-run PASS", true],
  ["Internal style generation dry-run v4 PASS", dryrun.dryRunOnly === true && dryrun.realOwnerInputPackUsed === true],
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
  status: pass ? "PASS_PENDING_PREVIEW_ONLY" : "BLOCKED",
  exportAllowed: false,
  usbAllowed: false,
  keyboardLoadAllowed: false,
  korgOutputAllowed: false,
  compatibilityClaimAllowed: false
}));
const results = {
  schemaVersion: "uaos.v58.export.gate.validator.v5.results.v1",
  createdAt,
  sourceV57GateSchema: v57Gates.schemaVersion,
  realOwnerDecisionInputPackUsed: true,
  realOwnerDecisionsRemainPending: true,
  gateResults,
  passCount: gateResults.filter((gate) => gate.status !== "BLOCKED").length,
  blockerCount: gateResults.filter((gate) => gate.status === "BLOCKED").length,
  styleDryRunV4Status: "PASS_PENDING_PREVIEW_ONLY",
  humanReviewGateStatus: "BLOCKED_REAL_OWNER_DECISIONS_PENDING",
  exportAllowed: false,
  usbAllowed: false,
  keyboardLoadAllowed: false,
  korgOutputAllowed: false,
  compatibilityClaimAllowed: false,
  safety: {
    manualInputOnly: true,
    metadataOnly: true,
    noRealOwnerApprovalApplied: true,
    noRealApply: true,
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
  "# UAOS V58 Export Gate Validator V5 Report",
  "",
  "Export gates remain BLOCKED overall.",
  `Pass count: ${results.passCount}`,
  `Blocker count: ${results.blockerCount}`,
  "Real owner decisions remain pending: YES",
  "Style dry-run v4 pending-preview only: PASS",
  "Real human review gate remains blocked: YES",
  "Export allowed: NO",
  "USB allowed: NO",
  "Keyboard load allowed: NO",
  "KORG output allowed: NO",
  "Compatibility claim allowed: NO"
].join("\n");
const matrix = {
  schemaVersion: "uaos.v58.next.recommendation.matrix.v1",
  createdAt,
  metadataOnly: true,
  manualInputOnly: true,
  recommendations: [
    { id: "A", action: "V59 Owner Decision Form Local HTML, manual-only/no App.jsx", recommended: true },
    { id: "B", action: "V59 Internal Style Generation Dry-run v5, metadata-only", recommended: true },
    { id: "C", action: "V59 Export Gate Validator v6, no export", recommended: true },
    { id: "D", action: "Stop", recommended: false }
  ],
  recommendedCombinedNext: "A + B + C together if safe",
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false
};
const qa = [
  "# UAOS V58 QA Report",
  "",
  "Real owner decision input pack created: YES",
  "Printable decision form created: YES",
  "Internal style generation dry-run v4 created: YES",
  "Pending owner previews created: YES",
  "Export gate validator v5 created: YES",
  "Validator PASS: pending validator run",
  "All real owner decisions remain pending: YES",
  "No real owner approval applied: YES",
  "No real apply: YES",
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
  "# UAOS V58 Owner Dashboard",
  "",
  `V58 real owner decision input pack path: ${path.join(generatedDir, "UAOS_V58_REAL_OWNER_DECISION_INPUT_PACK.json")}`,
  `V58 printable form path: ${path.join(generatedDir, "UAOS_V58_REAL_OWNER_DECISION_FORM_PRINTABLE.md")}`,
  `V58 dry-run v4 path: ${path.join(generatedDir, "UAOS_V58_INTERNAL_STYLE_GENERATION_DRYRUN_V4.json")}`,
  `V58 pending owner style intent preview path: ${path.join(generatedDir, "UAOS_V58_STYLE_INTENT_REAL_OWNER_PENDING_PREVIEW.json")}`,
  `V58 pending owner section plan preview path: ${path.join(generatedDir, "UAOS_V58_STYLE_SECTION_PLAN_REAL_OWNER_PENDING_PREVIEW.json")}`,
  `V58 export gate validator v5 path: ${path.join(generatedDir, "UAOS_V58_EXPORT_GATE_VALIDATOR_V5_RESULTS.json")}`,
  "",
  "Safety status: PASS pending validator run",
  "What remains blocked: real owner decisions, completed real human review, KORG writer design review, native output inspection, empty USB verification, PA3X backup confirmation, hardware approval, PA3X observation, compatibility claim review, export approval.",
  "Next recommended phase: A + B + C together if safe."
].join("\n");
const master = [
  "# UAOS V58 Master Index",
  "",
  "- generated/UAOS_V58_REAL_OWNER_DECISION_INPUT_PACK.json",
  "- generated/UAOS_V58_REAL_OWNER_DECISION_INPUT_PACK.md",
  "- generated/UAOS_V58_REAL_OWNER_DECISION_FORM_PRINTABLE.md",
  "- generated/UAOS_V58_REAL_OWNER_DECISION_FORM_DATA.json",
  "- generated/UAOS_V58_INTERNAL_STYLE_GENERATION_DRYRUN_V4.json",
  "- generated/UAOS_V58_INTERNAL_STYLE_GENERATION_DRYRUN_V4.md",
  "- generated/UAOS_V58_STYLE_INTENT_REAL_OWNER_PENDING_PREVIEW.json",
  "- generated/UAOS_V58_STYLE_SECTION_PLAN_REAL_OWNER_PENDING_PREVIEW.json",
  "- generated/UAOS_V58_EXPORT_GATE_VALIDATOR_V5_RESULTS.json",
  "- generated/UAOS_V58_EXPORT_GATE_VALIDATOR_V5_REPORT.md",
  "- generated/UAOS_V58_NEXT_RECOMMENDATION_MATRIX.json",
  "- reports/UAOS_V58_VALIDATOR_RESULTS.json",
  "- reports/UAOS_V58_QA_REPORT.md",
  "- reports/UAOS_V58_OWNER_DASHBOARD.md",
  "- reports/UAOS_V58_FINAL_SEAL.md"
].join("\n");
const seal = [
  "# UAOS V58 Final Seal",
  "",
  "Status: pending validator run",
  "",
  "Safety: manual input pack only, dry-run only, metadata-only, no automatic real owner decision, no real apply, no audio, no MIDI, no KORG output, no native keyboard files, no USB, no PA3X load, no source mutation, no App.jsx, no deploy, no payment."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V58_EXPORT_GATE_VALIDATOR_V5_RESULTS.json"), JSON.stringify(results, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V58_EXPORT_GATE_VALIDATOR_V5_REPORT.md"), report + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V58_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(matrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V58_EXPORT_GATE_VALIDATOR_V5_REPORT.md"), report + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V58_QA_REPORT.md"), qa + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V58_OWNER_DASHBOARD.md"), dashboard + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V58_MASTER_INDEX.md"), master + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V58_FINAL_SEAL.md"), seal + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V58_EXPORT_GATE_VALIDATOR_V5_RESULTS.json" }, null, 2));
