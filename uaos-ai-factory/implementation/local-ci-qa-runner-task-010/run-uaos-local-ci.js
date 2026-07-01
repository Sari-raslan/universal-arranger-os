import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderLocalCIReport, renderOwnerSummary, runUaosLocalCI } from "./uaosLocalCI.js";

const taskDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(taskDir, "..", "..", "..");

const inputPaths = {
  task005Results: path.join(rootDir, "uaos-ai-factory", "implementation", "arranger-plan-validator-task-005", "UAOS_ARRANGER_PLAN_VALIDATOR_TASK_005_RESULTS.json"),
  task006Results: path.join(rootDir, "uaos-ai-factory", "implementation", "library-metadata-validator-task-006", "UAOS_LIBRARY_METADATA_VALIDATOR_TASK_006_RESULTS.json"),
  task007Results: path.join(rootDir, "uaos-ai-factory", "implementation", "monitor-status-aggregator-task-007", "UAOS_MONITOR_STATUS_AGGREGATED_TASK_007.json"),
  task008Results: path.join(rootDir, "uaos-ai-factory", "implementation", "product-qa-core-task-008", "UAOS_PRODUCT_QA_CORE_TASK_008_RESULTS.json"),
  task009Results: path.join(rootDir, "uaos-ai-factory", "implementation", "validator-regression-runner-task-009", "UAOS_VALIDATOR_REGRESSION_TASK_009_RESULTS.json")
};

for (const [name, filePath] of Object.entries(inputPaths)) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required input ${name}: ${filePath}`);
  }
}

const results = runUaosLocalCI({ inputPaths });

const resultsPath = path.join(taskDir, "UAOS_LOCAL_CI_TASK_010_RESULTS.json");
const reportPath = path.join(taskDir, "UAOS_LOCAL_CI_TASK_010_REPORT.md");
const ownerSummaryPath = path.join(taskDir, "UAOS_LOCAL_CI_TASK_010_OWNER_SUMMARY.md");

fs.writeFileSync(resultsPath, `${JSON.stringify(results, null, 2)}\n`);
fs.writeFileSync(reportPath, renderLocalCIReport(results));
fs.writeFileSync(ownerSummaryPath, renderOwnerSummary(results));

console.log(JSON.stringify({
  task: "010",
  runner: "uaosLocalCI",
  overallStatus: results.overallStatus,
  taskStatuses: results.taskStatuses.map((task) => `${task.task}:${task.status}`),
  resultsPath,
  reportPath,
  ownerSummaryPath
}, null, 2));
