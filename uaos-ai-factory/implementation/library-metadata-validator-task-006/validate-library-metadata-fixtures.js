import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validateLibraryMetadata } from "./libraryMetadataValidator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, "fixtures");
const resultsPath = path.join(__dirname, "UAOS_LIBRARY_METADATA_VALIDATOR_TASK_006_RESULTS.json");

const fixtureExpectations = [
  {
    file: "valid-oriental-strings-library.json",
    expectedStatus: "PASS",
    expectedCodePrefix: null
  },
  {
    file: "valid-standard-library.json",
    expectedStatus: "PASS",
    expectedCodePrefix: null
  },
  {
    file: "invalid-proprietary-source.json",
    expectedStatus: "FAIL",
    expectedCodePrefix: "invalid-source-policy"
  },
  {
    file: "invalid-kontakt-native-instruments.json",
    expectedStatus: "FAIL",
    expectedCodePrefix: "forbidden-claim:kontakt-copying"
  },
  {
    file: "invalid-missing-articulations.json",
    expectedStatus: "FAIL",
    expectedCodePrefix: "missing-articulations"
  },
  {
    file: "invalid-keyboard-output-claim.json",
    expectedStatus: "FAIL",
    expectedCodePrefix: "forbidden-claim:keyboard-output"
  }
];

function readFixture(file) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, file), "utf8"));
}

function matchesExpectation(result, expected) {
  if (result.status !== expected.expectedStatus) return false;
  if (!expected.expectedCodePrefix) return result.errors.length === 0;
  return result.errors.some((error) => error.code.startsWith(expected.expectedCodePrefix));
}

const fixtureResults = fixtureExpectations.map((expectation) => {
  const library = readFixture(expectation.file);
  const result = validateLibraryMetadata(library);
  return {
    fixture: expectation.file,
    expectedStatus: expectation.expectedStatus,
    expectedCodePrefix: expectation.expectedCodePrefix,
    actualStatus: result.status,
    matchedExpectation: matchesExpectation(result, expectation),
    errors: result.errors,
    warnings: result.warnings
  };
});

const summary = {
  task: "006",
  validator: "libraryMetadataValidator",
  status: fixtureResults.every((result) => result.matchedExpectation) ? "PASS" : "FAIL",
  generatedAt: new Date().toISOString(),
  safety: {
    appJsTouched: false,
    deployAttempted: false,
    vercelUsed: false,
    paymentCode: false,
    keyboardOutputCreated: false,
    proprietaryCopying: false,
    jobcenterFoldersTouched: false
  },
  fixtureResults
};

fs.writeFileSync(resultsPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary, null, 2));
if (summary.status !== "PASS") process.exit(1);
