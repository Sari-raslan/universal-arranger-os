import fs from "node:fs";
import path from "node:path";
import {
  runY31Y40ManualFixtureEntriesPreflight,
  validateY31Y40ManualFixtureEntriesPreflight
} from "../src/real-writer-validation/y31-y40/manualFixtureEntriesPreflight.js";

const outDir = path.resolve("generated/real-writer-validation/y31-y40");
fs.mkdirSync(outDir, { recursive: true });

const report = runY31Y40ManualFixtureEntriesPreflight();
const valid = validateY31Y40ManualFixtureEntriesPreflight(report);

if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

const outputs = [
  ["UAOS_Y31_MANUAL_FIXTURE_ENTRIES.json", report.reports.y31],
  ["UAOS_Y32_LOCAL_PATH_EXISTENCE_VALIDATOR.json", report.reports.y32],
  ["UAOS_Y33_REDACTED_APPROVED_MANIFEST_BUILDER.json", report.reports.y33],
  ["UAOS_Y34_PARSER_PREFLIGHT_REPORT.json", report.reports.y34],
  ["UAOS_Y35_FULL_PARSE_GATE.json", report.reports.y35],
  ["UAOS_Y36_WRITER_GATE.json", report.reports.y36],
  ["UAOS_Y31_Y40_MANUAL_FIXTURE_ENTRIES_PREFLIGHT_REPORT.json", report]
];

for (const [name, data] of outputs) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 2), "utf8");
  console.log(`WROTE ${name}`);
}

fs.writeFileSync(
  path.join(outDir, "UAOS_Y31_Y40_MANUAL_FIXTURE_ENTRIES_PREFLIGHT_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_Y31_Y40_MANUAL_FIXTURE_ENTRIES_PREFLIGHT_SUMMARY",
    version: "Y31-Y40.0.0",
    status: report.status,
    manualFixtureEntriesPreflightReady: true,
    fixtureEnvEntries: report.reports.y31.entryCount,
    validStyCandidates: report.reports.y33.approvedMetadataCount,
    parserUnlockReady: false,
    allowReadOnlyAnalysis: true,
    allowSmallPrefixReadOnly: true,
    allowFullBinaryParse: false,
    allowParserImplementation: false,
    allowWriterImplementation: false,
    allowRealKeyboardBinaryOutput: false,
    allowRealStyOutput: false,
    canExportRealSty: false,
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    deployAllowed: false,
    nextPhase: "Y41 approved prefix scan manifest, still no full parse and no writer"
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_YAMAHA_MANUAL_FIXTURE_ENTRIES_PREFLIGHT_HANDOVER.md"),
  [
    "# UAOS Yamaha Manual Fixture Entries Preflight",
    "",
    "Status: PREFLIGHT_READY_BUT_LOCKED",
    "",
    "Optional env vars:",
    "- UAOS_YAMAHA_STY_FIXTURE_1",
    "- UAOS_YAMAHA_STY_FIXTURE_2",
    "- UAOS_YAMAHA_STY_FIXTURE_3",
    "- UAOS_YAMAHA_STY_FIXTURE_4",
    "- UAOS_YAMAHA_STY_FIXTURE_5",
    "",
    "Ready:",
    "- redacted path validation",
    "- local path existence validation",
    "- metadata-only manifest builder",
    "- parser preflight report",
    "- locked full-parse gate",
    "- locked writer gate",
    "",
    "Still blocked:",
    "- full binary parse",
    "- parser implementation",
    "- writer implementation",
    "- real .STY output",
    "- deploy",
    "",
    "Next:",
    "Y41 approved prefix scan manifest, still no full parse and no writer."
  ].join("\n"),
  "utf8"
);

console.log("UAOS Y31-Y40 MANUAL FIXTURE ENTRIES PREFLIGHT GENERATION PASS");
