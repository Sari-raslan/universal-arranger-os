import fs from "node:fs";
import {
  createRealWriterValidationFinalGate,
  validateRealWriterValidationFinalGate
} from "../src/real-writer-validation/final/realWriterValidationFinalGate.js";

const gate = createRealWriterValidationFinalGate();
const valid = validateRealWriterValidationFinalGate(gate);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/final/UAOS_REAL_WRITER_VALIDATION_FINAL_GATE.json",
  "generated/real-writer-validation/final/UAOS_REAL_WRITER_VALIDATION_FINAL_SUMMARY.json",
  "generated/real-writer-validation/final/UAOS_REAL_WRITER_VALIDATION_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing final validation file: ${file}`);
  console.log(`OK ${file}`);
}

const summary = JSON.parse(fs.readFileSync("generated/real-writer-validation/final/UAOS_REAL_WRITER_VALIDATION_FINAL_SUMMARY.json", "utf8"));

if (
  summary.allowRealKeyboardBinaryOutput === true ||
  summary.allowRealStyOutput === true ||
  summary.realKeyboardBinaryWriteAllowed === true ||
  summary.realWriterReady === true
) {
  throw new Error("Unsafe final validation summary.");
}

console.log("UAOS R7-R10 FINAL VALIDATION GATE CHECK PASS");
