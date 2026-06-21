import fs from "node:fs";
import {
  runY11Y20ManualFixtureApprovalRegistry,
  validateY11Y20ManualFixtureApprovalRegistry
} from "../src/real-writer-validation/y11-y20/manualFixtureApprovalRegistry.js";

const report = runY11Y20ManualFixtureApprovalRegistry();
const valid = validateY11Y20ManualFixtureApprovalRegistry(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/y11-y20/UAOS_Y11_MANUAL_FIXTURE_APPROVAL_REGISTRY.json",
  "generated/real-writer-validation/y11-y20/UAOS_Y12_APPROVED_PATH_POLICY.json",
  "generated/real-writer-validation/y11-y20/UAOS_Y13_FULL_PARSE_PERMISSION_GATE.json",
  "generated/real-writer-validation/y11-y20/UAOS_Y14_PARSER_IMPLEMENTATION_PREFLIGHT.json",
  "generated/real-writer-validation/y11-y20/UAOS_Y15_FIXTURE_PRIVACY_SAFETY_GATE.json",
  "generated/real-writer-validation/y11-y20/UAOS_Y16_LOCAL_APPROVAL_HANDOVER.json",
  "generated/real-writer-validation/y11-y20/UAOS_Y11_Y20_MANUAL_FIXTURE_APPROVAL_REGISTRY_REPORT.json",
  "generated/real-writer-validation/y11-y20/UAOS_Y11_Y20_MANUAL_FIXTURE_APPROVAL_REGISTRY_SUMMARY.json",
  "generated/real-writer-validation/y11-y20/UAOS_YAMAHA_FIXTURE_APPROVAL_REGISTRY_HANDOVER.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing Y11-Y20 file: ${file}`);

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

console.log("UAOS Y11-Y20 MANUAL FIXTURE APPROVAL REGISTRY CHECK PASS");
