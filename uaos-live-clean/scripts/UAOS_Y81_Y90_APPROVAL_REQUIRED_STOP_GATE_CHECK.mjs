import fs from "node:fs";
import {
  runY81Y90ApprovalRequiredStopGate,
  validateY81Y90ApprovalRequiredStopGate
} from "../src/real-writer-validation/y81-y90/approvalRequiredStopGate.js";

const report = runY81Y90ApprovalRequiredStopGate();
const valid = validateY81Y90ApprovalRequiredStopGate(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/y81-y90/UAOS_Y81_APPROVAL_REQUIRED_GATE.json",
  "generated/real-writer-validation/y81-y90/UAOS_Y82_EXACT_APPROVAL_PHRASE_VALIDATOR.json",
  "generated/real-writer-validation/y81-y90/UAOS_Y83_PREFIX_SCANNER_IMPLEMENTATION_BLOCKER.json",
  "generated/real-writer-validation/y81-y90/UAOS_Y84_FULL_PARSE_BLOCKER.json",
  "generated/real-writer-validation/y81-y90/UAOS_Y85_WRITER_BLOCKER.json",
  "generated/real-writer-validation/y81-y90/UAOS_Y86_FINAL_STOP_DASHBOARD.json",
  "generated/real-writer-validation/y81-y90/UAOS_Y81_Y90_APPROVAL_REQUIRED_STOP_GATE_REPORT.json",
  "generated/real-writer-validation/y81-y90/UAOS_Y81_Y90_APPROVAL_REQUIRED_STOP_GATE_SUMMARY.json",
  "generated/real-writer-validation/y81-y90/UAOS_APPROVAL_REQUIRED_STOP_GATE_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing Y81-Y90 file: ${file}`);

  if (file.endsWith(".json")) {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    if (
      json.realKeyboardBinaryWriteAllowed === true ||
      json.realWriterReady === true ||
      json.writerUnlockReady === true ||
      json.parserUnlockReady === true ||
      json.fullParseUnlocked === true ||
      json.prefixScannerImplementationUnlocked === true ||
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
      json?.finalDecision?.continueToPrefixScannerImplementation === true ||
      json?.finalDecision?.continueToParserImplementation === true ||
      json?.finalDecision?.continueToWriterImplementation === true ||
      json?.finalDecision?.parserUnlockReady === true ||
      json?.finalDecision?.writerUnlockReady === true ||
      json?.finalDecision?.fullParseUnlocked === true ||
      json?.finalDecision?.prefixScannerImplementationUnlocked === true ||
      json?.finalDecision?.deployAllowed === true
    ) {
      throw new Error(`Unsafe parser/writer/deploy permission in ${file}`);
    }
  }

  console.log(`OK ${file}`);
}

console.log("UAOS Y81-Y90 APPROVAL REQUIRED STOP GATE CHECK PASS");
