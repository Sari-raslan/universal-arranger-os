import fs from "node:fs";
import {
  runR2R6ValidationProgram,
  validateR2R6ValidationProgram
} from "../src/real-writer-validation/r2-r6/binaryValidationProgram.js";

const report = runR2R6ValidationProgram();
const valid = validateR2R6ValidationProgram(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/r2-r6/UAOS_R2_READ_ONLY_BINARY_ANALYZER_REPORT.json",
  "generated/real-writer-validation/r2-r6/UAOS_R3_YAMAHA_STY_ANALYZER_REPORT.json",
  "generated/real-writer-validation/r2-r6/UAOS_R4_ROUNDTRIP_TEST_HARNESS_REPORT.json",
  "generated/real-writer-validation/r2-r6/UAOS_R5_CHECKSUM_CHUNK_VALIDATOR_REPORT.json",
  "generated/real-writer-validation/r2-r6/UAOS_R6_EXPERIMENTAL_WRITER_GATE.json",
  "generated/real-writer-validation/r2-r6/UAOS_R2_R6_VALIDATION_PROGRAM_REPORT.json",
  "generated/real-writer-validation/r2-r6/UAOS_R2_R6_VALIDATION_PROGRAM_SUMMARY.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing generated file: ${file}`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  if (
    json.realKeyboardBinaryWriteAllowed === true ||
    json.realWriterReady === true ||
    json.allowRealKeyboardBinaryOutput === true ||
    json.allowRealStyOutput === true ||
    json.canExportRealSty === true ||
    json?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
    json?.finalDecision?.allowRealStyOutput === true ||
    json?.finalDecision?.canExportRealSty === true
  ) {
    throw new Error(`Unsafe real writer permission in ${file}`);
  }

  console.log(`OK ${file}`);
}

console.log("UAOS R2-R6 VALIDATION PROGRAM CHECK PASS");
