import fs from "node:fs";
import path from "node:path";
import {
  runY91Y100ApprovalTextsAndSideAgents,
  validateY91Y100ApprovalTextsAndSideAgents
} from "../src/real-writer-validation/y91-y100/approvalTextsAndSideAgents.js";

const outDir = path.resolve("generated/real-writer-validation/y91-y100");
fs.mkdirSync(outDir, { recursive: true });

const report = runY91Y100ApprovalTextsAndSideAgents();
const valid = validateY91Y100ApprovalTextsAndSideAgents(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_Y91_APPROVAL_CAPTURE_STATE.json", report.reports.y91],
  ["UAOS_Y92_SIDE_AGENT_PREWRITE_PLANS.json", report.reports.y92],
  ["UAOS_Y93_PREPARED_FILE_REGISTRY.json", report.reports.y93],
  ["UAOS_Y94_APPROVAL_TEXTS_DOCUMENT.json", report.reports.y94],
  ["UAOS_Y95_FINAL_SIDE_AGENT_GATE.json", report.reports.y95],
  ["UAOS_Y91_Y100_APPROVAL_TEXTS_AND_SIDE_AGENTS_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_Y91_Y100_APPROVAL_TEXTS_AND_SIDE_AGENTS_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_Y91_Y100_APPROVAL_TEXTS_AND_SIDE_AGENTS_SUMMARY",
    version: "Y91-Y100.0.0",
    status: report.status,
    approvalTextsReady: true,
    sideAgentPlansReady: true,
    preparedFileRegistryReady: true,
    implementationFilesWritten: false,
    prefixScannerImplementationUnlocked: false,
    fullParseUnlocked: false,
    parserUnlockReady: false,
    writerUnlockReady: false,
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
    nextPhase: "Y101 only if explicit approval is set in env or given separately"
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_APPROVAL_TEXTS_AND_SIDE_AGENTS_HANDOVER.md"),
  [
    "# UAOS Approval Texts + Side Agents Handover",
    "",
    "Status: SIDE_AGENT_PLANS_READY_PENDING_APPROVAL",
    "",
    "Approval texts are prepared.",
    "Side agent prewrite plans are prepared.",
    "Implementation files are NOT written.",
    "",
    "Prefix scanner approval phrase:",
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
    "Y101 only if explicit approval is set in env or given separately."
  ].join("\n"),
  "utf8"
);

console.log("UAOS Y91-Y100 APPROVAL TEXTS AND SIDE AGENTS GENERATION PASS");
