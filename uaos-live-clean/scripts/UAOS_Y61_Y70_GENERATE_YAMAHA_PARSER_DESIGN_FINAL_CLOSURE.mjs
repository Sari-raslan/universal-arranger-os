import fs from "node:fs";
import path from "node:path";
import {
  runY61Y70YamahaParserDesignFinalClosure,
  validateY61Y70YamahaParserDesignFinalClosure
} from "../src/real-writer-validation/y61-y70/yamahaParserDesignFinalClosure.js";

const outDir = path.resolve("generated/real-writer-validation/y61-y70");
fs.mkdirSync(outDir, { recursive: true });

const report = runY61Y70YamahaParserDesignFinalClosure();
const valid = validateY61Y70YamahaParserDesignFinalClosure(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_Y61_FINAL_PARSER_DESIGN_AUDIT.json", report.reports.y61],
  ["UAOS_Y62_YAMAHA_PARSER_DESIGN_MASTER_INDEX.json", report.reports.y62],
  ["UAOS_Y63_PARSER_BLOCKED_SAFETY_CERTIFICATE.json", report.reports.y63],
  ["UAOS_Y64_WRITER_BLOCKED_SAFETY_CERTIFICATE.json", report.reports.y64],
  ["UAOS_Y65_FINAL_PARSER_DESIGN_HANDOVER.json", report.reports.y65],
  ["UAOS_Y66_FINAL_DASHBOARD_DATA.json", report.reports.y66],
  ["UAOS_Y61_Y70_YAMAHA_PARSER_DESIGN_FINAL_CLOSURE_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_Y61_Y70_YAMAHA_PARSER_DESIGN_FINAL_CLOSURE_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_Y61_Y70_YAMAHA_PARSER_DESIGN_FINAL_CLOSURE_SUMMARY",
    version: "Y61-Y70.0.0",
    status: report.status,
    yamahaParserDesignBaselineClosed: true,
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
    nextPhase: "Y71 manual unlock decision gate or stop"
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_YAMAHA_PARSER_DESIGN_FINAL_HANDOVER.md"),
  [
    "# UAOS Yamaha Parser Design Final Handover",
    "",
    "Status: YAMAHA_PARSER_DESIGN_BASELINE_CLOSED",
    "",
    "Ready:",
    "- manual approval design",
    "- fixture registry/manifest schema",
    "- redacted reports",
    "- bounded prefix scan planning",
    "- marker extraction contract",
    "- safe prefix result schema",
    "- final parser blocked certificate",
    "- final writer blocked certificate",
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
    "Y71 manual unlock decision gate or stop.",
    "",
    "No deploy was executed.",
    "No real keyboard binary file was written."
  ].join("\n"),
  "utf8"
);

console.log("UAOS Y61-Y70 YAMAHA PARSER DESIGN FINAL CLOSURE GENERATION PASS");
