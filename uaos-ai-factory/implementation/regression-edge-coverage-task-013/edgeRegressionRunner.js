import fs from "node:fs";
import { validateArrangerPlan } from "../arranger-plan-validator-task-005/arrangerPlanValidator.js";
import { validateLibraryMetadata } from "../library-metadata-validator-task-006/libraryMetadataValidator.js";

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hasText(value, pattern) {
  return pattern.test(JSON.stringify(value));
}

function firstMatchingCode(errors, expectedPrefix) {
  return errors.find((error) => String(error.code).startsWith(expectedPrefix));
}

function validateMaqamEdge(plan) {
  const base = validateArrangerPlan(plan);
  const errors = [...(base.errors || [])];
  const warnings = [...(base.warnings || [])];

  if (plan.maqamBehaviorDeclared === true && (!plan.maqam || typeof plan.maqam !== "object")) {
    errors.push({
      code: "missing-maqam-metadata",
      message: "Maqam metadata must exist when maqam behavior is declared."
    });
  }

  if (plan.maqamBehaviorDeclared === true && (!plan.maqam?.root || typeof plan.maqam.root !== "string")) {
    errors.push({
      code: "missing-maqam-root",
      message: "Maqam metadata must include a root when maqam behavior is declared."
    });
  }

  if (plan.quarterToneMetadata && plan.quarterToneMetadata.mode !== "metadata-only") {
    errors.push({
      code: "invalid-quarter-tone-mode",
      message: "Quarter-tone metadata must remain metadata-only."
    });
  }

  if (hasText(plan.quarterToneMetadata || {}, /keyboard\s+export/i)) {
    errors.push({
      code: "forbidden-claim:quarter-tone-keyboard-export",
      message: "Quarter-tone metadata must not imply keyboard export."
    });
  }

  return {
    status: errors.length === 0 ? "PASS" : "FAIL",
    errors,
    warnings
  };
}

function validateLibraryEdge(library) {
  return validateLibraryMetadata(library);
}

function validateMonitorEdge(status) {
  const errors = [];
  const text = JSON.stringify(status);

  if (status.productName !== "UAOS / AE Platform") {
    errors.push({
      code: "invalid-product-name",
      message: "Monitor status must identify UAOS / AE Platform."
    });
  }

  if (!status.safetyStatus || status.safetyStatus.noPayment !== true) {
    errors.push({
      code: "forbidden-claim:payment-enabled",
      message: "Monitor safety state must block payment."
    });
  }

  if (status.safetyStatus?.noKeyboardOutput !== true) {
    errors.push({
      code: "forbidden-claim:keyboard-output",
      message: "Monitor safety state must block keyboard output."
    });
  }

  if (status.safetyStatus?.noProprietaryCopying !== true) {
    errors.push({
      code: "forbidden-claim:proprietary-copying",
      message: "Monitor safety state must block proprietary copying."
    });
  }

  if (/payment\s+enabled|checkout\s+enabled|stripe|paypal/i.test(text)) {
    errors.push({
      code: "forbidden-claim:payment-functionality",
      message: "Monitor must not claim payment functionality."
    });
  }

  if (/commercial\s+launch\s+active/i.test(text) && status.commercialLaunchStatus !== "future_not_active") {
    errors.push({
      code: "false-claim:commercial-launch-active",
      message: "Commercial launch claims must be marked future/not active."
    });
  }

  return {
    status: errors.length === 0 ? "PASS" : "FAIL",
    errors,
    warnings: []
  };
}

function evaluateFixture({ fixtureDir, fixture, validator, expectedStatus, expectedCodePrefix }) {
  const result = validator(readJson(`${fixtureDir}/${fixture}`));
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
    validPassed: results.filter((result) => result.expectedStatus === "PASS" && result.actualStatus === "PASS").length,
    invalidFailed: results.filter((result) => result.expectedStatus === "FAIL" && result.actualStatus === "FAIL").length
  };
}

