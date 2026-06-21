import fs from "node:fs";
import path from "node:path";
import {
  runR21R30YamahaParserSandbox,
  validateR21R30YamahaParserSandbox
} from "../src/real-writer-validation/r21-r30/yamahaParserSandbox.js";

const outDir = path.resolve("generated/real-writer-validation/r21-r30");
fs.mkdirSync(outDir, { recursive: true });

const report = runR21R30YamahaParserSandbox();
const valid = validateR21R30YamahaParserSandbox(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_R21_YAMAHA_PARSER_SANDBOX.json", report.reports.r21],
  ["UAOS_R22_SECTION_MARKER_PROBE.json", report.reports.r22],
  ["UAOS_R23_MIDI_LIKE_HEADER_PROBE.json", report.reports.r23],
  ["UAOS_R24_SAFE_STRUCTURE_MAP.json", report.reports.r24],
  ["UAOS_R25_PARSER_READINESS_GATE.json", report.reports.r25],
  ["UAOS_R26_PARSER_RISK_GATE.json", report.reports.r26],
  ["UAOS_R21_R30_YAMAHA_PARSER_SANDBOX_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_R21_R30_YAMAHA_PARSER_SANDBOX_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_R21_R30_YAMAHA_PARSER_SANDBOX_SUMMARY",
    version: "R21-R30.0.0",
    status: report.status,
    parserSandboxReady: true,
    allowReadOnlyAnalysis: true,
    allowFullBinaryParse: false,
    allowRealKeyboardBinaryOutput: false,
    allowRealStyOutput: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    nextPhase: "R31 Yamaha validated chunk parser planning"
  }, null, 2),
  "utf8"
);

console.log("UAOS R21-R30 YAMAHA PARSER SANDBOX GENERATION PASS");
