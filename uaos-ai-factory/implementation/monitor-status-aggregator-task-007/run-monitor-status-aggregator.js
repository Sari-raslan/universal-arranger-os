import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aggregateMonitorStatus, renderMonitorStatusMarkdown } from "./monitorStatusAggregator.js";

const taskDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(taskDir, "..", "..", "..");

const inputPaths = {
  run004Status: path.join(rootDir, "uaos-ai-factory", "continuous-agency-run-004", "UAOS_24H_CONTINUOUS_AGENCY_RUN_004_STATUS.json"),
  run004Dashboard: path.join(rootDir, "uaos-ai-factory", "continuous-agency-run-004", "UAOS_24H_CONTINUOUS_AGENCY_RUN_004_DASHBOARD.md"),
  run004FinalReport: path.join(rootDir, "uaos-ai-factory", "continuous-agency-run-004", "UAOS_24H_CONTINUOUS_AGENCY_RUN_004_FINAL_REPORT.md"),
  arrangerResults: path.join(rootDir, "uaos-ai-factory", "implementation", "arranger-plan-validator-task-005", "UAOS_ARRANGER_PLAN_VALIDATOR_TASK_005_RESULTS.json"),
  libraryResults: path.join(rootDir, "uaos-ai-factory", "implementation", "library-metadata-validator-task-006", "UAOS_LIBRARY_METADATA_VALIDATOR_TASK_006_RESULTS.json")
};

for (const [name, filePath] of Object.entries(inputPaths)) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required input ${name}: ${filePath}`);
  }
}

const aggregatedStatus = aggregateMonitorStatus({ inputPaths });
const markdown = renderMonitorStatusMarkdown(aggregatedStatus);

const jsonOutputPath = path.join(taskDir, "UAOS_MONITOR_STATUS_AGGREGATED_TASK_007.json");
const markdownOutputPath = path.join(taskDir, "UAOS_MONITOR_STATUS_AGGREGATED_TASK_007.md");

fs.writeFileSync(jsonOutputPath, `${JSON.stringify(aggregatedStatus, null, 2)}\n`);
fs.writeFileSync(markdownOutputPath, markdown);

console.log(JSON.stringify({
  task: "007",
  aggregator: "monitorStatusAggregator",
  status: aggregatedStatus.overallStatus,
  completedCyclesCount: aggregatedStatus.completedCyclesCount,
  arrangerPlanValidator: aggregatedStatus.latestValidatorStatus.arrangerPlanValidator.status,
  libraryMetadataValidator: aggregatedStatus.latestValidatorStatus.libraryMetadataValidator.status,
  jsonOutputPath,
  markdownOutputPath
}, null, 2));
