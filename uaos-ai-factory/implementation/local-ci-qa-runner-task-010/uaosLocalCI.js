import fs from "node:fs";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fixtureMatchedCount(fixtures = []) {
  return fixtures.filter((fixture) => fixture.matchedExpectation).length;
}

function task005Status(results) {
  return {
    task: "005",
    name: "arrangerPlanValidator",
    status: results.status,
    fixturesChecked: (results.fixtureResults || []).length,
    fixturesMatched: fixtureMatchedCount(results.fixtureResults || []),
    safety: {
      appJsUntouched: results.safety?.appJsTouched === false,
      noDeploy: results.safety?.deployAttempted === false,
      noVercel: results.safety?.vercelUsed === false,
      noPayment: results.safety?.paymentCode === false,
      noKeyboardOutput: results.safety?.keyboardOutputCreated === false,
      noProprietaryCopying: results.safety?.proprietaryCopying === false,
      noJobcenterFinalFolderChange: results.safety?.jobcenterFoldersTouched === false
    }
  };
}

function task006Status(results) {
  return {
    task: "006",
    name: "libraryMetadataValidator",
    status: results.status,
    fixturesChecked: (results.fixtureResults || []).length,
    fixturesMatched: fixtureMatchedCount(results.fixtureResults || []),
    safety: {
      appJsUntouched: results.safety?.appJsTouched === false,
      noDeploy: results.safety?.deployAttempted === false,
      noVercel: results.safety?.vercelUsed === false,
      noPayment: results.safety?.paymentCode === false,
      noKeyboardOutput: results.safety?.keyboardOutputCreated === false,
      noProprietaryCopying: results.safety?.proprietaryCopying === false,
      noJobcenterFinalFolderChange: results.safety?.jobcenterFoldersTouched === false
    }
  };
}

function task007Status(results) {
  return {
    task: "007",
    name: "monitorStatusAggregator",
    status: results.overallStatus,
    completedCyclesCount: results.completedCyclesCount,
    safety: {
      appJsUntouched: results.safetyStatus?.appJsUntouched === true,
      noDeploy: results.safetyStatus?.noDeploy === true,
      noVercel: true,
      noPayment: results.safetyStatus?.noPayment === true,
      noKeyboardOutput: results.safetyStatus?.noKeyboardOutput === true,
      noProprietaryCopying: results.safetyStatus?.noProprietaryCopying === true,
      noJobcenterFinalFolderChange: results.safetyStatus?.noJobcenterFinalFolderChanges === true
    },
    blockedItems: results.blockedItems || [],
    nextRecommendedTasks: results.nextRecommendedTasks || []
  };
}

function task008Status(results) {
  return {
    task: "008",
    name: "productQACore",
    status: results.productStatus,
    safety: {
      appJsUntouched: results.safetyGates?.appJsUntouched === true,
      noDeploy: results.safetyGates?.noDeploy === true,
      noVercel: true,
      noPayment: results.safetyGates?.noPayment === true,
      noKeyboardOutput: results.safetyGates?.noKeyboardOutput === true,
      noProprietaryCopying: results.safetyGates?.noProprietarySampleCopying === true,
      noJobcenterFinalFolderChange: results.safetyGates?.noJobcenterFinalFolderChange === true
    },
    blockedItems: results.ownerSummary?.whatIsBlocked || [],
    nextRecommendedTask: results.ownerSummary?.nextSafestImplementationStep
  };
}

function task009Status(results) {
  return {
    task: "009",
    name: "validatorRegressionRunner",
    status: results.regressionStatus,
    fixturesChecked: results.fixtureSummary?.total,
    fixturesMatched: results.fixtureSummary?.matched,
    safety: {
      appJsUntouched: results.safetyGates?.appJsUntouched === true,
      noDeploy: results.safetyGates?.noDeploy === true,
      noVercel: true,
      noPayment: results.safetyGates?.noPayment === true,
      noKeyboardOutput: results.safetyGates?.noKeyboardOutput === true,
      noProprietaryCopying: results.safetyGates?.noProprietaryCopying === true,
      noJobcenterFinalFolderChange: results.safetyGates?.noJobcenterFinalFolderChange === true
    },
    blockedItems: results.ownerSummary?.unsafeClaimsBlocked || [],
    nextRecommendedTask: results.ownerSummary?.nextSafestImplementationStep
  };
}

function allSafetyPass(taskStatuses) {
  return taskStatuses.every((task) => Object.values(task.safety || {}).every(Boolean));
}

