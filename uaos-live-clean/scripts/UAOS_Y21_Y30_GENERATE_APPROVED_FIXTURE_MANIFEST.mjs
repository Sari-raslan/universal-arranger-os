import fs from "node:fs";
import path from "node:path";
import {
  runY21Y30ApprovedFixtureManifest,
  validateY21Y30ApprovedFixtureManifest
} from "../src/real-writer-validation/y21-y30/approvedFixtureManifest.js";

const outDir = path.resolve("generated/real-writer-validation/y21-y30");
fs.mkdirSync(outDir, { recursive: true });

const report = runY21Y30ApprovedFixtureManifest();
const valid = validateY21Y30ApprovedFixtureManifest(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_Y21_APPROVED_FIXTURE_MANIFEST.json", report.reports.y21],
  ["UAOS_Y22_PARSER_SAFE_INPUT_MODEL.json", report.reports.y22],
  ["UAOS_Y23_REDACTED_FIXTURE_REPORT.json", report.reports.y23],
  ["UAOS_Y24_LOCAL_ONLY_ANALYSIS_POLICY.json", report.reports.y24],
  ["UAOS_Y25_PARSER_UNLOCK_BLOCKER.json", report.reports.y25],
  ["UAOS_Y26_NEXT_PARSER_ROADMAP.json", report.reports.y26],
  ["UAOS_Y21_Y30_APPROVED_FIXTURE_MANIFEST_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_Y21_Y30_APPROVED_FIXTURE_MANIFEST_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_Y21_Y30_APPROVED_FIXTURE_MANIFEST_SUMMARY",
    version: "Y21-Y30.0.0",
    status: report.status,
    approvedFixtureManifestBaselineReady: true,
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
    nextPhase: "Y31 manual fixture entries, still no writer"
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_APPROVED_FIXTURE_MANIFEST_HANDOVER.md"),
  [
    "# UAOS Approved Fixture Manifest Handover",
    "",
    "Status: APPROVED_FIXTURE_MANIFEST_BASELINE_READY_BUT_LOCKED",
    "",
    "Ready:",
    "- approved fixture manifest schema",
    "- parser-safe input model",
    "- redacted fixture report policy",
    "- local-only analysis policy",
    "- parser unlock blocker",
    "- next parser roadmap",
    "",
    "Still blocked:",
    "- full binary parse",
    "- parser implementation",
    "- writer implementation",
    "- real .STY output",
    "- deploy",
    "",
    "Next:",
    "Y31 manual fixture entries, still no writer."
  ].join("\n"),
  "utf8"
);

console.log("UAOS Y21-Y30 APPROVED FIXTURE MANIFEST GENERATION PASS");
