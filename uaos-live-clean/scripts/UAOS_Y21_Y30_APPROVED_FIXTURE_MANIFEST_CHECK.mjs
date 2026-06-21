import fs from "node:fs";
import {
  runY21Y30ApprovedFixtureManifest,
  validateY21Y30ApprovedFixtureManifest
} from "../src/real-writer-validation/y21-y30/approvedFixtureManifest.js";

const report = runY21Y30ApprovedFixtureManifest();
const valid = validateY21Y30ApprovedFixtureManifest(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/y21-y30/UAOS_Y21_APPROVED_FIXTURE_MANIFEST.json",
  "generated/real-writer-validation/y21-y30/UAOS_Y22_PARSER_SAFE_INPUT_MODEL.json",
  "generated/real-writer-validation/y21-y30/UAOS_Y23_REDACTED_FIXTURE_REPORT.json",
  "generated/real-writer-validation/y21-y30/UAOS_Y24_LOCAL_ONLY_ANALYSIS_POLICY.json",
  "generated/real-writer-validation/y21-y30/UAOS_Y25_PARSER_UNLOCK_BLOCKER.json",
  "generated/real-writer-validation/y21-y30/UAOS_Y26_NEXT_PARSER_ROADMAP.json",
  "generated/real-writer-validation/y21-y30/UAOS_Y21_Y30_APPROVED_FIXTURE_MANIFEST_REPORT.json",
  "generated/real-writer-validation/y21-y30/UAOS_Y21_Y30_APPROVED_FIXTURE_MANIFEST_SUMMARY.json",
  "generated/real-writer-validation/y21-y30/UAOS_APPROVED_FIXTURE_MANIFEST_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing Y21-Y30 file: ${file}`);

  if (file.endsWith(".json")) {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    if (
      json.realKeyboardBinaryWriteAllowed === true ||
      json.realWriterReady === true ||
      json.writerUnlockReady === true ||
      json.parserUnlockReady === true ||
      json.fullParsePermissionReady === true ||
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
      json?.finalDecision?.fullParsePermissionReady === true ||
      json?.finalDecision?.deployAllowed === true
    ) {
      throw new Error(`Unsafe parser/writer/deploy permission in ${file}`);
    }
  }

  console.log(`OK ${file}`);
}

console.log("UAOS Y21-Y30 APPROVED FIXTURE MANIFEST CHECK PASS");
