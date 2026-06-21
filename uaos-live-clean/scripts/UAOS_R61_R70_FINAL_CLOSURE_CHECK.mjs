import fs from "node:fs";
import {
  runR61R70FinalClosure,
  validateR61R70FinalClosure
} from "../src/real-writer-validation/r61-r70/realWriterValidationFinalClosure.js";

const report = runR61R70FinalClosure();
const valid = validateR61R70FinalClosure(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/r61-r70/UAOS_R61_FINAL_CLOSURE_AUDIT.json",
  "generated/real-writer-validation/r61-r70/UAOS_R62_MASTER_HANDOVER_PACK.json",
  "generated/real-writer-validation/r61-r70/UAOS_R63_FINAL_SAFETY_CERTIFICATE.json",
  "generated/real-writer-validation/r61-r70/UAOS_R64_NEXT_WORK_ROADMAP.json",
  "generated/real-writer-validation/r61-r70/UAOS_R65_FINAL_DASHBOARD_DATA.json",
  "generated/real-writer-validation/r61-r70/UAOS_R61_R70_REAL_WRITER_VALIDATION_FINAL_CLOSURE.json",
  "generated/real-writer-validation/r61-r70/UAOS_R61_R70_REAL_WRITER_VALIDATION_FINAL_SUMMARY.json",
  "generated/real-writer-validation/r61-r70/UAOS_REAL_WRITER_VALIDATION_FINAL_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing R61-R70 file: ${file}`);

  if (file.endsWith(".json")) {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    if (
      json.realKeyboardBinaryWriteAllowed === true ||
      json.realWriterReady === true ||
      json.writerUnlockReady === true ||
      json.allowRealKeyboardBinaryOutput === true ||
      json.allowRealStyOutput === true ||
      json.canExportRealSty === true ||
      json.allowFullBinaryParse === true ||
      json.allowParserImplementation === true ||
      json.allowWriterImplementation === true ||
      json.deployAllowed === true ||
      json?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
      json?.finalDecision?.allowRealStyOutput === true ||
      json?.finalDecision?.canExportRealSty === true ||
      json?.finalDecision?.allowFullBinaryParse === true ||
      json?.finalDecision?.allowParserImplementation === true ||
      json?.finalDecision?.allowWriterImplementation === true ||
      json?.finalDecision?.continueToWriterImplementation === true ||
      json?.finalDecision?.writerUnlockReady === true ||
      json?.finalDecision?.deployAllowed === true
    ) {
      throw new Error(`Unsafe writer/parser/deploy permission in ${file}`);
    }
  }

  console.log(`OK ${file}`);
}

console.log("UAOS R61-R70 REAL WRITER VALIDATION FINAL CLOSURE CHECK PASS");
