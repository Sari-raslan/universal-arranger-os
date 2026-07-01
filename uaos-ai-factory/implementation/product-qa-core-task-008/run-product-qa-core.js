import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderOwnerSummary, renderReport, runProductQACore } from "./productQACore.js";

const taskDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(taskDir, "..", "..", "..");

const inputPaths = {
  arrangerResults: path.join(rootDir, "uaos-ai-factory", "implementation", "arranger-plan-validator-task-005", "UAOS_ARRANGER_PLAN_VALIDATOR_TASK_005_RESULTS.json"),
  libraryResults: path.join(rootDir, "uaos-ai-factory", "implementation", "library-metadata-validator-task-006", "UAOS_LIBRARY_METADATA_VALIDATOR_TASK_006_RESULTS.json"),
  monitorAggregatedResults: path.join(rootDir, "uaos-ai-factory", "implementation", "monitor-status-aggregator-task-007", "UAOS_MONITOR_STATUS_AGGREGATED_TASK_007.json")
};

for (const [name, filePath] of Object.entries(inputPaths)) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required input ${name}: ${filePath}`);
  }
}

const results = runProductQACore({ inputPaths });

const resultsPath = path.join(taskDir, "UAOS_PRODUCT_QA_CORE_TASK_008_RESULTS.json");
const reportPath = path.join(taskDir, "UAOS_PRODUCT_QA_CORE_TASK_008_REPORT.md");
const ownerSummaryPath = path.join(taskDir, "UAOS_PRODUCT_QA_CORE_TASK_008_OWNER_SUMMARY.md");

fs.writeFileSync(resultsPath, `${JSON.stringify(results, null, 2)}\n`);
fs.writeFileSync(reportPath, renderReport(results));
fs.writeFileSync(ownerSummaryPath, renderOwnerSummary(results));

console.log(JSON.stringify({
  task: "008",
  core: "productQACore",
  productStatus: results.productStatus,
  arrangerPlanValidator: results.taskStatuses[0].status,
  libraryMetadataValidator: results.taskStatuses[1].status,
  monitorStatusAggregator: results.taskStatuses[2].status,
  resultsPath,
  reportPath,
  ownerSummaryPath
}, null, 2));
