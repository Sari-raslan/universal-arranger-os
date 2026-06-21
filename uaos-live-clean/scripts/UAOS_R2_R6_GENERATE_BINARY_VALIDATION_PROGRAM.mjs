import fs from "node:fs";
import path from "node:path";
import {
  runR2R6ValidationProgram,
  validateR2R6ValidationProgram
} from "../src/real-writer-validation/r2-r6/binaryValidationProgram.js";

const outDir = path.resolve("generated/real-writer-validation/r2-r6");
fs.mkdirSync(outDir, { recursive: true });

const report = runR2R6ValidationProgram();
const valid = validateR2R6ValidationProgram(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const files = [
  ["UAOS_R2_READ_ONLY_BINARY_ANALYZER_REPORT.json", report.reports.r2],
  ["UAOS_R3_YAMAHA_STY_ANALYZER_REPORT.json", report.reports.r3],
  ["UAOS_R4_ROUNDTRIP_TEST_HARNESS_REPORT.json", report.reports.r4],
  ["UAOS_R5_CHECKSUM_CHUNK_VALIDATOR_REPORT.json", report.reports.r5],
  ["UAOS_R6_EXPERIMENTAL_WRITER_GATE.json", report.reports.r6],
  ["UAOS_R2_R6_VALIDATION_PROGRAM_REPORT.json", report]
];

for (const [name, data] of files) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_R2_R6_VALIDATION_PROGRAM_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_R2_R6_VALIDATION_PROGRAM_SUMMARY",
    version: "R2-R6.0.0",
    status: report.status,
    r2AnalyzedCount: report.reports.r2.analyzedCount,
    r3YamahaCandidateCount: report.reports.r3.candidateCount,
    r4TestCount: report.reports.r4.testCount,
    r5ValidationCount: report.reports.r5.validationCount,
    r6ExperimentalWriterCanStart: false,
    allowRealKeyboardBinaryOutput: false,
    allowRealStyOutput: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    nextPhase: "Manual fixture approval or targeted Yamaha analyzer expansion"
  }, null, 2),
  "utf8"
);

console.log("UAOS R2-R6 VALIDATION PROGRAM GENERATION PASS");
