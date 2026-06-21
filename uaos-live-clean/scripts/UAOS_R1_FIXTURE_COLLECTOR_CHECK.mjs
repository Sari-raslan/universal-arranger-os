import fs from "node:fs";
import {
  createFixtureCollectionReport,
  validateFixtureCollectionReport
} from "../src/real-writer-validation/r1-fixtures/fixtureCollector.js";

const report = createFixtureCollectionReport({
  roots: [],
  options: { maxFiles: 1 }
});

const valid = validateFixtureCollectionReport(report);
if (!valid.ok) throw new Error(valid.errors.join(", "));

const required = [
  "generated/real-writer-validation/r1-fixtures/UAOS_R1_FIXTURE_COLLECTION_REPORT.json",
  "generated/real-writer-validation/r1-fixtures/UAOS_R1_FIXTURE_COLLECTION_SUMMARY.json",
  "generated/real-writer-validation/r1-fixtures/UAOS_R1_FIXTURE_COLLECTOR_README.md"
];

for (const file of required) {
  if (!fs.existsSync(file)) throw new Error(`Missing R1 file: ${file}`);
  console.log(`OK ${file}`);
}

const summary = JSON.parse(fs.readFileSync("generated/real-writer-validation/r1-fixtures/UAOS_R1_FIXTURE_COLLECTION_SUMMARY.json", "utf8"));

if (
  summary.metadataOnly !== true ||
  summary.copiedFiles !== false ||
  summary.parsedBinaryContent !== false ||
  summary.wroteRealKeyboardBinary !== false ||
  summary.realKeyboardBinaryWriteAllowed !== false
) {
  throw new Error("Unsafe R1 summary flags.");
}

console.log("UAOS R1 FIXTURE COLLECTOR CHECK PASS");