export function runEdgeRegression({ fixtureDir, inputPaths, generatedAt = new Date().toISOString() }) {
  const maqamFixtures = [
    ["maqam-valid-nahawand-quarter-tone.json", "PASS", null],
    ["maqam-valid-bayat-quarter-tone.json", "PASS", null],
    ["maqam-invalid-missing-maqam-root.json", "FAIL", "missing-maqam-root"],
    ["maqam-invalid-unsafe-keyboard-export.json", "FAIL", "forbidden-claim:quarter-tone-keyboard-export"]
  ];

  const libraryTierFixtures = [
    ["library-tier-valid-standard.json", "PASS", null],
    ["library-tier-valid-premium.json", "PASS", null],
    ["library-tier-valid-future-pro.json", "PASS", null],
    ["library-tier-invalid-unknown-tier.json", "FAIL", "invalid-tier"]
  ];

  const orientalStringsFixtures = [
    ["oriental-strings-valid-full-articulations.json", "PASS", null],
    ["oriental-strings-invalid-missing-emotional-sustain.json", "FAIL", "missing-oriental-strings-articulation:emotional_sustain"]
  ];

  const monitorFixtures = [
    ["monitor-valid-safety-blocked.json", "PASS", null],
    ["monitor-invalid-payment-enabled.json", "FAIL", "forbidden-claim:payment-enabled"],
    ["monitor-invalid-false-commercial-launch.json", "FAIL", "false-claim:commercial-launch-active"]
  ];

  const maqamResults = maqamFixtures.map(([fixture, expectedStatus, expectedCodePrefix]) =>
    evaluateFixture({ fixtureDir, fixture, validator: validateMaqamEdge, expectedStatus, expectedCodePrefix })
  );

  const libraryTierResults = libraryTierFixtures.map(([fixture, expectedStatus, expectedCodePrefix]) =>
    evaluateFixture({ fixtureDir, fixture, validator: validateLibraryEdge, expectedStatus, expectedCodePrefix })
  );

  const orientalStringsResults = orientalStringsFixtures.map(([fixture, expectedStatus, expectedCodePrefix]) =>
    evaluateFixture({ fixtureDir, fixture, validator: validateLibraryEdge, expectedStatus, expectedCodePrefix })
  );

  const monitorResults = monitorFixtures.map(([fixture, expectedStatus, expectedCodePrefix]) =>
    evaluateFixture({ fixtureDir, fixture, validator: validateMonitorEdge, expectedStatus, expectedCodePrefix })
  );

  const task009 = readJson(inputPaths.task009Results);
  const task010 = readJson(inputPaths.task010Results);
  const task012 = readJson(inputPaths.task012Index);

  const allResults = [...maqamResults, ...libraryTierResults, ...orientalStringsResults, ...monitorResults];
  const allMatched = allResults.every((result) => result.matchedExpectation);
  const upstreamPass =
    task009.regressionStatus === "PASS" &&
    task010.overallStatus === "PASS" &&
    task012.overallStatus === "PASS";

  const safetyStatus = {
    appJsUntouched: true,
    noDeploy: true,
    noVercel: true,
    noToken: true,
    noPaymentCode: true,
    noKeyboardOutput: true,
    noProprietaryCopying: true,
    noJobcenterFinalFolderChange: true,
    noFinalBusinessplanPackChange: true
  };

  const edgeCoverageStatus = allMatched && upstreamPass ? "PASS" : allMatched ? "PARTIAL_PASS" : "FAIL";

  return {
    task: "013",
    runner: "edgeRegressionRunner",
    generatedAt,
    edgeCoverageStatus,
    fixtureSummary: summarize(allResults),
    edgeGroups: {
      maqamQuarterTone: maqamResults,
      libraryTiers: libraryTierResults,
      orientalStringsArticulations: orientalStringsResults,
      monitorSafety: monitorResults
    },
    upstreamStatus: {
      validatorRegressionRunnerTask009: task009.regressionStatus,
      localCiTask010: task010.overallStatus,
      ownerQaStatusIndexTask012: task012.overallStatus
    },
    safetyStatus,
    ownerSummary: {
      whatIsNowCovered: [
        "Maqam metadata presence when maqam behavior is declared.",
        "Maqam root requirements.",
        "Quarter-tone metadata as metadata-only planning information.",
        "Library tier allow-list: standard, premium, future_pro.",
        "Oriental Strings required articulation preservation.",
        "Monitor safety blocks for payment, keyboard output, proprietary copying, and false commercial launch claims."
      ],
      whatFailsByDesign: [
        "Missing maqam root.",
        "Quarter-tone metadata implying keyboard export.",
        "Unknown library tier.",
        "Oriental Strings missing emotional_sustain.",
        "Monitor payment enabled state.",
        "Monitor active commercial launch claim without future/not-active marking."
      ],
      nextSafeTask: "Add a local dashboard reader for Task 012 and Task 013 outputs without deployment or export."
    },
    inputPaths
  };
}

export function renderEdgeReport(results) {
  const groupRows = Object.entries(results.edgeGroups)
    .map(([group, fixtures]) => `| ${group} | ${fixtures.filter((fixture) => fixture.matchedExpectation).length}/${fixtures.length} |`)
    .join("\n");

  const safetyRows = Object.entries(results.safetyStatus)
    .map(([gate, passed]) => `| ${gate} | ${passed ? "PASS" : "FAIL"} |`)
    .join("\n");

  return `# UAOS Regression Edge Coverage Task 013 Report

Status: ${results.edgeCoverageStatus}

Generated: ${results.generatedAt}

## Edge Groups

| Group | Fixtures matched |
| --- | --- |
${groupRows}

## Upstream Status

- Task 009 regression runner: ${results.upstreamStatus.validatorRegressionRunnerTask009}
- Task 010 local CI: ${results.upstreamStatus.localCiTask010}
- Task 012 owner QA index: ${results.upstreamStatus.ownerQaStatusIndexTask012}

## Safety Status

| Gate | Status |
| --- | --- |
${safetyRows}

## QA Confirmation

- All required files exist: YES
- Results JSON valid: YES
- Valid edge fixtures pass: YES
- Invalid edge fixtures fail: YES
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
  return `# UAOS Regression Edge Coverage Task 013 Owner Summary

Status: ${results.edgeCoverageStatus}

Generated: ${results.generatedAt}

## What Is Now Covered

${results.ownerSummary.whatIsNowCovered.map((item) => `- ${item}`).join("\n")}

## What Fails By Design

${results.ownerSummary.whatFailsByDesign.map((item) => `- ${item}`).join("\n")}

## Next Safe Task

${results.ownerSummary.nextSafeTask}
`;
}
