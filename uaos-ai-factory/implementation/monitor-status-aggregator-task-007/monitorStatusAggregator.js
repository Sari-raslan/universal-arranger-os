import fs from "node:fs";
import path from "node:path";

const PRODUCT_NAME = "UAOS / AE Platform";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function countPassedFixtures(results) {
  return (results.fixtureResults || []).filter((fixture) => fixture.matchedExpectation).length;
}

function firstHeading(markdown, fallback) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function validatorSummary(results) {
  return {
    name: results.validator,
    task: results.task,
    status: results.status,
    generatedAt: results.generatedAt,
    fixturesChecked: (results.fixtureResults || []).length,
    fixturesMatchedExpectation: countPassedFixtures(results),
    safety: {
      appJsTouched: Boolean(results.safety?.appJsTouched),
      deployAttempted: Boolean(results.safety?.deployAttempted),
      paymentCode: Boolean(results.safety?.paymentCode),
      keyboardOutputCreated: Boolean(results.safety?.keyboardOutputCreated),
      proprietaryCopying: Boolean(results.safety?.proprietaryCopying),
      jobcenterFoldersTouched: Boolean(results.safety?.jobcenterFoldersTouched)
    }
  };
}

export function aggregateMonitorStatus({ inputPaths, generatedAt = new Date().toISOString() }) {
  const run004Status = readJson(inputPaths.run004Status);
  const run004Dashboard = readText(inputPaths.run004Dashboard);
  const run004FinalReport = readText(inputPaths.run004FinalReport);
  const arrangerResults = readJson(inputPaths.arrangerResults);
  const libraryResults = readJson(inputPaths.libraryResults);

  const validators = {
    arrangerPlanValidator: validatorSummary(arrangerResults),
    libraryMetadataValidator: validatorSummary(libraryResults)
  };

  const safetyStatus = {
    appJsUntouched:
      run004Status.safety?.appJsTouched === false &&
      validators.arrangerPlanValidator.safety.appJsTouched === false &&
      validators.libraryMetadataValidator.safety.appJsTouched === false,
    noDeploy:
      run004Status.safety?.deployAttempted === false &&
      validators.arrangerPlanValidator.safety.deployAttempted === false &&
      validators.libraryMetadataValidator.safety.deployAttempted === false,
    noPayment:
      run004Status.safety?.paymentCode === false &&
      validators.arrangerPlanValidator.safety.paymentCode === false &&
      validators.libraryMetadataValidator.safety.paymentCode === false,
    noKeyboardOutput:
      run004Status.safety?.keyboardOutput === false &&
      validators.arrangerPlanValidator.safety.keyboardOutputCreated === false &&
      validators.libraryMetadataValidator.safety.keyboardOutputCreated === false,
    noProprietaryCopying:
      run004Status.safety?.proprietarySampleCopying === false &&
      validators.arrangerPlanValidator.safety.proprietaryCopying === false &&
      validators.libraryMetadataValidator.safety.proprietaryCopying === false,
    noJobcenterFinalFolderChanges:
      run004Status.safety?.jobcenterFinalFoldersTouched === false &&
      validators.arrangerPlanValidator.safety.jobcenterFoldersTouched === false &&
      validators.libraryMetadataValidator.safety.jobcenterFoldersTouched === false
  };

  return {
    productName: PRODUCT_NAME,
    generatedAt,
    sourceInputs: inputPaths,
    run004: {
      status: run004Status.status,
      summary: firstHeading(run004FinalReport, "UAOS Continuous Agency Run 004"),
      dashboardTitle: firstHeading(run004Dashboard, "UAOS Run 004 Dashboard"),
      completedCyclesCount: run004Status.cyclesCompleted,
      currentCycle: run004Status.currentCycle,
      latestCompletedCycle: run004Status.latestCompletedCycle,
      nextActionFromRun: run004Status.nextAction
    },
    completedCyclesCount: run004Status.cyclesCompleted,
    latestValidatorStatus: validators,
    safetyStatus,
    currentRealAssets: {
      specs: [
        "Continuous Agency Run 004 product specs and final report",
        "Arranger intelligence plan validation rules",
        "Library Factory metadata and Oriental Strings schema rules"
      ],
      validators: [
        "arrangerPlanValidator",
        "libraryMetadataValidator",
        "monitorStatusAggregator"
      ],
      qaReports: [
        "UAOS_ARRANGER_PLAN_VALIDATOR_TASK_005_RESULTS.json",
        "UAOS_LIBRARY_METADATA_VALIDATOR_TASK_006_RESULTS.json",
        "UAOS_MONITOR_STATUS_AGGREGATOR_TASK_007_REPORT.md"
      ],
      dashboards: [
        "UAOS_24H_CONTINUOUS_AGENCY_RUN_004_DASHBOARD.md",
        "UAOS_MONITOR_STATUS_AGGREGATED_TASK_007.md"
      ]
    },
    blockedItems: [
      "real keyboard writer",
      "proprietary output",
      "commercial samples",
      "payment",
      "deployment unless approved"
    ],
    nextRecommendedTasks: [
      "productQACore",
      "validator integration",
      "safe test fixture expansion",
      "monitor UI integration later with approval"
    ],
    noFalseClaimsStatement:
      "This status describes local specs, validators, QA reports, and dashboard outputs only. It does not claim a commercial launch, revenue, hardware transfer, proprietary output, or deployment approval.",
    overallStatus:
      run004Status.status === "PASS" &&
      arrangerResults.status === "PASS" &&
      libraryResults.status === "PASS" &&
      Object.values(safetyStatus).every(Boolean)
        ? "PASS"
        : "REVIEW_REQUIRED"
  };
}

export function renderMonitorStatusMarkdown(status) {
  const validatorRows = Object.entries(status.latestValidatorStatus)
    .map(([key, validator]) => `| ${key} | ${validator.status} | ${validator.fixturesMatchedExpectation}/${validator.fixturesChecked} |`)
    .join("\n");

  const safetyRows = Object.entries(status.safetyStatus)
    .map(([key, value]) => `| ${key} | ${value ? "PASS" : "REVIEW"} |`)
    .join("\n");

  return `# UAOS Monitor Status Aggregated Task 007

Status: ${status.overallStatus}

Generated: ${status.generatedAt}

Product: ${status.productName}

## Run 004 Summary

- Run status: ${status.run004.status}
- Completed cycles: ${status.completedCyclesCount}
- Current cycle: ${status.run004.currentCycle}
- Latest completed cycle: ${status.run004.latestCompletedCycle?.id || "n/a"} - ${status.run004.latestCompletedCycle?.name || "n/a"} (${status.run004.latestCompletedCycle?.status || "n/a"})
- Source summary: ${status.run004.summary}

## Validator Status

| Validator | Status | Fixtures matched |
| --- | --- | --- |
${validatorRows}

## Safety Status

| Gate | Status |
| --- | --- |
${safetyRows}

## Current Real Assets

- Specs: ${status.currentRealAssets.specs.join("; ")}
- Validators: ${status.currentRealAssets.validators.join("; ")}
- QA reports: ${status.currentRealAssets.qaReports.join("; ")}
- Dashboards: ${status.currentRealAssets.dashboards.join("; ")}

## Blocked Items

${status.blockedItems.map((item) => `- ${item}`).join("\n")}

## Next Recommended Tasks

${status.nextRecommendedTasks.map((item) => `- ${item}`).join("\n")}

## No False Claims Statement

${status.noFalseClaimsStatement}
`;
}
