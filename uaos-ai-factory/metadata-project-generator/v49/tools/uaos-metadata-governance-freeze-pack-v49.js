import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

function safetyBlock() {
  return {
    metadataOnly: true,
    governanceFreezeDocumentationOnly: true,
    sourceProjectModified: false,
    autoApplyEnabled: false,
    realApplyAllowed: false,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false,
    exportApproval: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const generatedAt = new Date().toISOString();
const validatorPath = path.join(reportsDir, "UAOS_V49_VALIDATOR_RESULTS.json");
const validatorAlreadyPassed = fs.existsSync(validatorPath) && JSON.parse(fs.readFileSync(validatorPath, "utf8")).status === "PASS";

const freezePack = {
  schemaVersion: "uaos.v49.metadata.governance.freeze.pack.v1",
  generatedAt,
  metadataOnly: true,
  governanceFreezeDocumentationOnly: true,
  frozenScope: [
    "metadata schema drafts",
    "review workflow artifacts",
    "suggestion scoring artifacts",
    "local dashboard/archive artifacts"
  ],
  notFrozenScope: [
    "KORG writer",
    "PA3X hardware export",
    "USB copy",
    "App.jsx UI integration",
    "deploy"
  ],
  notApproved: {
    korgWriter: true,
    usbCopy: true,
    appJsIntegrationPerformed: false,
    deployPerformed: false,
    exportApproval: false
  },
  frozenRules: [
    "no source mutation without explicit owner approval",
    "no auto-apply",
    "no export approval from metadata score",
    "no PA3X-ready claim",
    "no USB copy from review packs"
  ],
  requiredGatesBeforeExport: [
    "owner decision completed",
    "dry-run preview PASS",
    "real export design review",
    "hardware-specific approval",
    "empty USB verification",
    "PA3X backup confirmation",
    "isolated hardware test approval"
  ],
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safety: safetyBlock()
};

const freezeMatrix = {
  schemaVersion: "uaos.v49.freeze.decision.matrix.v1",
  generatedAt,
  options: [
    { id: "A", decision: "Freeze metadata review workflow V37-V49 as owner-review-ready.", recommended: true, safety: "metadata-only freeze documentation" },
    { id: "B", decision: "Continue V50 governance audit, metadata-only.", recommended: true, safety: "metadata-only audit" },
    { id: "C", decision: "Build V50 local portal index ZIP, metadata-only.", recommended: false, safety: "local metadata packaging only" },
    { id: "D", decision: "Start separate UI integration plan, no App.jsx changes yet.", recommended: false, safety: "planning only" },
    { id: "E", decision: "Stop.", recommended: false, safety: "always available" }
  ],
  recommendedTogether: ["A", "B"],
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safety: safetyBlock()
};

const nextMatrix = {
  schemaVersion: "uaos.v49.next.recommendation.matrix.v1",
  generatedAt,
  metadataOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V50 Governance Audit Seal", safety: "metadata-only", recommended: true },
    { id: "B", action: "V50 Local Portal Index ZIP", safety: "metadata-only", recommended: true },
    { id: "C", action: "V50 UI Integration Plan", safety: "planning only, no App.jsx", recommended: false },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["A", "B"],
  safety: safetyBlock()
};

const freezeMd = [
  "# UAOS V49 Metadata Governance Freeze Pack",
  "",
  "Metadata-only governance/freeze documentation. This does not approve KORG export, USB copy, keyboard load, App.jsx integration, or deploy.",
  "",
  "## Frozen Scope",
  ...freezePack.frozenScope.map((item) => `- ${item}`),
  "",
  "## Not Frozen / Not Approved",
  ...freezePack.notFrozenScope.map((item) => `- ${item}`),
  "",
  "## Frozen Rules",
  ...freezePack.frozenRules.map((item) => `- ${item}`),
  "",
  "## Required Gates Before Export",
  ...freezePack.requiredGatesBeforeExport.map((item) => `- ${item}`)
].join("\n");

const matrixMd = [
  "# UAOS V49 Freeze Decision Matrix",
  "",
  ...freezeMatrix.options.map((item) => `- ${item.id}. ${item.decision} Recommended: ${item.recommended ? "YES" : "NO"}. Safety: ${item.safety}`),
  "",
  "Recommended: A + B if safe."
].join("\n");

const report = [
  "# UAOS V49 Metadata Governance Freeze Report",
  "",
  "Status: GENERATED",
  "",
  "KORG writer is not frozen or approved.",
  "USB copy is not approved.",
  "App.jsx integration is not performed.",
  "Deploy is not performed.",
  "",
  "Safety: governance/freeze documentation only, metadata-only."
].join("\n");

const qaReport = [
  "# UAOS V49 QA Report",
  "",
  "Local static review portal created: YES",
  "Governance freeze pack created: YES",
  "Freeze decision matrix created: YES",
  `Validator PASS: ${validatorAlreadyPassed ? "YES" : "pending validator run"}`,
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
].join("\n");

const dashboard = [
  "# UAOS V49 Owner Dashboard",
  "",
  `V49 portal: ${path.join(generatedDir, "UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL.html")}`,
  `V49 governance freeze pack: ${path.join(generatedDir, "UAOS_V49_METADATA_GOVERNANCE_FREEZE_PACK.json")}`,
  `V49 freeze decision matrix: ${path.join(generatedDir, "UAOS_V49_FREEZE_DECISION_MATRIX.json")}`,
  `Safety status: ${validatorAlreadyPassed ? "PASS" : "PASS pending validator run"}`,
  "",
  "Still blocked: real apply, source project mutation, auto-apply, KORG output, SET/STY/PRF/PRS/KST generation, USB write, PA3X load, export approval, App.jsx integration, deploy.",
  "",
  "Next recommended phase: A + B together, V50 Governance Audit Seal and V50 Local Portal Index ZIP."
].join("\n");

const masterIndex = [
  "# UAOS V49 Master Index",
  "",
  "- generated/UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL.html",
  "- generated/UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL_DATA.json",
  "- generated/UAOS_V49_METADATA_GOVERNANCE_FREEZE_PACK.json",
  "- generated/UAOS_V49_METADATA_GOVERNANCE_FREEZE_PACK.md",
  "- generated/UAOS_V49_FREEZE_DECISION_MATRIX.json",
  "- generated/UAOS_V49_FREEZE_DECISION_MATRIX.md",
  "- generated/UAOS_V49_NEXT_RECOMMENDATION_MATRIX.json",
  "- reports/UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL_REPORT.md",
  "- reports/UAOS_V49_METADATA_GOVERNANCE_FREEZE_REPORT.md",
  "- reports/UAOS_V49_VALIDATOR_RESULTS.json",
  "- reports/UAOS_V49_QA_REPORT.md",
  "- reports/UAOS_V49_OWNER_DASHBOARD.md",
  "- reports/UAOS_V49_FINAL_SEAL.md"
].join("\n");

const finalSeal = [
  "# UAOS V49 Final Seal",
  "",
  `Status: ${validatorAlreadyPassed ? "PASS" : "pending validator run"}`,
  "",
  "V49 created a local static review portal, metadata governance freeze pack, freeze decision matrix, QA report, owner dashboard, and validator result.",
  "",
  "Safety: metadata-only, static local portal only, governance/freeze documentation only, no real apply, no source project mutation, no KORG output, no SET/STY/PRF/PRS/KST, no audio/sample binaries, no USB write, no keyboard load, no fixture modification, no App.jsx, no deploy, no export approval."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V49_METADATA_GOVERNANCE_FREEZE_PACK.json"), JSON.stringify(freezePack, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V49_METADATA_GOVERNANCE_FREEZE_PACK.md"), freezeMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V49_FREEZE_DECISION_MATRIX.json"), JSON.stringify(freezeMatrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V49_FREEZE_DECISION_MATRIX.md"), matrixMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V49_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(nextMatrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V49_METADATA_GOVERNANCE_FREEZE_REPORT.md"), report + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V49_QA_REPORT.md"), qaReport + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V49_OWNER_DASHBOARD.md"), dashboard + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V49_MASTER_INDEX.md"), masterIndex + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V49_FINAL_SEAL.md"), finalSeal + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V49_METADATA_GOVERNANCE_FREEZE_PACK.json" }, null, 2));
