import fs from "node:fs";
import path from "node:path";
import {
  runY11Y20ManualFixtureApprovalRegistry,
  validateY11Y20ManualFixtureApprovalRegistry
} from "../src/real-writer-validation/y11-y20/manualFixtureApprovalRegistry.js";

const outDir = path.resolve("generated/real-writer-validation/y11-y20");
fs.mkdirSync(outDir, { recursive: true });

const report = runY11Y20ManualFixtureApprovalRegistry();
const valid = validateY11Y20ManualFixtureApprovalRegistry(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_Y11_MANUAL_FIXTURE_APPROVAL_REGISTRY.json", report.reports.y11],
  ["UAOS_Y12_APPROVED_PATH_POLICY.json", report.reports.y12],
  ["UAOS_Y13_FULL_PARSE_PERMISSION_GATE.json", report.reports.y13],
  ["UAOS_Y14_PARSER_IMPLEMENTATION_PREFLIGHT.json", report.reports.y14],
  ["UAOS_Y15_FIXTURE_PRIVACY_SAFETY_GATE.json", report.reports.y15],
  ["UAOS_Y16_LOCAL_APPROVAL_HANDOVER.json", report.reports.y16],
  ["UAOS_Y11_Y20_MANUAL_FIXTURE_APPROVAL_REGISTRY_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_Y11_Y20_MANUAL_FIXTURE_APPROVAL_REGISTRY_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_Y11_Y20_MANUAL_FIXTURE_APPROVAL_REGISTRY_SUMMARY",
    version: "Y11-Y20.0.0",
    status: report.status,
    approvalRegistryReady: true,
    parserUnlockReady: false,
    allowReadOnlyAnalysis: true,
    allowFullBinaryParse: false,
    allowParserImplementation: false,
    allowWriterImplementation: false,
    allowRealKeyboardBinaryOutput: false,
    allowRealStyOutput: false,
    canExportRealSty: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    deployAllowed: false,
    nextPhase: "Y21 approved fixture manifest, still no writer"
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_YAMAHA_FIXTURE_APPROVAL_REGISTRY_HANDOVER.md"),
  [
    "# UAOS Yamaha Fixture Approval Registry Handover",
    "",
    "Status: APPROVAL_REGISTRY_READY_BUT_LOCKED",
    "",
    "Ready:",
    "- approval registry template",
    "- approved path policy",
    "- full parse permission gate",
    "- parser preflight blocker",
    "- fixture privacy safety gate",
    "",
    "Still blocked:",
    "- full binary parse",
    "- parser implementation",
    "- writer implementation",
    "- real .STY output",
    "- deploy",
    "",
    "Next:",
    "Y21 approved fixture manifest, still no writer."
  ].join("\n"),
  "utf8"
);

console.log("UAOS Y11-Y20 MANUAL FIXTURE APPROVAL REGISTRY GENERATION PASS");
