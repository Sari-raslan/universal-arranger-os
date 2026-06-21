import fs from "node:fs";
import path from "node:path";
import {
  runR41R50YamahaUnlockRequirements,
  validateR41R50YamahaUnlockRequirements
} from "../src/real-writer-validation/r41-r50/yamahaUnlockRequirements.js";

const outDir = path.resolve("generated/real-writer-validation/r41-r50");
fs.mkdirSync(outDir, { recursive: true });

const report = runR41R50YamahaUnlockRequirements();
const valid = validateR41R50YamahaUnlockRequirements(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_R41_YAMAHA_FIXTURE_APPROVAL_SET.json", report.reports.r41],
  ["UAOS_R42_PARSER_TEST_MATRIX.json", report.reports.r42],
  ["UAOS_R43_SEMANTIC_SECTION_MAP.json", report.reports.r43],
  ["UAOS_R44_CASM_OTS_BLOCKER_MATRIX.json", report.reports.r44],
  ["UAOS_R45_CHECKSUM_BLOCKER_MATRIX.json", report.reports.r45],
  ["UAOS_R46_ROUNDTRIP_BLOCKER_MATRIX.json", report.reports.r46],
  ["UAOS_R47_WRITER_UNLOCK_REQUIREMENTS.json", report.reports.r47],
  ["UAOS_R41_R50_YAMAHA_UNLOCK_REQUIREMENTS_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_R41_R50_YAMAHA_UNLOCK_REQUIREMENTS_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_R41_R50_YAMAHA_UNLOCK_REQUIREMENTS_SUMMARY",
    version: "R41-R50.0.0",
    status: report.status,
    unlockRequirementsDocumented: true,
    writerUnlockReady: false,
    allowReadOnlyAnalysis: true,
    allowParserImplementation: false,
    allowFullBinaryParse: false,
    allowWriterImplementation: false,
    allowRealKeyboardBinaryOutput: false,
    allowRealStyOutput: false,
    canExportRealSty: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    nextPhase: "R51 real writer validation master gate"
  }, null, 2),
  "utf8"
);

console.log("UAOS R41-R50 YAMAHA UNLOCK REQUIREMENTS GENERATION PASS");
