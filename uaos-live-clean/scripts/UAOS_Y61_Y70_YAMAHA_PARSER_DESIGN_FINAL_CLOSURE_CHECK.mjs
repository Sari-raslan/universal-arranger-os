import fs from "node:fs";
import {
  runY61Y70YamahaParserDesignFinalClosure,
  validateY61Y70YamahaParserDesignFinalClosure
} from "../src/real-writer-validation/y61-y70/yamahaParserDesignFinalClosure.js";

const report = runY61Y70YamahaParserDesignFinalClosure();
const valid = validateY61Y70YamahaParserDesignFinalClosure(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/y61-y70/UAOS_Y61_FINAL_PARSER_DESIGN_AUDIT.json",
  "generated/real-writer-validation/y61-y70/UAOS_Y62_YAMAHA_PARSER_DESIGN_MASTER_INDEX.json",
  "generated/real-writer-validation/y61-y70/UAOS_Y63_PARSER_BLOCKED_SAFETY_CERTIFICATE.json",
  "generated/real-writer-validation/y61-y70/UAOS_Y64_WRITER_BLOCKED_SAFETY_CERTIFICATE.json",
  "generated/real-writer-validation/y61-y70/UAOS_Y65_FINAL_PARSER_DESIGN_HANDOVER.json",
  "generated/real-writer-validation/y61-y70/UAOS_Y66_FINAL_DASHBOARD_DATA.json",
  "generated/real-writer-validation/y61-y70/UAOS_Y61_Y70_YAMAHA_PARSER_DESIGN_FINAL_CLOSURE_REPORT.json",
  "generated/real-writer-validation/y61-y70/UAOS_Y61_Y70_YAMAHA_PARSER_DESIGN_FINAL_CLOSURE_SUMMARY.json",
  "generated/real-writer-validation/y61-y70/UAOS_YAMAHA_PARSER_DESIGN_FINAL_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing Y61-Y70 file: ${file}`);

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

console.log("UAOS Y61-Y70 YAMAHA PARSER DESIGN FINAL CLOSURE CHECK PASS");
