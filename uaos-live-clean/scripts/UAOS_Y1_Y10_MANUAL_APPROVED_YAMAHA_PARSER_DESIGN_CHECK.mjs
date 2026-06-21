import fs from "node:fs";
import {
  runY1Y10ManualApprovedYamahaParserDesign,
  validateY1Y10ManualApprovedYamahaParserDesign
} from "../src/real-writer-validation/y1-y10/manualApprovedYamahaParserDesign.js";

const report = runY1Y10ManualApprovedYamahaParserDesign();
const valid = validateY1Y10ManualApprovedYamahaParserDesign(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/y1-y10/UAOS_Y1_MANUAL_APPROVED_FIXTURE_SET.json",
  "generated/real-writer-validation/y1-y10/UAOS_Y2_APPROVAL_RECORD_TEMPLATE.json",
  "generated/real-writer-validation/y1-y10/UAOS_Y3_READ_ONLY_PARSER_DESIGN_SKELETON.json",
  "generated/real-writer-validation/y1-y10/UAOS_Y4_SEMANTIC_PARSER_CONTRACT.json",
  "generated/real-writer-validation/y1-y10/UAOS_Y5_CHUNK_BOUNDARY_CONTRACT.json",
  "generated/real-writer-validation/y1-y10/UAOS_Y6_ROUNDTRIP_VALIDATION_CONTRACT.json",
  "generated/real-writer-validation/y1-y10/UAOS_Y7_PARSER_UNLOCK_GATE.json",
  "generated/real-writer-validation/y1-y10/UAOS_Y1_Y10_MANUAL_APPROVED_YAMAHA_PARSER_DESIGN_REPORT.json",
  "generated/real-writer-validation/y1-y10/UAOS_Y1_Y10_MANUAL_APPROVED_YAMAHA_PARSER_DESIGN_SUMMARY.json",
  "generated/real-writer-validation/y1-y10/UAOS_YAMAHA_PARSER_DESIGN_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing Y1-Y10 file: ${file}`);

  if (file.endsWith(".json")) {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    if (
      json.realKeyboardBinaryWriteAllowed === true ||
      json.realWriterReady === true ||
      json.writerUnlockReady === true ||
      json.parserUnlockReady === true ||
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
      json?.finalDecision?.continueToParserImplementation === true ||
      json?.finalDecision?.continueToWriterImplementation === true ||
      json?.finalDecision?.parserUnlockReady === true ||
      json?.finalDecision?.writerUnlockReady === true ||
      json?.finalDecision?.deployAllowed === true
    ) {
      throw new Error(`Unsafe parser/writer/deploy permission in ${file}`);
    }
  }

  console.log(`OK ${file}`);
}

console.log("UAOS Y1-Y10 MANUAL APPROVED YAMAHA PARSER DESIGN CHECK PASS");
