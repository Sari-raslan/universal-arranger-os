import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderEdgeReport, renderOwnerSummary, runEdgeRegression } from "./edgeRegressionRunner.js";

const taskDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(taskDir, "..", "..", "..");
const fixtureDir = path.join(taskDir, "fixtures");

const inputPaths = {
  task009Results: path.join(rootDir, "uaos-ai-factory", "implementation", "validator-regression-runner-task-009", "UAOS_VALIDATOR_REGRESSION_TASK_009_RESULTS.json"),
  task010Results: path.join(rootDir, "uaos-ai-factory", "implementation", "local-ci-qa-runner-task-010", "UAOS_LOCAL_CI_TASK_010_RESULTS.json"),
  task012Index: path.join(rootDir, "uaos-ai-factory", "implementation", "owner-qa-status-index-task-012", "UAOS_OWNER_QA_STATUS_INDEX_TASK_012.json")
};

for (const [name, filePath] of Object.entries(inputPaths)) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required input ${name}: ${filePath}`);
  }
}

const results = runEdgeRegression({ fixtureDir, inputPaths });

const resultsPath = path.join(taskDir, "UAOS_REGRESSION_EDGE_COVERAGE_TASK_013_RESULTS.json");
const reportPath = path.join(taskDir, "UAOS_REGRESSION_EDGE_COVERAGE_TASK_013_REPORT.md");
const ownerSummaryPath = path.join(taskDir, "UAOS_REGRESSION_EDGE_COVERAGE_TASK_013_OWNER_SUMMARY.md");

fs.writeFileSync(resultsPath, `${JSON.stringify(results, null, 2)}\n`);
fs.writeFileSync(reportPath, renderEdgeReport(results));
fs.writeFileSync(ownerSummaryPath, renderOwnerSummary(results));

console.log(JSON.stringify({
  task: "013",
  runner: "edgeRegressionRunner",
  edgeCoverageStatus: results.edgeCoverageStatus,
  fixturesMatched: `${results.fixtureSummary.matched}/${results.fixtureSummary.total}`,
  task009: results.upstreamStatus.validatorRegressionRunnerTask009,
  task010: results.upstreamStatus.localCiTask010,
  resultsPath,
  reportPath,
  ownerSummaryPath
}, null, 2));
