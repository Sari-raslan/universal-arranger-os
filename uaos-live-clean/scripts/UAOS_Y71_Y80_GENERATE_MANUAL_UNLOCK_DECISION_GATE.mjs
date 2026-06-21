import fs from "node:fs";
import path from "node:path";
import {
  runY71Y80ManualUnlockDecisionGate,
  validateY71Y80ManualUnlockDecisionGate
} from "../src/real-writer-validation/y71-y80/manualUnlockDecisionGate.js";

const outDir = path.resolve("generated/real-writer-validation/y71-y80");
fs.mkdirSync(outDir, { recursive: true });

const report = runY71Y80ManualUnlockDecisionGate();
const valid = validateY71Y80ManualUnlockDecisionGate(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_Y71_MANUAL_UNLOCK_DECISION_GATE.json", report.reports.y71],
  ["UAOS_Y72_PARSER_UNLOCK_REQUIREMENTS_CHECKLIST.json", report.reports.y72],
  ["UAOS_Y73_PREFIX_SCANNER_UNLOCK_BLOCKER.json", report.reports.y73],
  ["UAOS_Y74_FULL_PARSE_UNLOCK_BLOCKER.json", report.reports.y74],
  ["UAOS_Y75_WRITER_UNLOCK_BLOCKER.json", report.reports.y75],
  ["UAOS_Y76_STOP_CONTINUE_DECISION_HANDOVER.json", report.reports.y76],
  ["UAOS_Y71_Y80_MANUAL_UNLOCK_DECISION_GATE_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_Y71_Y80_MANUAL_UNLOCK_DECISION_GATE_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_Y71_Y80_MANUAL_UNLOCK_DECISION_GATE_SUMMARY",
    version: "Y71-Y80.0.0",
    status: report.status,
    manualUnlockDecisionGateReady: report.finalDecision.manualUnlockDecisionGateReady,
    selectedDecision: "STOP_LOCKED",
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
    nextPhase: "Y81 only if user explicitly approves bounded prefix scanner implementation"
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_MANUAL_UNLOCK_DECISION_GATE_HANDOVER.md"),
  [
    "# UAOS Manual Unlock Decision Gate Handover",
    "",
    "Status: STOP_LOCKED",
    "",
    "Ready:",
    "- manual unlock decision gate",
    "- parser unlock checklist",
    "- prefix scanner blocker",
    "- full parse blocker",
    "- writer blocker",
    "- stop/continue handover",
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
    "Y81 only if the user explicitly approves bounded prefix scanner implementation.",
    "",
    "Approval text required:",
    "I approve implementing bounded read-only prefix scanner for my selected local Yamaha .STY fixtures. No full parse, no writer."
  ].join("\n"),
  "utf8"
);

console.log("UAOS Y71-Y80 MANUAL UNLOCK DECISION GATE GENERATION PASS");
