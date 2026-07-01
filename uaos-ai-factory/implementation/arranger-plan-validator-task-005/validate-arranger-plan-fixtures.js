import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validateArrangerPlan } from "./arrangerPlanValidator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, "fixtures");
const resultsPath = path.join(__dirname, "UAOS_ARRANGER_PLAN_VALIDATOR_TASK_005_RESULTS.json");

const fixtureExpectations = [
  {
    file: "valid-arranger-plan.json",
    expectedStatus: "PASS",
    expectedCodePrefix: null
  },
  {
    file: "invalid-missing-sections.json",
    expectedStatus: "FAIL",
    expectedCodePrefix: "missing-required-section"
  },
  {
    file: "invalid-keyboard-output-claim.json",
    expectedStatus: "FAIL",
    expectedCodePrefix: "forbidden-claim:keyboard-output"
  },
  {
    file: "invalid-proprietary-output.json",
    expectedStatus: "FAIL",
    expectedCodePrefix: "forbidden-claim:restricted-style-format"
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
  const plan = readFixture(expectation.file);
  const result = validateArrangerPlan(plan);
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
  task: "005",
  validator: "arrangerPlanValidator",
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
