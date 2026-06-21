import fs from "node:fs";
import {
  runY31Y40ManualFixtureEntriesPreflight,
  validateY31Y40ManualFixtureEntriesPreflight
} from "../src/real-writer-validation/y31-y40/manualFixtureEntriesPreflight.js";

const report = runY31Y40ManualFixtureEntriesPreflight();
const valid = validateY31Y40ManualFixtureEntriesPreflight(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/y31-y40/UAOS_Y31_MANUAL_FIXTURE_ENTRIES.json",
  "generated/real-writer-validation/y31-y40/UAOS_Y32_LOCAL_PATH_EXISTENCE_VALIDATOR.json",
  "generated/real-writer-validation/y31-y40/UAOS_Y33_REDACTED_APPROVED_MANIFEST_BUILDER.json",
  "generated/real-writer-validation/y31-y40/UAOS_Y34_PARSER_PREFLIGHT_REPORT.json",
  "generated/real-writer-validation/y31-y40/UAOS_Y35_FULL_PARSE_GATE.json",
  "generated/real-writer-validation/y31-y40/UAOS_Y36_WRITER_GATE.json",
  "generated/real-writer-validation/y31-y40/UAOS_Y31_Y40_MANUAL_FIXTURE_ENTRIES_PREFLIGHT_REPORT.json",
  "generated/real-writer-validation/y31-y40/UAOS_Y31_Y40_MANUAL_FIXTURE_ENTRIES_PREFLIGHT_SUMMARY.json",
  "generated/real-writer-validation/y31-y40/UAOS_YAMAHA_MANUAL_FIXTURE_ENTRIES_PREFLIGHT_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing Y31-Y40 file: ${file}`);

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

console.log("UAOS Y31-Y40 MANUAL FIXTURE ENTRIES PREFLIGHT CHECK PASS");
