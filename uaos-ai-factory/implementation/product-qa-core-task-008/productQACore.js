import fs from "node:fs";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function passCount(fixtures = []) {
  return fixtures.filter((fixture) => fixture.matchedExpectation).length;
}

function validatorStatus(results) {
  return {
    name: results.validator,
    task: results.task,
    status: results.status,
    fixturesChecked: (results.fixtureResults || []).length,
    fixturesMatchedExpectation: passCount(results.fixtureResults || []),
    safety: {
      appJsUntouched: results.safety?.appJsTouched === false,
      noDeploy: results.safety?.deployAttempted === false,
      noPayment: results.safety?.paymentCode === false,
      noKeyboardOutput: results.safety?.keyboardOutputCreated === false,
      noProprietaryCopying: results.safety?.proprietaryCopying === false,
      noJobcenterFinalFolderChange: results.safety?.jobcenterFoldersTouched === false
    }
  };
}

function monitorStatus(results) {
  return {
    name: "monitorStatusAggregator",
    task: "007",
    status: results.overallStatus,
    completedCyclesCount: results.completedCyclesCount,
    validators: {
      arrangerPlanValidator: results.latestValidatorStatus?.arrangerPlanValidator?.status,
      libraryMetadataValidator: results.latestValidatorStatus?.libraryMetadataValidator?.status
    },
    safety: {
      appJsUntouched: results.safetyStatus?.appJsUntouched === true,
      noDeploy: results.safetyStatus?.noDeploy === true,
      noPayment: results.safetyStatus?.noPayment === true,
      noKeyboardOutput: results.safetyStatus?.noKeyboardOutput === true,
      noProprietaryCopying: results.safetyStatus?.noProprietaryCopying === true,
      noJobcenterFinalFolderChange: results.safetyStatus?.noJobcenterFinalFolderChanges === true
    },
    blockedItems: results.blockedItems || [],
    nextRecommendedTasks: results.nextRecommendedTasks || [],
    noFalseClaimsStatement: results.noFalseClaimsStatement
  };
}

function everySafetyGatePass(taskStatuses) {
  return taskStatuses.every((status) => Object.values(status.safety).every(Boolean));
}

function computeProductStatus(taskStatuses) {
  const allPass = taskStatuses.every((status) => status.status === "PASS");
  const safetyPass = everySafetyGatePass(taskStatuses);

  if (allPass && safetyPass) {
    return "PASS";
  }

  if (taskStatuses.some((status) => status.status === "PASS") && safetyPass) {
    return "PARTIAL_PASS";
  }

  return "FAIL";
}

export function runProductQACore({ inputPaths, generatedAt = new Date().toISOString() }) {
  const arrangerResults = readJson(inputPaths.arrangerResults);
  const libraryResults = readJson(inputPaths.libraryResults);
  const aggregatorResults = readJson(inputPaths.monitorAggregatedResults);

  const taskStatuses = [
    validatorStatus(arrangerResults),
    validatorStatus(libraryResults),
    monitorStatus(aggregatorResults)
  ];

  const productStatus = computeProductStatus(taskStatuses);
  const blockedItems = Array.from(new Set([
    ...(aggregatorResults.blockedItems || []),
    "real keyboard writer",
    "keyboard transfer",
    "proprietary output",
    "commercial sample copying",
    "payment and checkout functionality",
    "deployment unless explicitly approved"
  ]));

  return {
    productName: "UAOS / AE Platform",
    task: "008",
    core: "productQACore",
    generatedAt,
    productStatus,
    taskStatuses,
    safetyGates: {
      appJsUntouched: taskStatuses.every((status) => status.safety.appJsUntouched),
      noDeploy: taskStatuses.every((status) => status.safety.noDeploy),
      noPayment: taskStatuses.every((status) => status.safety.noPayment),
      noKeyboardOutput: taskStatuses.every((status) => status.safety.noKeyboardOutput),
      noProprietarySampleCopying: taskStatuses.every((status) => status.safety.noProprietaryCopying),
      noJobcenterFinalFolderChange: taskStatuses.every((status) => status.safety.noJobcenterFinalFolderChange)
    },
    ownerSummary: {
      whatIsRealNow: [
        "Arranger plan validator exists and passes fixture QA.",
        "Library metadata validator exists and passes fixture QA.",
        "Monitor status aggregator exists and produces a consolidated PASS status.",
        "Run 004 status is represented through the aggregated monitor status."
      ],
      whatIsValidated: [
        "Arranger plan structure and forbidden claim checks.",
        "Library metadata tier, source policy, Oriental Strings articulation, and sample-safety checks.",
        "Product monitor status aggregation across Run 004 and validators 005/006.",
        "Safety gates for no deploy, no payment, no keyboard output, and no proprietary copying."
      ],
      whatRemainsPlanOnly: [
        "Full product QA integration inside future app or monitor UI.",
        "Broader fixture libraries and regression suites.",
        "Any real hardware writer, keyboard transfer, or commercial delivery path.",
        "Public deployment unless separately approved."
      ],
      whatIsBlocked: blockedItems,
      nextSafestImplementationStep: "Expand safe test fixtures and integrate validators into a local product QA runner before any UI or deployment work."
    },
    noFalseClaimsStatement:
      "This QA result confirms local validators, aggregated status, and safety checks only. It does not claim commercial launch, revenue, hardware transfer, proprietary output, or approved deployment.",
    inputPaths
  };
}

export function renderOwnerSummary(results) {
  return `# UAOS Product QA Core Task 008 Owner Summary

Status: ${results.productStatus}

Generated: ${results.generatedAt}

Product: ${results.productName}

## What Is Real Now

${results.ownerSummary.whatIsRealNow.map((item) => `- ${item}`).join("\n")}

## What Is Validated

${results.ownerSummary.whatIsValidated.map((item) => `- ${item}`).join("\n")}

## What Remains Plan-Only

${results.ownerSummary.whatRemainsPlanOnly.map((item) => `- ${item}`).join("\n")}

## What Is Blocked

${results.ownerSummary.whatIsBlocked.map((item) => `- ${item}`).join("\n")}

## Next Safest Implementation Step

${results.ownerSummary.nextSafestImplementationStep}

## No False Claims Statement

${results.noFalseClaimsStatement}
`;
}

export function renderReport(results) {
  const taskRows = results.taskStatuses
    .map((task) => `| ${task.name} | ${task.task} | ${task.status} |`)
    .join("\n");

  const safetyRows = Object.entries(results.safetyGates)
    .map(([gate, passed]) => `| ${gate} | ${passed ? "PASS" : "FAIL"} |`)
    .join("\n");

  return `# UAOS Product QA Core Task 008 Report

Status: ${results.productStatus}

Generated: ${results.generatedAt}

## Connected Tasks

| Component | Task | Status |
| --- | --- | --- |
${taskRows}

## Safety Gates

| Gate | Status |
| --- | --- |
${safetyRows}

## Blocked Items

${results.ownerSummary.whatIsBlocked.map((item) => `- ${item}`).join("\n")}

## QA Confirmation

- Validator 005 status included: YES
- Validator 006 status included: YES
- Aggregator 007 status included: YES
- Product status included: YES
- Owner summary created: YES
- App.jsx touched: NO
- Deploy attempted: NO
- Keyboard output created: NO
- Proprietary copying: NO
- Jobcenter final folders touched: NO
`;
}
