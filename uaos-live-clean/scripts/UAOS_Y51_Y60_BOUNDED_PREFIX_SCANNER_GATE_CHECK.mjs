import fs from "node:fs";
import {
  runY51Y60BoundedPrefixScannerGate,
  validateY51Y60BoundedPrefixScannerGate
} from "../src/real-writer-validation/y51-y60/boundedPrefixScannerGate.js";

const report = runY51Y60BoundedPrefixScannerGate();
const valid = validateY51Y60BoundedPrefixScannerGate(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/y51-y60/UAOS_Y51_BOUNDED_PREFIX_SCANNER_IMPLEMENTATION_GATE.json",
  "generated/real-writer-validation/y51-y60/UAOS_Y52_PREFIX_SCAN_EXECUTION_PLAN.json",
  "generated/real-writer-validation/y51-y60/UAOS_Y53_MARKER_EXTRACTION_CONTRACT.json",
  "generated/real-writer-validation/y51-y60/UAOS_Y54_SAFE_PREFIX_SCAN_RESULT_SCHEMA.json",
  "generated/real-writer-validation/y51-y60/UAOS_Y55_PARSER_UNLOCK_BLOCKER.json",
  "generated/real-writer-validation/y51-y60/UAOS_Y56_WRITER_LOCK_CERTIFICATE.json",
  "generated/real-writer-validation/y51-y60/UAOS_Y51_Y60_BOUNDED_PREFIX_SCANNER_GATE_REPORT.json",
  "generated/real-writer-validation/y51-y60/UAOS_Y51_Y60_BOUNDED_PREFIX_SCANNER_GATE_SUMMARY.json",
  "generated/real-writer-validation/y51-y60/UAOS_BOUNDED_PREFIX_SCANNER_GATE_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing Y51-Y60 file: ${file}`);

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

console.log("UAOS Y51-Y60 BOUNDED PREFIX SCANNER GATE CHECK PASS");
