import fs from "node:fs";
import {
  runR21R30YamahaParserSandbox,
  validateR21R30YamahaParserSandbox
} from "../src/real-writer-validation/r21-r30/yamahaParserSandbox.js";

const report = runR21R30YamahaParserSandbox();
const valid = validateR21R30YamahaParserSandbox(report);

if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/r21-r30/UAOS_R21_YAMAHA_PARSER_SANDBOX.json",
  "generated/real-writer-validation/r21-r30/UAOS_R22_SECTION_MARKER_PROBE.json",
  "generated/real-writer-validation/r21-r30/UAOS_R23_MIDI_LIKE_HEADER_PROBE.json",
  "generated/real-writer-validation/r21-r30/UAOS_R24_SAFE_STRUCTURE_MAP.json",
  "generated/real-writer-validation/r21-r30/UAOS_R25_PARSER_READINESS_GATE.json",
  "generated/real-writer-validation/r21-r30/UAOS_R26_PARSER_RISK_GATE.json",
  "generated/real-writer-validation/r21-r30/UAOS_R21_R30_YAMAHA_PARSER_SANDBOX_REPORT.json",
  "generated/real-writer-validation/r21-r30/UAOS_R21_R30_YAMAHA_PARSER_SANDBOX_SUMMARY.json"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing R21-R30 file: ${file}`);

  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  if (
    json.realKeyboardBinaryWriteAllowed === true ||
    json.realWriterReady === true ||
    json.allowRealKeyboardBinaryOutput === true ||
    json.allowRealStyOutput === true ||
    json.canExportRealSty === true ||
    json.allowFullBinaryParse === true ||
    json?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
    json?.finalDecision?.allowRealStyOutput === true ||
    json?.finalDecision?.canExportRealSty === true ||
    json?.finalDecision?.allowFullBinaryParse === true ||
    json?.finalDecision?.continueToWriterImplementation === true
  ) {
    throw new Error(`Unsafe writer/parser permission in ${file}`);
  }

  console.log(`OK ${file}`);
}

console.log("UAOS R21-R30 YAMAHA PARSER SANDBOX CHECK PASS");
