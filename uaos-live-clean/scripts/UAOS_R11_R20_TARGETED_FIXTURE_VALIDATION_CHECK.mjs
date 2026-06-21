import fs from "node:fs";
import {
  runR11R20TargetedFixtureValidation,
  validateR11R20TargetedFixtureValidation
} from "../src/real-writer-validation/r11-r20/targetedFixtureValidation.js";

const report = runR11R20TargetedFixtureValidation();
const valid = validateR11R20TargetedFixtureValidation(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/r11-r20/UAOS_R11_FIXTURE_TARGET_SELECTION.json",
  "generated/real-writer-validation/r11-r20/UAOS_R12_DEEP_READ_ONLY_PROFILE.json",
  "generated/real-writer-validation/r11-r20/UAOS_R13_YAMAHA_STY_CANDIDATE_CLASSIFIER.json",
  "generated/real-writer-validation/r11-r20/UAOS_R14_CHUNK_MAP_HYPOTHESIS_REPORT.json",
  "generated/real-writer-validation/r11-r20/UAOS_R15_ROUNDTRIP_READINESS_REPORT.json",
  "generated/real-writer-validation/r11-r20/UAOS_R16_FIXTURE_RISK_REPORT.json",
  "generated/real-writer-validation/r11-r20/UAOS_R17_MANUAL_APPROVAL_GATE.json",
  "generated/real-writer-validation/r11-r20/UAOS_R11_R20_TARGETED_FIXTURE_VALIDATION_REPORT.json",
  "generated/real-writer-validation/r11-r20/UAOS_R11_R20_TARGETED_FIXTURE_VALIDATION_SUMMARY.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing R11-R20 file: ${file}`);

  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (
    json.realKeyboardBinaryWriteAllowed === true ||
    json.realWriterReady === true ||
    json.allowRealKeyboardBinaryOutput === true ||
    json.allowRealStyOutput === true ||
    json.canExportRealSty === true ||
    json?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
    json?.finalDecision?.allowRealStyOutput === true ||
    json?.finalDecision?.canExportRealSty === true ||
    json?.finalDecision?.continueToWriterImplementation === true
  ) {
    throw new Error(`Unsafe writer permission in ${file}`);
  }

  console.log(`OK ${file}`);
}

console.log("UAOS R11-R20 TARGETED FIXTURE VALIDATION CHECK PASS");
