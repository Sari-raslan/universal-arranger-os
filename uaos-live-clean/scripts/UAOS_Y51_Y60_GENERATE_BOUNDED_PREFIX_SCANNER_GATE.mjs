import fs from "node:fs";
import path from "node:path";
import {
  runY51Y60BoundedPrefixScannerGate,
  validateY51Y60BoundedPrefixScannerGate
} from "../src/real-writer-validation/y51-y60/boundedPrefixScannerGate.js";

const outDir = path.resolve("generated/real-writer-validation/y51-y60");
fs.mkdirSync(outDir, { recursive: true });

const report = runY51Y60BoundedPrefixScannerGate();
const valid = validateY51Y60BoundedPrefixScannerGate(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_Y51_BOUNDED_PREFIX_SCANNER_IMPLEMENTATION_GATE.json", report.reports.y51],
  ["UAOS_Y52_PREFIX_SCAN_EXECUTION_PLAN.json", report.reports.y52],
  ["UAOS_Y53_MARKER_EXTRACTION_CONTRACT.json", report.reports.y53],
  ["UAOS_Y54_SAFE_PREFIX_SCAN_RESULT_SCHEMA.json", report.reports.y54],
  ["UAOS_Y55_PARSER_UNLOCK_BLOCKER.json", report.reports.y55],
  ["UAOS_Y56_WRITER_LOCK_CERTIFICATE.json", report.reports.y56],
  ["UAOS_Y51_Y60_BOUNDED_PREFIX_SCANNER_GATE_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_Y51_Y60_BOUNDED_PREFIX_SCANNER_GATE_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_Y51_Y60_BOUNDED_PREFIX_SCANNER_GATE_SUMMARY",
    version: "Y51-Y60.0.0",
    status: report.status,
    boundedPrefixScannerGateReady: true,
    parserUnlockReady: false,
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
    nextPhase: "Y61 final parser design closure, still no full parse and no writer"
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_BOUNDED_PREFIX_SCANNER_GATE_HANDOVER.md"),
  [
    "# UAOS Bounded Prefix Scanner Gate Handover",
    "",
    "Status: PREFIX_SCANNER_GATE_READY_BUT_LOCKED",
    "",
    "Ready:",
    "- bounded prefix scanner gate",
    "- prefix scan execution plan",
    "- marker extraction contract",
    "- safe prefix scan result schema",
    "- parser unlock blocker",
    "- writer lock certificate",
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
    "Y61 final parser design closure, still no full parse and no writer."
  ].join("\n"),
  "utf8"
);

console.log("UAOS Y51-Y60 BOUNDED PREFIX SCANNER GATE GENERATION PASS");
