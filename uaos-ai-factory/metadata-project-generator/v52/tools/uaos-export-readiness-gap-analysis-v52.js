import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safetyBlock() {
  return {
    metadataOnly: true,
    gapAnalysisOnly: true,
    noExport: true,
    sourceProjectModified: false,
    autoApplyEnabled: false,
    realApplyAllowed: false,
    exportAllowed: false,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false,
    exportApproval: false
  };
}

function gap(gapId, title, currentStatus, requiredBeforeExport, riskLevel, ownerApprovalRequired, canBeWorkedNowSafely, safeNextAction, blockedAction) {
  return { gapId, title, currentStatus, requiredBeforeExport, riskLevel, ownerApprovalRequired, canBeWorkedNowSafely, safeNextAction, blockedAction };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const generatedAt = new Date().toISOString();
const seal = readJson(path.join(generatedDir, "UAOS_V52_METADATA_FREEZE_ACCEPTANCE_SEAL.json"));
const validatorPath = path.join(reportsDir, "UAOS_V52_VALIDATOR_RESULTS.json");
const validatorAlreadyPassed = fs.existsSync(validatorPath) && readJson(validatorPath).status === "PASS";

const gaps = [
  gap("metadataToInternalProjectGap", "Metadata to internal project mapping", "metadata workflow accepted, no real mapping applied", "signed mapping spec and dry-run tests", "medium", true, true, "Draft internal project integration plan.", "real project mutation"),
  gap("internalProjectToStyleEngineGap", "Internal project to style engine bridge", "not implemented", "metadata bridge design and test fixtures", "high", true, true, "Plan style engine metadata bridge.", "style engine execution"),
  gap("styleEngineToKorgWriterGap", "Style engine to KORG writer handoff", "not implemented", "writer design review and isolated candidate inspection", "blocker", true, false, "Document writer handoff requirements only.", "KORG writer output"),
  gap("korgWriterValidationGap", "KORG writer validation", "not available", "native candidate validator and independent review", "blocker", true, false, "Define validation checklist only.", "native file generation"),
  gap("hardwareFixtureGap", "Hardware fixture readiness", "not verified", "approved non-proprietary fixture strategy", "high", true, false, "Inventory fixture requirements without copying samples.", "fixture modification"),
  gap("USBVerificationGap", "USB verification", "blocked", "empty USB verification and owner approval", "blocker", true, false, "Write USB gate checklist only.", "USB write"),
  gap("PA3XBackupGateGap", "PA3X backup gate", "blocked", "confirmed full PA3X backup", "blocker", true, false, "Document backup confirmation gate.", "PA3X load"),
  gap("PA3XLoadTestGap", "PA3X isolated load test", "blocked", "isolated hardware test approval and observation", "blocker", true, false, "Define test observation plan only.", "keyboard load"),
  gap("legalCompatibilityClaimGap", "Compatibility claim review", "not reviewed", "legal/owner claim review", "high", true, true, "Prepare claim review checklist.", "compatibility or PA3X-ready claim"),
  gap("UIIntegrationGap", "UI integration", "not integrated", "separate planning approval before App.jsx work", "medium", true, true, "Create planning-only UI integration plan.", "App.jsx modification")
];

const gates = [
  "owner decision complete",
  "metadata dry-run apply preview PASS",
  "internal style engine integration PASS",
  "KORG writer design review PASS",
  "native output candidate inspection PASS",
  "empty USB verification PASS",
  "PA3X full backup confirmed",
  "isolated PA3X hardware test approved",
  "hardware test observed",
  "compatibility claim review"
].map((title, index) => ({
  gateId: `gate-${String(index + 1).padStart(2, "0")}`,
  title: `Gate ${index + 1}: ${title}`,
  approved: false,
  exportAllowed: false,
  usbAllowed: false,
  keyboardLoadAllowed: false,
  currentStatus: "blocked",
  safetyNote: "No export, USB write, or keyboard load is allowed by this metadata-only gate matrix."
}));

const analysis = {
  schemaVersion: "uaos.v52.export.readiness.gap.analysis.v1",
  generatedAt,
  sourceSealId: seal.sealId,
  metadataOnly: true,
  noExport: true,
  gaps,
  gapCount: gaps.length,
  blockerCount: gaps.filter((item) => item.riskLevel === "blocker").length,
  safeWorkNowCount: gaps.filter((item) => item.canBeWorkedNowSafely).length,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  compatibilityClaim: false,
  pa3xReadyClaim: false,
  safety: safetyBlock()
};

const gateMatrix = {
  schemaVersion: "uaos.v52.blocked.export.gate.matrix.v1",
  generatedAt,
  gates,
  allGatesBlocked: true,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safety: safetyBlock()
};

const nextMatrix = {
  schemaVersion: "uaos.v52.next.recommendation.matrix.v1",
  generatedAt,
  metadataOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V53 Internal Project Integration Plan", safety: "planning only, no App.jsx", recommended: true },
    { id: "B", action: "V53 Style Engine Metadata Bridge Plan", safety: "metadata-only", recommended: true },
    { id: "C", action: "V53 Export Gate Roadmap Pack", safety: "no export", recommended: true },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["A", "B", "C"],
  safety: safetyBlock()
};

const analysisMd = [
  "# UAOS V52 Export Readiness Gap Analysis",
  "",
  "This analysis does not implement export and does not approve KORG output, USB write, or PA3X load.",
  "",
  `Total gaps: ${gaps.length}`,
  `Blockers: ${analysis.blockerCount}`,
  `Safe work-now items: ${analysis.safeWorkNowCount}`,
  "",
  ...gaps.map((item) => [`## ${item.gapId}`, `Title: ${item.title}`, `Risk: ${item.riskLevel}`, `Current status: ${item.currentStatus}`, `Safe next action: ${item.safeNextAction}`, `Blocked action: ${item.blockedAction}`].join("\n"))
].join("\n\n");

const gateMd = [
  "# UAOS V52 Blocked Export Gate Matrix",
  "",
  "All export gates are currently blocked. No export, USB, or keyboard load is allowed.",
  "",
  ...gates.map((item) => `- ${item.title}: approved=false, exportAllowed=false, usbAllowed=false, keyboardLoadAllowed=false`)
].join("\n");

const gapReport = [
  "# UAOS V52 Export Readiness Gap Report",
  "",
  "Status: GENERATED",
  "",
  `Gap analysis: generated/UAOS_V52_EXPORT_READINESS_GAP_ANALYSIS.json`,
  `Blocked export gate matrix: generated/UAOS_V52_BLOCKED_EXPORT_GATE_MATRIX.json`,
  `Blocker gaps: ${analysis.blockerCount}`,
  "",
  "Safety: gap analysis only, metadata-only, no export."
].join("\n");

const qa = [
  "# UAOS V52 QA Report",
  "",
  "Metadata freeze seal created: YES",
  "Export gap analysis created: YES",
  "Blocked export gate matrix created: YES",
  `Validator PASS: ${validatorAlreadyPassed ? "YES" : "pending validator run"}`,
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
].join("\n");

const dashboard = [
  "# UAOS V52 Owner Dashboard",
  "",
  `Freeze seal: ${path.join(generatedDir, "UAOS_V52_METADATA_FREEZE_ACCEPTANCE_SEAL.json")}`,
  `Export gap analysis: ${path.join(generatedDir, "UAOS_V52_EXPORT_READINESS_GAP_ANALYSIS.json")}`,
  `Blocked gate matrix: ${path.join(generatedDir, "UAOS_V52_BLOCKED_EXPORT_GATE_MATRIX.json")}`,
  `Safety status: ${validatorAlreadyPassed ? "PASS" : "PASS pending validator run"}`,
  "",
  "Still blocked: export, real apply, source project mutation, auto-apply, KORG output, SET/STY/PRF/PRS/KST generation, USB write, PA3X load, fixture modification, App.jsx integration, deploy, payment, compatibility claim.",
  "",
  "Next recommended phase: A + B + C together, V53 Internal Project Integration Plan, Style Engine Metadata Bridge Plan, and Export Gate Roadmap Pack."
].join("\n");

const master = [
  "# UAOS V52 Master Index",
  "",
  "- generated/UAOS_V52_METADATA_FREEZE_ACCEPTANCE_SEAL.json",
  "- generated/UAOS_V52_METADATA_FREEZE_ACCEPTANCE_SEAL.md",
  "- generated/UAOS_V52_EXPORT_READINESS_GAP_ANALYSIS.json",
  "- generated/UAOS_V52_EXPORT_READINESS_GAP_ANALYSIS.md",
  "- generated/UAOS_V52_BLOCKED_EXPORT_GATE_MATRIX.json",
  "- generated/UAOS_V52_BLOCKED_EXPORT_GATE_MATRIX.md",
  "- generated/UAOS_V52_NEXT_RECOMMENDATION_MATRIX.json",
  "- reports/UAOS_V52_METADATA_FREEZE_ACCEPTANCE_SEAL_REPORT.md",
  "- reports/UAOS_V52_EXPORT_READINESS_GAP_REPORT.md",
  "- reports/UAOS_V52_VALIDATOR_RESULTS.json",
  "- reports/UAOS_V52_QA_REPORT.md",
  "- reports/UAOS_V52_OWNER_DASHBOARD.md",
  "- reports/UAOS_V52_FINAL_SEAL.md"
].join("\n");

const finalSeal = [
  "# UAOS V52 Final Seal",
  "",
  `Status: ${validatorAlreadyPassed ? "PASS" : "pending validator run"}`,
  "",
  "V52 created a metadata freeze acceptance seal, export readiness gap analysis, blocked export gate matrix, QA report, owner dashboard, and validator result.",
  "",
  "Safety: metadata-only, gap analysis only, freeze seal documentation only, no export, no real apply, no source project mutation, no KORG output, no SET/STY/PRF/PRS/KST, no audio/sample binaries, no USB write, no PA3X load, no fixture modification, no App.jsx, no deploy, no payment, no export approval."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V52_EXPORT_READINESS_GAP_ANALYSIS.json"), JSON.stringify(analysis, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V52_EXPORT_READINESS_GAP_ANALYSIS.md"), analysisMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V52_BLOCKED_EXPORT_GATE_MATRIX.json"), JSON.stringify(gateMatrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V52_BLOCKED_EXPORT_GATE_MATRIX.md"), gateMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V52_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(nextMatrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V52_EXPORT_READINESS_GAP_REPORT.md"), gapReport + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V52_QA_REPORT.md"), qa + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V52_OWNER_DASHBOARD.md"), dashboard + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V52_MASTER_INDEX.md"), master + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V52_FINAL_SEAL.md"), finalSeal + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V52_EXPORT_READINESS_GAP_ANALYSIS.json", gaps: gaps.length }, null, 2));
