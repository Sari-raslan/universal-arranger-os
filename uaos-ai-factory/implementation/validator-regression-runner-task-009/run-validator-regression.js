import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderOwnerSummary, renderRegressionReport, runValidatorRegression } from "./validatorRegressionRunner.js";

const taskDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(taskDir, "..", "..", "..");
const fixtureDir = path.join(taskDir, "fixtures");

const inputPaths = {
  monitorAggregatedResults: path.join(rootDir, "uaos-ai-factory", "implementation", "monitor-status-aggregator-task-007", "UAOS_MONITOR_STATUS_AGGREGATED_TASK_007.json"),
  productQaCoreResults: path.join(rootDir, "uaos-ai-factory", "implementation", "product-qa-core-task-008", "UAOS_PRODUCT_QA_CORE_TASK_008_RESULTS.json")
};

for (const [name, filePath] of Object.entries(inputPaths)) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required input ${name}: ${filePath}`);
  }
}

const results = runValidatorRegression({ fixtureDir, inputPaths });

const resultsPath = path.join(taskDir, "UAOS_VALIDATOR_REGRESSION_TASK_009_RESULTS.json");
const reportPath = path.join(taskDir, "UAOS_VALIDATOR_REGRESSION_TASK_009_REPORT.md");
const ownerSummaryPath = path.join(taskDir, "UAOS_VALIDATOR_REGRESSION_TASK_009_OWNER_SUMMARY.md");

fs.writeFileSync(resultsPath, `${JSON.stringify(results, null, 2)}\n`);
fs.writeFileSync(reportPath, renderRegressionReport(results));
fs.writeFileSync(ownerSummaryPath, renderOwnerSummary(results));

console.log(JSON.stringify({
  task: "009",
  runner: "validatorRegressionRunner",
  regressionStatus: results.regressionStatus,
  fixturesMatched: `${results.fixtureSummary.matched}/${results.fixtureSummary.total}`,
  productQACore: results.upstreamStatus.productQACore,
  resultsPath,
  reportPath,
  ownerSummaryPath
}, null, 2));
