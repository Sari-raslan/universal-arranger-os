import fs from "node:fs";
import path from "node:path";
import {
  runY81Y90ApprovalRequiredStopGate,
  validateY81Y90ApprovalRequiredStopGate
} from "../src/real-writer-validation/y81-y90/approvalRequiredStopGate.js";

const outDir = path.resolve("generated/real-writer-validation/y81-y90");
fs.mkdirSync(outDir, { recursive: true });

const report = runY81Y90ApprovalRequiredStopGate();
const valid = validateY81Y90ApprovalRequiredStopGate(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_Y81_APPROVAL_REQUIRED_GATE.json", report.reports.y81],
  ["UAOS_Y82_EXACT_APPROVAL_PHRASE_VALIDATOR.json", report.reports.y82],
  ["UAOS_Y83_PREFIX_SCANNER_IMPLEMENTATION_BLOCKER.json", report.reports.y83],
  ["UAOS_Y84_FULL_PARSE_BLOCKER.json", report.reports.y84],
  ["UAOS_Y85_WRITER_BLOCKER.json", report.reports.y85],
  ["UAOS_Y86_FINAL_STOP_DASHBOARD.json", report.reports.y86],
  ["UAOS_Y81_Y90_APPROVAL_REQUIRED_STOP_GATE_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_Y81_Y90_APPROVAL_REQUIRED_STOP_GATE_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_Y81_Y90_APPROVAL_REQUIRED_STOP_GATE_SUMMARY",
    version: "Y81-Y90.0.0",
    status: report.status,
    approvalRequiredStopGateReady: report.finalDecision.approvalRequiredStopGateReady,
    selectedDecision: "STOP_LOCKED",
    requiredApprovalPhrase:
      "I approve implementing bounded read-only prefix scanner for my selected local Yamaha .STY fixtures. No full parse, no writer.",
    prefixScannerImplementationUnlocked: false,
    parserUnlockReady: false,
    writerUnlockReady: false,
    allowReadOnlyAnalysis: true,
    allowBoundedPrefixScanPlanning: true,
    allowBoundedPrefixScannerImplementation: false,
    allowMarkerExtractionImplementation: false,
    allowFullBinaryParse: false,
    allowParserImplementation: false,
    allowWriterImplementation: false,
    allowRealKeyboardBinaryOutput: false,
    allowRealStyOutput: false,
    canExportRealSty: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    deployAllowed: false,
    nextPhase: "Y91 only after explicit approval; otherwise stop"
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_APPROVAL_REQUIRED_STOP_GATE_HANDOVER.md"),
  [
    "# UAOS Approval Required Stop Gate Handover",
    "",
    "Status: STOP_LOCKED",
    "",
    "This phase does not implement prefix scanning.",
    "",
    "Required approval phrase for a future dedicated scanner launcher:",
    "I approve implementing bounded read-only prefix scanner for my selected local Yamaha .STY fixtures. No full parse, no writer.",
    "",
    "Still blocked:",
    "- bounded prefix scanner implementation",
    "- marker extraction implementation",
    "- full binary parse",
    "- parser implementation",
    "- writer implementation",
    "- real .STY output",
    "- deploy",
    "",
    "Next:",
    "Y91 only after explicit approval; otherwise stop."
  ].join("\n"),
  "utf8"
);

console.log("UAOS Y81-Y90 APPROVAL REQUIRED STOP GATE GENERATION PASS");
