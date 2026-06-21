import fs from "node:fs";
import {
  runR51R60YamahaValidationMasterGate,
  validateR51R60YamahaValidationMasterGate
} from "../src/real-writer-validation/r51-r60/yamahaValidationMasterGate.js";

const report = runR51R60YamahaValidationMasterGate();
const valid = validateR51R60YamahaValidationMasterGate(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/r51-r60/UAOS_R51_REAL_WRITER_VALIDATION_MASTER_GATE.json",
  "generated/real-writer-validation/r51-r60/UAOS_R52_YAMAHA_VALIDATION_MASTER_INDEX.json",
  "generated/real-writer-validation/r51-r60/UAOS_R53_WRITER_UNLOCK_AUDIT.json",
  "generated/real-writer-validation/r51-r60/UAOS_R54_SAFE_BASELINE_RELEASE_MANIFEST.json",
  "generated/real-writer-validation/r51-r60/UAOS_R55_REAL_WRITER_VALIDATION_HANDOVER.json",
  "generated/real-writer-validation/r51-r60/UAOS_R51_R60_YAMAHA_VALIDATION_MASTER_GATE_REPORT.json",
  "generated/real-writer-validation/r51-r60/UAOS_R51_R60_YAMAHA_VALIDATION_MASTER_GATE_SUMMARY.json",
  "generated/real-writer-validation/r51-r60/UAOS_REAL_WRITER_VALIDATION_SAFE_BASELINE_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing R51-R60 file: ${file}`);

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

console.log("UAOS R51-R60 YAMAHA VALIDATION MASTER GATE CHECK PASS");
