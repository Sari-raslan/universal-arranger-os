import fs from "node:fs";
import {
  runR31R40YamahaParserPlanning,
  validateR31R40YamahaParserPlanning
} from "../src/real-writer-validation/r31-r40/yamahaParserPlanningGates.js";

const report = runR31R40YamahaParserPlanning();
const valid = validateR31R40YamahaParserPlanning(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/r31-r40/UAOS_R31_VALIDATED_CHUNK_PARSER_PLAN.json",
  "generated/real-writer-validation/r31-r40/UAOS_R32_YAMAHA_SECTION_TABLE_MODEL.json",
  "generated/real-writer-validation/r31-r40/UAOS_R33_CASM_LIKE_RULES_RESEARCH_GATE.json",
  "generated/real-writer-validation/r31-r40/UAOS_R34_OTS_METADATA_RESEARCH_GATE.json",
  "generated/real-writer-validation/r31-r40/UAOS_R35_CHECKSUM_PACKAGE_RULE_PLAN.json",
  "generated/real-writer-validation/r31-r40/UAOS_R36_PARSER_IMPLEMENTATION_READINESS_GATE.json",
  "generated/real-writer-validation/r31-r40/UAOS_R37_WRITER_RISK_BLOCKER.json",
  "generated/real-writer-validation/r31-r40/UAOS_R31_R40_YAMAHA_PARSER_PLANNING_REPORT.json",
  "generated/real-writer-validation/r31-r40/UAOS_R31_R40_YAMAHA_PARSER_PLANNING_SUMMARY.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing R31-R40 file: ${file}`);

  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (
    json.realKeyboardBinaryWriteAllowed === true ||
    json.realWriterReady === true ||
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
    json?.finalDecision?.continueToWriterImplementation === true
  ) {
    throw new Error(`Unsafe writer/parser permission in ${file}`);
  }

  console.log(`OK ${file}`);
}

console.log("UAOS R31-R40 YAMAHA PARSER PLANNING CHECK PASS");
