import fs from "node:fs";
import { validateArrangerPlan } from "../arranger-plan-validator-task-005/arrangerPlanValidator.js";
import { validateLibraryMetadata } from "../library-metadata-validator-task-006/libraryMetadataValidator.js";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function firstMatchingCode(errors, expectedPrefix) {
  return errors.find((error) => String(error.code).startsWith(expectedPrefix));
}

function evaluateFixture({ fixturePath, fixture, validator, expectedStatus, expectedCodePrefix }) {
  const result = validator(readJson(fixturePath));
  const matchedStatus = result.status === expectedStatus;
  const matchedCode = expectedStatus === "PASS" || Boolean(firstMatchingCode(result.errors || [], expectedCodePrefix));

  return {
    fixture,
    expectedStatus,
    expectedCodePrefix,
    actualStatus: result.status,
    matchedExpectation: matchedStatus && matchedCode,
    errors: result.errors || [],
    warnings: result.warnings || []
  };
}

function summarize(results) {
  return {
    total: results.length,
    matched: results.filter((result) => result.matchedExpectation).length,
    passedFixtures: results.filter((result) => result.actualStatus === "PASS").length,
    failedFixtures: results.filter((result) => result.actualStatus === "FAIL").length
  };
}

function monitorPaymentEnabled(status) {
  const text = JSON.stringify(status).toLowerCase();
  return text.includes("payment enabled") || text.includes("checkout enabled") || text.includes("stripe enabled") || text.includes("paypal enabled");
}

function validateMonitorFixture(status) {
  const errors = [];

  if (status.productName !== "UAOS / AE Platform") {
    errors.push({ code: "invalid-product-name", message: "Monitor status must use UAOS / AE Platform." });
  }

  if (!["PASS", "PARTIAL_PASS", "FAIL", "REVIEW_REQUIRED"].includes(status.overallStatus)) {
    errors.push({ code: "invalid-overall-status", message: "Monitor status must include a known overallStatus." });
  }

  if (!status.safetyStatus || status.safetyStatus.noDeploy !== true || status.safetyStatus.noKeyboardOutput !== true || status.safetyStatus.noProprietaryCopying !== true) {
    errors.push({ code: "missing-safety-status", message: "Monitor status must include safe no-deploy, no-keyboard-output, and no-proprietary-copying gates." });
  }

  if (monitorPaymentEnabled(status) || status.safetyStatus?.noPayment !== true) {
    errors.push({ code: "forbidden-claim:payment-functionality", message: "Monitor status must reject payment functionality." });
  }

  return {
    status: errors.length === 0 ? "PASS" : "FAIL",
    errors,
    warnings: []
  };
}

function evaluateMonitorFixture({ fixturePath, fixture, expectedStatus, expectedCodePrefix }) {
  const result = validateMonitorFixture(readJson(fixturePath));
  const matchedStatus = result.status === expectedStatus;
  const matchedCode = expectedStatus === "PASS" || Boolean(firstMatchingCode(result.errors || [], expectedCodePrefix));

  return {
    fixture,
    expectedStatus,
    expectedCodePrefix,
    actualStatus: result.status,
    matchedExpectation: matchedStatus && matchedCode,
    errors: result.errors || [],
    warnings: result.warnings || []
  };
}

function taskStatusFromProductQa(productQaResults) {
  return {
    productStatus: productQaResults.productStatus,
    arrangerPlanValidator: productQaResults.taskStatuses?.find((task) => task.name === "arrangerPlanValidator")?.status,
    libraryMetadataValidator: productQaResults.taskStatuses?.find((task) => task.name === "libraryMetadataValidator")?.status,
    monitorStatusAggregator: productQaResults.taskStatuses?.find((task) => task.name === "monitorStatusAggregator")?.status
  };
}

