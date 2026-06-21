import fs from "node:fs";
import path from "node:path";
import {
  runR31R40YamahaParserPlanning,
  validateR31R40YamahaParserPlanning
} from "../src/real-writer-validation/r31-r40/yamahaParserPlanningGates.js";

const outDir = path.resolve("generated/real-writer-validation/r31-r40");
fs.mkdirSync(outDir, { recursive: true });

const report = runR31R40YamahaParserPlanning();
const valid = validateR31R40YamahaParserPlanning(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_R31_VALIDATED_CHUNK_PARSER_PLAN.json", report.reports.r31],
  ["UAOS_R32_YAMAHA_SECTION_TABLE_MODEL.json", report.reports.r32],
  ["UAOS_R33_CASM_LIKE_RULES_RESEARCH_GATE.json", report.reports.r33],
  ["UAOS_R34_OTS_METADATA_RESEARCH_GATE.json", report.reports.r34],
  ["UAOS_R35_CHECKSUM_PACKAGE_RULE_PLAN.json", report.reports.r35],
  ["UAOS_R36_PARSER_IMPLEMENTATION_READINESS_GATE.json", report.reports.r36],
  ["UAOS_R37_WRITER_RISK_BLOCKER.json", report.reports.r37],
  ["UAOS_R31_R40_YAMAHA_PARSER_PLANNING_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_R31_R40_YAMAHA_PARSER_PLANNING_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_R31_R40_YAMAHA_PARSER_PLANNING_SUMMARY",
    version: "R31-R40.0.0",
    status: report.status,
    parserPlanningReady: true,
    allowReadOnlyAnalysis: true,
    allowParserImplementation: false,
    allowFullBinaryParse: false,
    allowWriterImplementation: false,
    allowRealKeyboardBinaryOutput: false,
    allowRealStyOutput: false,
    canExportRealSty: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    nextPhase: "R41 Yamaha parser fixture approval set"
  }, null, 2),
  "utf8"
);

console.log("UAOS R31-R40 YAMAHA PARSER PLANNING GENERATION PASS");
