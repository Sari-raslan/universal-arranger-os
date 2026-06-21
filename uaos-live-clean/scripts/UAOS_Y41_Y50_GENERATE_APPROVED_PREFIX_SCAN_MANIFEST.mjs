import fs from "node:fs";
import path from "node:path";
import {
  runY41Y50ApprovedPrefixScanManifest,
  validateY41Y50ApprovedPrefixScanManifest
} from "../src/real-writer-validation/y41-y50/approvedPrefixScanManifest.js";

const outDir = path.resolve("generated/real-writer-validation/y41-y50");
fs.mkdirSync(outDir, { recursive: true });

const report = runY41Y50ApprovedPrefixScanManifest();
const valid = validateY41Y50ApprovedPrefixScanManifest(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_Y41_APPROVED_PREFIX_SCAN_MANIFEST.json", report.reports.y41],
  ["UAOS_Y42_BOUNDED_PREFIX_SCANNER_CONTRACT.json", report.reports.y42],
  ["UAOS_Y43_MARKER_INDEX_PREFLIGHT.json", report.reports.y43],
  ["UAOS_Y44_PREFIX_SCAN_SAFETY_REPORT.json", report.reports.y44],
  ["UAOS_Y45_PARSER_UNLOCK_GATE.json", report.reports.y45],
  ["UAOS_Y46_WRITER_GATE.json", report.reports.y46],
  ["UAOS_Y41_Y50_APPROVED_PREFIX_SCAN_MANIFEST_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_Y41_Y50_APPROVED_PREFIX_SCAN_MANIFEST_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_Y41_Y50_APPROVED_PREFIX_SCAN_MANIFEST_SUMMARY",
    version: "Y41-Y50.0.0",
    status: report.status,
    approvedPrefixScanManifestReady: true,
    parserUnlockReady: false,
    allowReadOnlyAnalysis: true,
    allowBoundedPrefixScan: true,
    allowFullBinaryParse: false,
    allowParserImplementation: false,
    allowWriterImplementation: false,
    allowRealKeyboardBinaryOutput: false,
    allowRealStyOutput: false,
    canExportRealSty: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    deployAllowed: false,
    nextPhase: "Y51 bounded prefix scanner implementation gate, still no full parse and no writer"
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_APPROVED_PREFIX_SCAN_MANIFEST_HANDOVER.md"),
  [
    "# UAOS Approved Prefix Scan Manifest Handover",
    "",
    "Status: PREFIX_SCAN_MANIFEST_READY_BUT_LOCKED",
    "",
    "Ready:",
    "- approved prefix scan manifest",
    "- bounded prefix scanner contract",
    "- marker index preflight",
    "- prefix scan safety report",
    "- locked parser gate",
    "- locked writer gate",
    "",
    "Allowed:",
    "- bounded read-only prefix scan planning",
    "- safe JSON reports",
    "",
    "Still blocked:",
    "- full binary parse",
    "- parser implementation",
    "- writer implementation",
    "- real .STY output",
    "- deploy",
    "",
    "Next:",
    "Y51 bounded prefix scanner implementation gate, still no full parse and no writer."
  ].join("\n"),
  "utf8"
);

console.log("UAOS Y41-Y50 APPROVED PREFIX SCAN MANIFEST GENERATION PASS");