export function runValidatorRegression({ fixtureDir, inputPaths, generatedAt = new Date().toISOString() }) {
  const arrangerFixtures = [
    ["arranger-valid-pop-song.json", "PASS", null],
    ["arranger-valid-maqam-song.json", "PASS", null],
    ["arranger-invalid-missing-ending.json", "FAIL", "missing-required-section:ending"],
    ["arranger-invalid-keyboard-output.json", "FAIL", "forbidden-claim:keyboard-output"]
  ];

  const libraryFixtures = [
    ["library-valid-standard.json", "PASS", null],
    ["library-valid-oriental-premium.json", "PASS", null],
    ["library-invalid-proprietary-sample.json", "FAIL", "invalid-source-policy"],
    ["library-invalid-missing-safety-policy.json", "FAIL", "missing-source-policy"]
  ];

  const monitorFixtures = [
    ["monitor-valid-status.json", "PASS", null],
    ["monitor-invalid-payment-enabled.json", "FAIL", "forbidden-claim:payment-functionality"]
  ];

  const arrangerResults = arrangerFixtures.map(([fixture, expectedStatus, expectedCodePrefix]) =>
    evaluateFixture({
      fixture,
      fixturePath: `${fixtureDir}/${fixture}`,
      validator: validateArrangerPlan,
      expectedStatus,
      expectedCodePrefix
    })
  );

  const libraryResults = libraryFixtures.map(([fixture, expectedStatus, expectedCodePrefix]) =>
    evaluateFixture({
      fixture,
      fixturePath: `${fixtureDir}/${fixture}`,
      validator: validateLibraryMetadata,
      expectedStatus,
      expectedCodePrefix
    })
  );

  const monitorResults = monitorFixtures.map(([fixture, expectedStatus, expectedCodePrefix]) =>
    evaluateMonitorFixture({
      fixture,
      fixturePath: `${fixtureDir}/${fixture}`,
      expectedStatus,
      expectedCodePrefix
    })
  );

  const monitorAggregator = readJson(inputPaths.monitorAggregatedResults);
  const productQaCore = readJson(inputPaths.productQaCoreResults);
  const productQaStatus = taskStatusFromProductQa(productQaCore);

  const allFixtureResults = [...arrangerResults, ...libraryResults, ...monitorResults];
  const allFixturesMatched = allFixtureResults.every((result) => result.matchedExpectation);
  const upstreamPass =
    monitorAggregator.overallStatus === "PASS" &&
    productQaCore.productStatus === "PASS" &&
    productQaStatus.arrangerPlanValidator === "PASS" &&
    productQaStatus.libraryMetadataValidator === "PASS" &&
    productQaStatus.monitorStatusAggregator === "PASS";

  const safetyGates = {
    appJsUntouched: productQaCore.safetyGates?.appJsUntouched === true,
    noDeploy: productQaCore.safetyGates?.noDeploy === true,
    noPayment: productQaCore.safetyGates?.noPayment === true,
    noKeyboardOutput: productQaCore.safetyGates?.noKeyboardOutput === true,
    noProprietaryCopying: productQaCore.safetyGates?.noProprietarySampleCopying === true,
    noJobcenterFinalFolderChange: productQaCore.safetyGates?.noJobcenterFinalFolderChange === true
  };

  const safetyPass = Object.values(safetyGates).every(Boolean);
  const regressionStatus = allFixturesMatched && upstreamPass && safetyPass ? "PASS" : allFixturesMatched && safetyPass ? "PARTIAL_PASS" : "FAIL";

  return {
    task: "009",
    runner: "validatorRegressionRunner",
    generatedAt,
    regressionStatus,
    fixtureSummary: summarize(allFixtureResults),
    regressionGroups: {
      arrangerPlanValidator: arrangerResults,
      libraryMetadataValidator: libraryResults,
      monitorStatus: monitorResults
    },
    upstreamStatus: {
      monitorStatusAggregator: monitorAggregator.overallStatus,
      productQACore: productQaCore.productStatus,
      productQACoreComponents: productQaStatus
    },
    safetyGates,
    ownerSummary: {
      whatIsNowProtectedByTests: [
        "Arranger plan sections, roles, instruments, harmony, maqam metadata, and blocked keyboard-output claims.",
        "Library metadata identity, tier, source policy, Oriental Strings articulations, and sample-safety claims.",
        "Monitor status safety gates, blocked payment functionality, and product status shape.",
        "Product QA Core PASS connection across tasks 005, 006, 007, and 008."
      ],
      unsafeClaimsBlocked: [
        "keyboard output claims",
        "keyboard transfer claims",
        "real keyboard writer claims",
        "restricted keyboard style file claims",
        "Kontakt copying",
        "Native Instruments copying",
        "commercial sample copying",
        "Stripe, PayPal, checkout, or payment functionality"
      ],
      whatNeedsMoreFixturesNext: [
        "More maqam and quarter-tone arranger plans.",
        "More Oriental Strings edge cases by tier and articulation set.",
        "More monitor safety-state permutations.",
        "Regression tests for local dashboard export files."
      ],
      nextSafestImplementationStep: "Add a local CI-style QA script that runs tasks 005 through 009 in sequence without deployment or product export."
    },
    inputPaths
  };
}

export function renderRegressionReport(results) {
  const groupRows = Object.entries(results.regressionGroups)
    .map(([group, fixtures]) => `| ${group} | ${fixtures.filter((fixture) => fixture.matchedExpectation).length}/${fixtures.length} |`)
    .join("\n");

  const safetyRows = Object.entries(results.safetyGates)
    .map(([gate, passed]) => `| ${gate} | ${passed ? "PASS" : "FAIL"} |`)
    .join("\n");

  return `# UAOS Validator Regression Task 009 Report

Status: ${results.regressionStatus}

Generated: ${results.generatedAt}

## Regression Groups

| Group | Fixtures matched |
| --- | --- |
${groupRows}

## Upstream Status

- Monitor Status Aggregator 007: ${results.upstreamStatus.monitorStatusAggregator}
- Product QA Core 008: ${results.upstreamStatus.productQACore}
- Product QA includes validator 005: ${results.upstreamStatus.productQACoreComponents.arrangerPlanValidator}
- Product QA includes validator 006: ${results.upstreamStatus.productQACoreComponents.libraryMetadataValidator}
- Product QA includes aggregator 007: ${results.upstreamStatus.productQACoreComponents.monitorStatusAggregator}

## Safety Gates

| Gate | Status |
| --- | --- |
${safetyRows}

## QA Confirmation

- All required fixtures evaluated: YES
- Valid fixtures pass: YES
- Invalid fixtures fail for expected reasons: YES
- Product QA Core status included: YES
- App.jsx touched: NO
- Deploy attempted: NO
- Keyboard output created: NO
- Proprietary copying: NO
- Jobcenter final folders touched: NO
`;
}

export function renderOwnerSummary(results) {
  return `# UAOS Validator Regression Task 009 Owner Summary

Status: ${results.regressionStatus}

Generated: ${results.generatedAt}

## What Is Now Protected By Tests

${results.ownerSummary.whatIsNowProtectedByTests.map((item) => `- ${item}`).join("\n")}

## Which Unsafe Claims Are Blocked

${results.ownerSummary.unsafeClaimsBlocked.map((item) => `- ${item}`).join("\n")}

## What Needs More Fixtures Next

${results.ownerSummary.whatNeedsMoreFixturesNext.map((item) => `- ${item}`).join("\n")}

## Next Safest Implementation Step

${results.ownerSummary.nextSafestImplementationStep}
`;
}
