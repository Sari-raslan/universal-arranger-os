import fs from "node:fs";
import {
  runY71Y80ManualUnlockDecisionGate,
  validateY71Y80ManualUnlockDecisionGate
} from "../src/real-writer-validation/y71-y80/manualUnlockDecisionGate.js";

const report = runY71Y80ManualUnlockDecisionGate();
const valid = validateY71Y80ManualUnlockDecisionGate(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/y71-y80/UAOS_Y71_MANUAL_UNLOCK_DECISION_GATE.json",
  "generated/real-writer-validation/y71-y80/UAOS_Y72_PARSER_UNLOCK_REQUIREMENTS_CHECKLIST.json",
  "generated/real-writer-validation/y71-y80/UAOS_Y73_PREFIX_SCANNER_UNLOCK_BLOCKER.json",
  "generated/real-writer-validation/y71-y80/UAOS_Y74_FULL_PARSE_UNLOCK_BLOCKER.json",
  "generated/real-writer-validation/y71-y80/UAOS_Y75_WRITER_UNLOCK_BLOCKER.json",
  "generated/real-writer-validation/y71-y80/UAOS_Y76_STOP_CONTINUE_DECISION_HANDOVER.json",
  "generated/real-writer-validation/y71-y80/UAOS_Y71_Y80_MANUAL_UNLOCK_DECISION_GATE_REPORT.json",
  "generated/real-writer-validation/y71-y80/UAOS_Y71_Y80_MANUAL_UNLOCK_DECISION_GATE_SUMMARY.json",
  "generated/real-writer-validation/y71-y80/UAOS_MANUAL_UNLOCK_DECISION_GATE_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing Y71-Y80 file: ${file}`);

  if (file.endsWith(".json")) {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    if (
      json.realKeyboardBinaryWriteAllowed === true ||
      json.realWriterReady === true ||
      json.writerUnlockReady === true ||
      json.parserUnlockReady === true ||
      json.fullParseUnlocked === true ||
      json.allowRealKeyboardBinaryOutput === true ||
      json.allowRealStyOutput === true ||
      json.canExportRealSty === true ||
      json.allowFullBinaryParse === true ||
      json.allowParserImplementation === true ||
      json.allowWriterImplementation === true ||
      json.allowBoundedPrefixScannerImplementation === true ||
      json.allowMarkerExtractionImplementation === true ||
      json.deployAllowed === true ||
      json?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
      json?.finalDecision?.allowRealStyOutput === true ||
      json?.finalDecision?.canExportRealSty === true ||
      json?.finalDecision?.allowFullBinaryParse === true ||
      json?.finalDecision?.allowParserImplementation === true ||
      json?.finalDecision?.allowWriterImplementation === true ||
      json?.finalDecision?.allowBoundedPrefixScannerImplementation === true ||
      json?.finalDecision?.allowMarkerExtractionImplementation === true ||
      json?.finalDecision?.continueToParserImplementation === true ||
      json?.finalDecision?.continueToWriterImplementation === true ||
      json?.finalDecision?.parserUnlockReady === true ||
      json?.finalDecision?.writerUnlockReady === true ||
      json?.finalDecision?.fullParseUnlocked === true ||
      json?.finalDecision?.deployAllowed === true
    ) {
      throw new Error(`Unsafe parser/writer/deploy permission in ${file}`);
    }
  }

  console.log(`OK ${file}`);
}

console.log("UAOS Y71-Y80 MANUAL UNLOCK DECISION GATE CHECK PASS");
