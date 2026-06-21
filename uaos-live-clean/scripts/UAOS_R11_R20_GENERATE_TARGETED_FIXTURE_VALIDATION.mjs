import fs from "node:fs";
import path from "node:path";
import {
  runR11R20TargetedFixtureValidation,
  validateR11R20TargetedFixtureValidation
} from "../src/real-writer-validation/r11-r20/targetedFixtureValidation.js";

const outDir = path.resolve("generated/real-writer-validation/r11-r20");
fs.mkdirSync(outDir, { recursive: true });

const report = runR11R20TargetedFixtureValidation();
const valid = validateR11R20TargetedFixtureValidation(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_R11_FIXTURE_TARGET_SELECTION.json", report.reports.r11],
  ["UAOS_R12_DEEP_READ_ONLY_PROFILE.json", report.reports.r12],
  ["UAOS_R13_YAMAHA_STY_CANDIDATE_CLASSIFIER.json", report.reports.r13],
  ["UAOS_R14_CHUNK_MAP_HYPOTHESIS_REPORT.json", report.reports.r14],
  ["UAOS_R15_ROUNDTRIP_READINESS_REPORT.json", report.reports.r15],
  ["UAOS_R16_FIXTURE_RISK_REPORT.json", report.reports.r16],
  ["UAOS_R17_MANUAL_APPROVAL_GATE.json", report.reports.r17],
  ["UAOS_R11_R20_TARGETED_FIXTURE_VALIDATION_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_R11_R20_TARGETED_FIXTURE_VALIDATION_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_R11_R20_TARGETED_FIXTURE_VALIDATION_SUMMARY",
    version: "R11-R20.0.0",
    status: report.status,
    selectedCount: report.finalDecision.selectedCount,
    allowReadOnlyAnalysis: true,
    allowRealKeyboardBinaryOutput: false,
    allowRealStyOutput: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    manualApprovalGateLocked: true,
    nextPhase: "R21 targeted Yamaha parser sandbox, still read-only"
  }, null, 2),
  "utf8"
);

console.log("UAOS R11-R20 TARGETED FIXTURE VALIDATION GENERATION PASS");
