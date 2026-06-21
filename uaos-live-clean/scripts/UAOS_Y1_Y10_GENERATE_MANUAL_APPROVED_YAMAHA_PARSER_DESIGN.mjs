import fs from "node:fs";
import path from "node:path";
import {
  runY1Y10ManualApprovedYamahaParserDesign,
  validateY1Y10ManualApprovedYamahaParserDesign
} from "../src/real-writer-validation/y1-y10/manualApprovedYamahaParserDesign.js";

const outDir = path.resolve("generated/real-writer-validation/y1-y10");
fs.mkdirSync(outDir, { recursive: true });

const report = runY1Y10ManualApprovedYamahaParserDesign();
const valid = validateY1Y10ManualApprovedYamahaParserDesign(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_Y1_MANUAL_APPROVED_FIXTURE_SET.json", report.reports.y1],
  ["UAOS_Y2_APPROVAL_RECORD_TEMPLATE.json", report.reports.y2],
  ["UAOS_Y3_READ_ONLY_PARSER_DESIGN_SKELETON.json", report.reports.y3],
  ["UAOS_Y4_SEMANTIC_PARSER_CONTRACT.json", report.reports.y4],
  ["UAOS_Y5_CHUNK_BOUNDARY_CONTRACT.json", report.reports.y5],
  ["UAOS_Y6_ROUNDTRIP_VALIDATION_CONTRACT.json", report.reports.y6],
  ["UAOS_Y7_PARSER_UNLOCK_GATE.json", report.reports.y7],
  ["UAOS_Y1_Y10_MANUAL_APPROVED_YAMAHA_PARSER_DESIGN_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_Y1_Y10_MANUAL_APPROVED_YAMAHA_PARSER_DESIGN_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_Y1_Y10_MANUAL_APPROVED_YAMAHA_PARSER_DESIGN_SUMMARY",
    version: "Y1-Y10.0.0",
    status: report.status,
    manualApprovedParserDesignReady: true,
    parserUnlockReady: false,
    allowReadOnlyAnalysis: true,
    allowFullBinaryParse: false,
    allowParserImplementation: false,
    allowWriterImplementation: false,
    allowRealKeyboardBinaryOutput: false,
    allowRealStyOutput: false,
    canExportRealSty: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    deployAllowed: false,
    nextPhase: "Y11 manual fixture approval entry, still no writer"
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_YAMAHA_PARSER_DESIGN_HANDOVER.md"),
  [
    "# UAOS Yamaha Parser Design Handover",
    "",
    "Status: DESIGN_ONLY_LOCKED",
    "",
    "This phase creates design contracts only.",
    "",
    "Ready:",
    "- approval template",
    "- parser skeleton design",
    "- semantic parser contract",
    "- chunk boundary contract",
    "- roundtrip validation contract",
    "- parser unlock gate",
    "",
    "Blocked:",
    "- full binary parse",
    "- parser implementation",
    "- writer implementation",
    "- real .STY output",
    "- deploy",
    "",
    "Next:",
    "Y11 manual fixture approval entry, still no writer."
  ].join("\n"),
  "utf8"
);

console.log("UAOS Y1-Y10 MANUAL APPROVED YAMAHA PARSER DESIGN GENERATION PASS");
