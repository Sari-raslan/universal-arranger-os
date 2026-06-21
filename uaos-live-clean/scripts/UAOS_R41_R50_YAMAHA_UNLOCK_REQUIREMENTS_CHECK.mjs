import fs from "node:fs";
import {
  runR41R50YamahaUnlockRequirements,
  validateR41R50YamahaUnlockRequirements
} from "../src/real-writer-validation/r41-r50/yamahaUnlockRequirements.js";

const report = runR41R50YamahaUnlockRequirements();
const valid = validateR41R50YamahaUnlockRequirements(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/r41-r50/UAOS_R41_YAMAHA_FIXTURE_APPROVAL_SET.json",
  "generated/real-writer-validation/r41-r50/UAOS_R42_PARSER_TEST_MATRIX.json",
  "generated/real-writer-validation/r41-r50/UAOS_R43_SEMANTIC_SECTION_MAP.json",
  "generated/real-writer-validation/r41-r50/UAOS_R44_CASM_OTS_BLOCKER_MATRIX.json",
  "generated/real-writer-validation/r41-r50/UAOS_R45_CHECKSUM_BLOCKER_MATRIX.json",
  "generated/real-writer-validation/r41-r50/UAOS_R46_ROUNDTRIP_BLOCKER_MATRIX.json",
  "generated/real-writer-validation/r41-r50/UAOS_R47_WRITER_UNLOCK_REQUIREMENTS.json",
  "generated/real-writer-validation/r41-r50/UAOS_R41_R50_YAMAHA_UNLOCK_REQUIREMENTS_REPORT.json",
  "generated/real-writer-validation/r41-r50/UAOS_R41_R50_YAMAHA_UNLOCK_REQUIREMENTS_SUMMARY.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing R41-R50 file: ${file}`);

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
    json?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
    json?.finalDecision?.allowRealStyOutput === true ||
    json?.finalDecision?.canExportRealSty === true ||
    json?.finalDecision?.allowFullBinaryParse === true ||
    json?.finalDecision?.allowParserImplementation === true ||
    json?.finalDecision?.allowWriterImplementation === true ||
    json?.finalDecision?.continueToWriterImplementation === true ||
    json?.finalDecision?.writerUnlockReady === true
  ) {
    throw new Error(`Unsafe writer/parser permission in ${file}`);
  }

  console.log(`OK ${file}`);
}

console.log("UAOS R41-R50 YAMAHA UNLOCK REQUIREMENTS CHECK PASS");