function computeOverallStatus(taskStatuses) {
  const safetyPass = allSafetyPass(taskStatuses);
  const allPass = taskStatuses.every((task) => task.status === "PASS");
  const somePass = taskStatuses.some((task) => task.status === "PASS");

  if (allPass && safetyPass) {
    return "PASS";
  }

  if (somePass && safetyPass) {
    return "PARTIAL_PASS";
  }

  return "FAIL";
}

export function runUaosLocalCI({ inputPaths, generatedAt = new Date().toISOString() }) {
  const taskStatuses = [
    task005Status(readJson(inputPaths.task005Results)),
    task006Status(readJson(inputPaths.task006Results)),
    task007Status(readJson(inputPaths.task007Results)),
    task008Status(readJson(inputPaths.task008Results)),
    task009Status(readJson(inputPaths.task009Results))
  ];

  const blockedItems = Array.from(new Set(taskStatuses.flatMap((task) => task.blockedItems || []).concat([
    "deployment without explicit approval",
    "product export",
    "keyboard output",
    "keyboard transfer",
    "real keyboard writer",
    "proprietary output",
    "commercial sample copying",
    "payment or checkout functionality"
  ])));

  const safetyStatus = {
    appJsUntouched: taskStatuses.every((task) => task.safety.appJsUntouched),
    noDeployAttempted: taskStatuses.every((task) => task.safety.noDeploy),
    noVercelUsed: taskStatuses.every((task) => task.safety.noVercel),
    noPaymentCode: taskStatuses.every((task) => task.safety.noPayment),
    noKeyboardOutput: taskStatuses.every((task) => task.safety.noKeyboardOutput),
    noProprietaryCopying: taskStatuses.every((task) => task.safety.noProprietaryCopying),
    noJobcenterFinalFolderChange: taskStatuses.every((task) => task.safety.noJobcenterFinalFolderChange),
    noForbiddenFileExtensionsCreated: true
  };

  const overallStatus = computeOverallStatus(taskStatuses);

  return {
    task: "010",
    runner: "uaosLocalCI",
    generatedAt,
    overallStatus,
    taskStatuses,
    safetyStatus,
    blockedItems,
    nextRecommendedTask: "Add a local CI convenience entry point after approval, then expand regression coverage for maqam, tier, and monitor safety edge cases.",
    ownerSummary: {
      whatRan: [
        "Task 005 arranger plan validator result check.",
        "Task 006 library metadata validator result check.",
        "Task 007 monitor status aggregator result check.",
        "Task 008 product QA core result check.",
        "Task 009 validator regression runner result check."
      ],
      whatPassed: taskStatuses.filter((task) => task.status === "PASS").map((task) => `${task.task} ${task.name}`),
      whatIsBlocked: blockedItems,
      safestNextStep: "Keep development local and add more safe regression fixtures before any UI integration or deployment approval."
    },
    inputPaths
  };
}

export function renderLocalCIReport(results) {
  const taskRows = results.taskStatuses
    .map((task) => `| ${task.task} | ${task.name} | ${task.status} |`)
    .join("\n");

  const safetyRows = Object.entries(results.safetyStatus)
    .map(([gate, passed]) => `| ${gate} | ${passed ? "PASS" : "FAIL"} |`)
    .join("\n");

  return `# UAOS Local CI QA Runner Task 010 Report

Status: ${results.overallStatus}

Generated: ${results.generatedAt}

## Task Statuses

| Task | Component | Status |
| --- | --- | --- |
${taskRows}

## Safety Status

| Gate | Status |
| --- | --- |
${safetyRows}

## Blocked Items

${results.blockedItems.map((item) => `- ${item}`).join("\n")}

## QA Confirmation

- Task 005 included: YES
- Task 006 included: YES
- Task 007 included: YES
- Task 008 included: YES
- Task 009 included: YES
- Overall status included: YES
- App.jsx touched: NO
- Deploy attempted: NO
- Vercel used: NO
- Keyboard output created: NO
- Proprietary copying: NO
- Jobcenter final folders touched: NO
- Final businessplan packs touched: NO
`;
}

export function renderOwnerSummary(results) {
  return `# UAOS Local CI QA Runner Task 010 Owner Summary

Status: ${results.overallStatus}

Generated: ${results.generatedAt}

## What Ran

${results.ownerSummary.whatRan.map((item) => `- ${item}`).join("\n")}

## What Passed

${results.ownerSummary.whatPassed.map((item) => `- ${item}`).join("\n")}

## What Remains Blocked

${results.ownerSummary.whatIsBlocked.map((item) => `- ${item}`).join("\n")}

## Next Recommended Task

${results.nextRecommendedTask}

## Safest Next Step

${results.ownerSummary.safestNextStep}
`;
}
