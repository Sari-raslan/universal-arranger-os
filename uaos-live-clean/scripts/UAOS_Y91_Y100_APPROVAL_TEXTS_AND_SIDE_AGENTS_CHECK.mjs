import fs from "node:fs";
import {
  runY91Y100ApprovalTextsAndSideAgents,
  validateY91Y100ApprovalTextsAndSideAgents
} from "../src/real-writer-validation/y91-y100/approvalTextsAndSideAgents.js";

const report = runY91Y100ApprovalTextsAndSideAgents();
const valid = validateY91Y100ApprovalTextsAndSideAgents(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/y91-y100/UAOS_Y91_APPROVAL_CAPTURE_STATE.json",
  "generated/real-writer-validation/y91-y100/UAOS_Y92_SIDE_AGENT_PREWRITE_PLANS.json",
  "generated/real-writer-validation/y91-y100/UAOS_Y93_PREPARED_FILE_REGISTRY.json",
  "generated/real-writer-validation/y91-y100/UAOS_Y94_APPROVAL_TEXTS_DOCUMENT.json",
  "generated/real-writer-validation/y91-y100/UAOS_Y95_FINAL_SIDE_AGENT_GATE.json",
  "generated/real-writer-validation/y91-y100/UAOS_Y91_Y100_APPROVAL_TEXTS_AND_SIDE_AGENTS_REPORT.json",
  "generated/real-writer-validation/y91-y100/UAOS_Y91_Y100_APPROVAL_TEXTS_AND_SIDE_AGENTS_SUMMARY.json",
  "generated/real-writer-validation/y91-y100/UAOS_APPROVAL_TEXTS_AND_SIDE_AGENTS_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing Y91-Y100 file: ${file}`);

  if (file.endsWith(".json")) {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    if (
      json.realKeyboardBinaryWriteAllowed === true ||
      json.realWriterReady === true ||
      json.writerUnlockReady === true ||
      json.parserUnlockReady === true ||
      json.fullParseUnlocked === true ||
      json.prefixScannerImplementationUnlocked === true ||
      json.implementationFilesWritten === true ||
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
      json?.finalDecision?.implementationFilesWritten === true ||
      json?.finalDecision?.deployAllowed === true
    ) {
      throw new Error(`Unsafe parser/writer/deploy permission in ${file}`);
    }
  }

  console.log(`OK ${file}`);
}

console.log("UAOS Y91-Y100 APPROVAL TEXTS AND SIDE AGENTS CHECK PASS");
