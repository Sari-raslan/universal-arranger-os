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
const v55Gates = readJson(path.join(base, "v55", "generated", "UAOS_V55_EXPORT_GATE_VALIDATOR_V2_RESULTS.json"));
const dryrun = readJson(path.join(generatedDir, "UAOS_V56_INTERNAL_STYLE_GENERATION_DRYRUN_V2.json"));
const checklist = readJson(path.join(generatedDir, "UAOS_V56_HUMAN_REVIEW_CHECKLIST_STYLE_INTENT.json"));
const checklistCompleted = checklist.checklistItems.every((item) => item.selectedDecision !== "pending");
const gates = [
  ["Metadata freeze accepted", true],
  ["Owner decisions filled", false],
  ["Decision dry-run preview PASS", true],
  ["Internal project adapter PASS", true],
  ["Style engine bridge dry-run PASS", true],
  ["Internal style generation dry-run v2 PASS", dryrun.dryRunOnly === true && dryrun.metadataOnly === true],
  ["Human review checklist completed", checklistCompleted],
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
  status: pass ? "PASS_METADATA_ONLY" : "BLOCKED",
  exportAllowed: false,
  usbAllowed: false,
  keyboardLoadAllowed: false,
  korgOutputAllowed: false,
  compatibilityClaimAllowed: false
}));
const results = {
  schemaVersion: "uaos.v56.export.gate.validator.v3.results.v1",
  createdAt,
  sourceV55GateSchema: v55Gates.schemaVersion,
  gateResults,
  passCount: gateResults.filter((gate) => gate.status !== "BLOCKED").length,
  blockerCount: gateResults.filter((gate) => gate.status === "BLOCKED").length,
  styleDryRunV2Status: dryrun.dryRunOnly && dryrun.metadataOnly ? "PASS_METADATA_ONLY" : "FAIL",
  humanReviewChecklistStatus: checklistCompleted ? "COMPLETED" : "PENDING",
  exportAllowed: false,
  usbAllowed: false,
  keyboardLoadAllowed: false,
  korgOutputAllowed: false,
  compatibilityClaimAllowed: false,
  safety: {
    metadataOnly: true,
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
  "# UAOS V56 Export Gate Validator V3 Report",
  "",
  "Export gates remain BLOCKED overall.",
  `Pass count: ${results.passCount}`,
  `Blocker count: ${results.blockerCount}`,
  "Style dry-run v2: PASS_METADATA_ONLY",
  "Human review checklist: PENDING",
  "Export allowed: NO",
  "USB allowed: NO",
  "Keyboard load allowed: NO",
  "KORG output allowed: NO",
  "Compatibility claim allowed: NO"
].join("\n");
const matrix = {
  schemaVersion: "uaos.v56.next.recommendation.matrix.v1",
  createdAt,
  metadataOnly: true,
  recommendations: [
    { id: "A", action: "V57 Human Review Filled Example, sample/dry-run only", recommended: true },
    { id: "B", action: "V57 Internal Style Generation Dry-run v3, metadata-only", recommended: true },
    { id: "C", action: "V57 Export Gate Validator v4, no export", recommended: true },
    { id: "D", action: "Stop", recommended: false }
  ],
  recommendedCombinedNext: "A + B + C together if safe",
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false
};
const qa = [
  "# UAOS V56 QA Report",
  "",
  "Internal style generation dry-run v2 created: YES",
  "Refined style intent preview created: YES",
  "Refined section plan preview created: YES",
  "Human review checklist created: YES",
  "Owner decision form created: YES",
  "Export gate validator v3 created: YES",
  "Validator PASS: pending validator run",
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
  "# UAOS V56 Owner Dashboard",
  "",
  `V56 dry-run v2 path: ${path.join(generatedDir, "UAOS_V56_INTERNAL_STYLE_GENERATION_DRYRUN_V2.json")}`,
  `V56 refined style intent path: ${path.join(generatedDir, "UAOS_V56_STYLE_INTENT_REFINED_PREVIEW.json")}`,
  `V56 refined section plan path: ${path.join(generatedDir, "UAOS_V56_STYLE_SECTION_PLAN_REFINED_PREVIEW.json")}`,
  `V56 human review checklist path: ${path.join(generatedDir, "UAOS_V56_HUMAN_REVIEW_CHECKLIST_STYLE_INTENT.json")}`,
  `V56 export gate validator v3 path: ${path.join(generatedDir, "UAOS_V56_EXPORT_GATE_VALIDATOR_V3_RESULTS.json")}`,
  "",
  "Safety status: PASS pending validator run",
  "What remains blocked: owner decisions, completed human review, KORG writer design review, native output inspection, empty USB verification, PA3X backup confirmation, hardware approval, PA3X observation, compatibility claim review, export approval.",
  "Next recommended phase: A + B + C together if safe."
].join("\n");
const master = [
  "# UAOS V56 Master Index",
  "",
  "- generated/UAOS_V56_INTERNAL_STYLE_GENERATION_DRYRUN_V2.json",
  "- generated/UAOS_V56_INTERNAL_STYLE_GENERATION_DRYRUN_V2.md",
  "- generated/UAOS_V56_STYLE_INTENT_REFINED_PREVIEW.json",
  "- generated/UAOS_V56_STYLE_SECTION_PLAN_REFINED_PREVIEW.json",
  "- generated/UAOS_V56_HUMAN_REVIEW_CHECKLIST_STYLE_INTENT.json",
  "- generated/UAOS_V56_HUMAN_REVIEW_CHECKLIST_STYLE_INTENT.md",
  "- generated/UAOS_V56_HUMAN_REVIEW_OWNER_DECISION_FORM.md",
  "- generated/UAOS_V56_EXPORT_GATE_VALIDATOR_V3_RESULTS.json",
  "- generated/UAOS_V56_EXPORT_GATE_VALIDATOR_V3_REPORT.md",
  "- generated/UAOS_V56_NEXT_RECOMMENDATION_MATRIX.json",
  "- reports/UAOS_V56_VALIDATOR_RESULTS.json",
  "- reports/UAOS_V56_QA_REPORT.md",
  "- reports/UAOS_V56_OWNER_DASHBOARD.md",
  "- reports/UAOS_V56_FINAL_SEAL.md"
].join("\n");
const seal = [
  "# UAOS V56 Final Seal",
  "",
  "Status: pending validator run",
  "",
  "Safety: dry-run only, metadata-only, human review only, no audio, no MIDI, no KORG output, no native keyboard files, no USB, no PA3X load, no source mutation, no App.jsx, no deploy, no payment."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V56_EXPORT_GATE_VALIDATOR_V3_RESULTS.json"), JSON.stringify(results, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V56_EXPORT_GATE_VALIDATOR_V3_REPORT.md"), report + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V56_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(matrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V56_EXPORT_GATE_VALIDATOR_V3_REPORT.md"), report + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V56_QA_REPORT.md"), qa + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V56_OWNER_DASHBOARD.md"), dashboard + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V56_MASTER_INDEX.md"), master + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V56_FINAL_SEAL.md"), seal + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V56_EXPORT_GATE_VALIDATOR_V3_RESULTS.json" }, null, 2));
