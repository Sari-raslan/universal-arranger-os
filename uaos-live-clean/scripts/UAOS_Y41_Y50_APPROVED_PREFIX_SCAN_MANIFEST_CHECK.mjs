import fs from "node:fs";
import {
  runY41Y50ApprovedPrefixScanManifest,
  validateY41Y50ApprovedPrefixScanManifest
} from "../src/real-writer-validation/y41-y50/approvedPrefixScanManifest.js";

const report = runY41Y50ApprovedPrefixScanManifest();
const valid = validateY41Y50ApprovedPrefixScanManifest(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/y41-y50/UAOS_Y41_APPROVED_PREFIX_SCAN_MANIFEST.json",
  "generated/real-writer-validation/y41-y50/UAOS_Y42_BOUNDED_PREFIX_SCANNER_CONTRACT.json",
  "generated/real-writer-validation/y41-y50/UAOS_Y43_MARKER_INDEX_PREFLIGHT.json",
  "generated/real-writer-validation/y41-y50/UAOS_Y44_PREFIX_SCAN_SAFETY_REPORT.json",
  "generated/real-writer-validation/y41-y50/UAOS_Y45_PARSER_UNLOCK_GATE.json",
  "generated/real-writer-validation/y41-y50/UAOS_Y46_WRITER_GATE.json",
  "generated/real-writer-validation/y41-y50/UAOS_Y41_Y50_APPROVED_PREFIX_SCAN_MANIFEST_REPORT.json",
  "generated/real-writer-validation/y41-y50/UAOS_Y41_Y50_APPROVED_PREFIX_SCAN_MANIFEST_SUMMARY.json",
  "generated/real-writer-validation/y41-y50/UAOS_APPROVED_PREFIX_SCAN_MANIFEST_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing Y41-Y50 file: ${file}`);

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
      json?.finalDecision?.fullParseUnlocked === true ||
      json?.finalDecision?.deployAllowed === true
    ) {
      throw new Error(`Unsafe parser/writer/deploy permission in ${file}`);
    }
  }

  console.log(`OK ${file}`);
}

console.log("UAOS Y41-Y50 APPROVED PREFIX SCAN MANIFEST CHECK PASS");
