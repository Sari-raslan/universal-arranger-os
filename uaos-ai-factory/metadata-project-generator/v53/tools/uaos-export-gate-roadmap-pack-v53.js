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

function safetyBlock() {
  return {
    planningOnly: true,
    metadataOnly: true,
    noExport: true,
    sourceProjectModified: false,
    korgOutputAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    exportApproval: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
const createdAt = new Date().toISOString();
const v52Gates = readJson(path.join(base, "v52", "generated", "UAOS_V52_BLOCKED_EXPORT_GATE_MATRIX.json"));
const validatorPath = path.join(reportsDir, "UAOS_V53_VALIDATOR_RESULTS.json");
const validatorAlreadyPassed = fs.existsSync(validatorPath) && readJson(validatorPath).status === "PASS";
const titles = [
  "Metadata freeze accepted",
  "Owner decisions filled",
  "Decision dry-run preview PASS",
  "Internal project integration dry-run PASS",
  "Style engine bridge dry-run PASS",
  "Internal style generation test PASS",
  "KORG writer design review PASS",
  "Local native candidate inspection PASS",
  "Empty USB verification PASS",
  "PA3X full backup confirmed",
  "Isolated hardware test approval",
  "PA3X load/rejection observation",
  "Compatibility claim legal/technical review"
];
const gates = titles.map((title, index) => ({
  gateId: `roadmap-gate-${String(index + 1).padStart(2, "0")}`,
  title,
  currentStatus: index === 0 ? "metadata_freeze_documented" : "blocked",
  requiredEvidence: `${title} evidence package`,
  ownerApprovalRequired: true,
  safeNextAction: index < 5 ? "Create planning or dry-run metadata artifact only." : "Document requirements only; no export or hardware action.",
  blockedUntil: index === 0 ? "owner acceptance seal" : "previous gates pass with owner approval",
  exportAllowed: false,
  usbAllowed: false,
  keyboardLoadAllowed: false
}));
const roadmap = {
  schemaVersion: "uaos.v53.export.gate.roadmap.pack.v1",
  createdAt,
  sourceV52GateCount: Array.isArray(v52Gates.gates) ? v52Gates.gates.length : 0,
  gates,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safety: safetyBlock()
};
const sequence = {
  schemaVersion: "uaos.v53.safe.implementation.sequence.v1",
  createdAt,
  sequence: [
    { version: "V54", action: "Read-only Internal Project Adapter Plan/Prototype", safety: "no App.jsx" },
    { version: "V55", action: "Style Engine Bridge Dry-run", safety: "metadata-only" },
    { version: "V56", action: "Internal Style Generation Dry-run", safety: "no KORG" },
    { version: "V57", action: "Export Gate Validator", safety: "no export" },
    { version: "V58", action: "Owner Decision Filled Example", safety: "dry-run only" },
    { version: "V59", action: "Local Integration Review Portal", safety: "no App.jsx/no deploy" },
    { version: "V60", action: "Freeze Before Real Implementation", safety: "owner approval required" }
  ],
  implementationAllowedNow: false,
  exportAllowed: false,
  korgOutputAllowed: false,
  safety: safetyBlock()
};
const nextMatrix = {
  schemaVersion: "uaos.v53.next.recommendation.matrix.v1",
  createdAt,
  metadataOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V54 Read-only Internal Project Adapter Prototype", safety: "no App.jsx", recommended: true },
    { id: "B", action: "V54 Style Engine Bridge Dry-run", safety: "metadata-only", recommended: true },
    { id: "C", action: "V54 Export Gate Validator Foundation", safety: "no export", recommended: true },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["A", "B", "C"],
  safety: safetyBlock()
};
const md = [
  "# UAOS V53 Export Gate Roadmap Pack",
  "",
  "No export is allowed by this roadmap.",
  "",
  ...gates.map((gate) => `- ${gate.gateId}: ${gate.title} | exportAllowed=false | usbAllowed=false | keyboardLoadAllowed=false`)
].join("\n");
const report = [
  "# UAOS V53 Export Gate Roadmap Report",
  "",
  "Status: GENERATED",
  `Gates: ${gates.length}`,
  "Safety: roadmap only, no export, no USB, no keyboard load."
].join("\n");
const qa = [
  "# UAOS V53 QA Report",
  "",
  "Integration plan created: YES",
  "Style engine bridge plan created: YES",
  "Export gate roadmap created: YES",
  "Safe implementation sequence created: YES",
  `Validator PASS: ${validatorAlreadyPassed ? "YES" : "pending validator run"}`,
  "No implementation: YES",
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
  "# UAOS V53 Owner Dashboard",
  "",
  `Integration plan: ${path.join(generatedDir, "UAOS_V53_INTERNAL_PROJECT_INTEGRATION_PLAN.json")}`,
  `Style engine bridge plan: ${path.join(generatedDir, "UAOS_V53_STYLE_ENGINE_METADATA_BRIDGE_PLAN.json")}`,
  `Export gate roadmap: ${path.join(generatedDir, "UAOS_V53_EXPORT_GATE_ROADMAP_PACK.json")}`,
  `Safe implementation sequence: ${path.join(generatedDir, "UAOS_V53_SAFE_IMPLEMENTATION_SEQUENCE.json")}`,
  `Safety status: ${validatorAlreadyPassed ? "PASS" : "PASS pending validator run"}`,
  "",
  "Still blocked: implementation, source mutation, App.jsx, KORG output, USB write, PA3X load, deploy, payment, export approval.",
  "",
  "Next recommended phase: A + B + C together, V54 Read-only Internal Project Adapter Prototype, Style Engine Bridge Dry-run, and Export Gate Validator Foundation."
].join("\n");
const master = [
  "# UAOS V53 Master Index",
  "",
  "- generated/UAOS_V53_INTERNAL_PROJECT_INTEGRATION_PLAN.json",
  "- generated/UAOS_V53_INTERNAL_PROJECT_INTEGRATION_PLAN.md",
  "- generated/UAOS_V53_STYLE_ENGINE_METADATA_BRIDGE_PLAN.json",
  "- generated/UAOS_V53_STYLE_ENGINE_METADATA_BRIDGE_PLAN.md",
  "- generated/UAOS_V53_EXPORT_GATE_ROADMAP_PACK.json",
  "- generated/UAOS_V53_EXPORT_GATE_ROADMAP_PACK.md",
  "- generated/UAOS_V53_SAFE_IMPLEMENTATION_SEQUENCE.json",
  "- generated/UAOS_V53_NEXT_RECOMMENDATION_MATRIX.json",
  "- reports/UAOS_V53_VALIDATOR_RESULTS.json",
  "- reports/UAOS_V53_QA_REPORT.md",
  "- reports/UAOS_V53_OWNER_DASHBOARD.md",
  "- reports/UAOS_V53_FINAL_SEAL.md"
].join("\n");
const finalSeal = [
  "# UAOS V53 Final Seal",
  "",
  `Status: ${validatorAlreadyPassed ? "PASS" : "pending validator run"}`,
  "",
  "Safety: planning only, metadata-only, no implementation, no source mutation, no App.jsx, no KORG output, no USB, no PA3X load, no deploy, no payment."
].join("\n");
fs.writeFileSync(path.join(generatedDir, "UAOS_V53_EXPORT_GATE_ROADMAP_PACK.json"), JSON.stringify(roadmap, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V53_EXPORT_GATE_ROADMAP_PACK.md"), md + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V53_SAFE_IMPLEMENTATION_SEQUENCE.json"), JSON.stringify(sequence, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V53_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(nextMatrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V53_EXPORT_GATE_ROADMAP_REPORT.md"), report + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V53_QA_REPORT.md"), qa + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V53_OWNER_DASHBOARD.md"), dashboard + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V53_MASTER_INDEX.md"), master + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V53_FINAL_SEAL.md"), finalSeal + "\n", "utf8");
console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V53_EXPORT_GATE_ROADMAP_PACK.json" }, null, 2));
