import fs from "node:fs";
import path from "node:path";
import {
  createRealWriterValidationFinalGate,
  validateRealWriterValidationFinalGate
} from "../src/real-writer-validation/final/realWriterValidationFinalGate.js";

const outDir = path.resolve("generated/real-writer-validation/final");
fs.mkdirSync(outDir, { recursive: true });

const gate = createRealWriterValidationFinalGate();
const valid = validateRealWriterValidationFinalGate(gate);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "UAOS_REAL_WRITER_VALIDATION_FINAL_GATE.json"),
  JSON.stringify(gate, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_REAL_WRITER_VALIDATION_FINAL_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_REAL_WRITER_VALIDATION_FINAL_SUMMARY",
    version: "R7-R10.0.0",
    status: gate.status,
    requiredFileCount: gate.requiredFileCount,
    passedFileCount: gate.passedFileCount,
    failedFileCount: gate.failedFileCount,
    validationBaselineReady: gate.finalDecision.validationBaselineReady,
    allowReadOnlyAnalysis: true,
    allowFixtureMetadataIndex: true,
    allowRealKeyboardBinaryOutput: false,
    allowRealStyOutput: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    nextRecommendedWork: gate.nextRecommendedWork
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_REAL_WRITER_VALIDATION_HANDOVER.md"),
  [
    "# UAOS Real Keyboard Binary Writer Validation Program",
    "",
    "Status: VALIDATION_PROGRAM_SAFE_BASELINE_READY",
    "",
    "Completed:",
    "- R1 Fixture Collector",
    "- R2 Read-only Binary Analyzer",
    "- R3 Yamaha STY Analyzer",
    "- R4 Roundtrip Test Harness",
    "- R5 Checksum / Chunk Validator",
    "- R6 Experimental Writer Gate Locked",
    "- R7-R10 Final Validation Gate + Safe Push",
    "",
    "Allowed:",
    "- Metadata-only fixture indexing",
    "- Header-limited read-only analysis",
    "- Safe JSON reports",
    "",
    "Blocked:",
    "- Writing real .STY",
    "- Writing real .SET",
    "- Writing real .PRS",
    "- Writing real .STL",
    "- Writing real .PAT/.MSP/.KST",
    "- Modifying fixture files",
    "",
    "Next recommended work:",
    "R11 User-approved fixture target selection.",
    "",
    "Important:",
    "This program still does not write real proprietary keyboard binary files."
  ].join("\n"),
  "utf8"
);

console.log("UAOS R7-R10 FINAL VALIDATION GATE GENERATION PASS");
