import fs from "node:fs";
import path from "node:path";
import {
  createFixtureCollectionReport,
  validateFixtureCollectionReport
} from "../src/real-writer-validation/r1-fixtures/fixtureCollector.js";

const outDir = path.resolve("generated/real-writer-validation/r1-fixtures");
fs.mkdirSync(outDir, { recursive: true });

const candidateRoots = [
  process.env.UAOS_FIXTURE_ROOT_1,
  process.env.UAOS_FIXTURE_ROOT_2,
  process.env.UAOS_FIXTURE_ROOT_3,
  process.env.UAOS_FIXTURE_ROOT_4,
  path.join(process.env.USERPROFILE || "", "Desktop"),
  path.join(process.env.USERPROFILE || "", "Downloads"),
  path.join(process.env.USERPROFILE || "", "Documents")
].filter(Boolean);

const uniqueRoots = [...new Set(candidateRoots)];

const report = createFixtureCollectionReport({
  roots: uniqueRoots,
  options: {
    maxFiles: 5000,
    includeHidden: false
  }
});

const valid = validateFixtureCollectionReport(report);
if (!valid.ok) {
  throw new Error(valid.errors.join(", "));
}

fs.writeFileSync(
  path.join(outDir, "UAOS_R1_FIXTURE_COLLECTION_REPORT.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_R1_FIXTURE_COLLECTION_SUMMARY.json"),
  JSON.stringify({
    format: "UAOS_R1_FIXTURE_COLLECTION_SUMMARY",
    version: "R1.0.0",
    phase: "R1",
    status: report.status,
    rootCount: report.roots.length,
    fixtureCount: report.fixtureCount,
    byExtension: report.byExtension,
    byTarget: report.byTarget,
    metadataOnly: true,
    copiedFiles: false,
    parsedBinaryContent: false,
    wroteRealKeyboardBinary: false,
    realKeyboardBinaryWriteAllowed: false,
    nextPhase: "R2 Read-only Binary Analyzer"
  }, null, 2),
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "UAOS_R1_FIXTURE_COLLECTOR_README.md"),
  [
    "# UAOS R1 Fixture Collector",
    "",
    "Status: PASS",
    "",
    "This phase indexes fixture metadata only.",
    "",
    "It does not:",
    "- copy fixture files",
    "- delete files",
    "- parse proprietary binary content",
    "- generate .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST files",
    "",
    "To scan specific folders, run PowerShell with environment variables:",
    "",
    "$env:UAOS_FIXTURE_ROOT_1='D:\\\\YourFolder'",
    "$env:UAOS_FIXTURE_ROOT_2='E:\\\\YourExternalDrive'",
    "",
    "Then run:",
    "node .\\scripts\\UAOS_R1_GENERATE_FIXTURE_COLLECTOR.mjs"
  ].join("\n"),
  "utf8"
);

console.log("UAOS R1 FIXTURE COLLECTOR GENERATION PASS");
console.log(`Fixtures indexed: ${report.fixtureCount}`);
