import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  PRODUCT_EDITIONS,
  calculateFoundersSchedule,
  canonicalPricing,
  createActivationState,
  createAndroidReadiness,
  createBackupManifest,
  createCrashReport,
  createDownloadCenter,
  createEntitlement,
  createFinalTestMatrix,
  createIosReadiness,
  createReleaseNotes,
  createTelemetryState,
  createUpdatePolicy,
  evaluateFinalReleaseGate,
  validateEntitlement,
} from "../uaos-live-clean/src/commercial/phase10Commercial.js";

const root = process.cwd();

test("Phase 10 product editions and canonical pricing stay synchronized", () => {
  const pricing = canonicalPricing();
  assert.equal(PRODUCT_EDITIONS.length, 4);
  assert.equal(pricing.find((plan) => plan.productId === "sing").regularAmount, 0);
  assert.equal(pricing.find((plan) => plan.productId === "studio").introAmount, 7.99);
  assert.equal(pricing.find((plan) => plan.productId === "studio").regularAmount, 12.99);
  assert.equal(pricing.find((plan) => plan.productId === "pro").introAmount, 19.99);
  assert.equal(pricing.find((plan) => plan.productId === "pro").regularAmount, 29.99);
  assert.equal(pricing.find((plan) => plan.productId === "ultimate").regularAmount, 49.99);
  assert.equal(pricing.find((plan) => plan.productId === "ultimate").notForSale, true);
});

test("Phase 10 entitlement and activation are non-destructive and local-first", () => {
  const entitlement = createEntitlement({ productId: "pro", accountId: "acct_test" });
  assert.equal(validateEntitlement(entitlement).valid, true);
  assert.equal(entitlement.localLicense.privateKeyEmbedded, false);
  assert.equal(entitlement.localProjectsReadable, true);
  assert.equal(entitlement.destructiveLockout, false);
  const activation = createActivationState({ mode: "signed-in" });
  assert.equal(activation.commercialActivationEnabled, false);
  assert.equal(activation.networkRequestAutomatic, false);
  assert.equal(activation.server, "unavailable");
});

test("Phase 10 founders schedule is deterministic and switches month four", () => {
  const schedule = calculateFoundersSchedule("2026-01-15", "studio");
  assert.equal(schedule.phases[0].amount, 7.99);
  assert.equal(schedule.phases[2].type, "founders-intro");
  assert.equal(schedule.phases[3].amount, 12.99);
  assert.equal(schedule.phases[3].type, "regular-renewal");
  assert.equal(schedule.realSubscriptionCreated, false);
  assert.throws(() => calculateFoundersSchedule("2026-01-15", "ultimate"), /No founders checkout/);
});

test("Phase 10 website routes, download center and media assets are honest", () => {
  const app = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "App.jsx"), "utf8");
  for (const route of ['id: "support"', 'id: "privacy"', 'id: "terms"', 'id: "contact"', 'page === "downloads"', 'page === "pricing"']) {
    assert.equal(app.includes(route), true);
  }
  assert.equal(app.includes("introAmount.toFixed(2)"), true);
  assert.equal(app.includes("49.99 EUR/month planned - not for sale"), true);
  const download = createDownloadCenter();
  assert.equal(download.windowsInstaller.signed, false);
  assert.equal(download.fakeDownloadLinks, false);
  assert.equal(fs.existsSync(path.join(root, "uaos-live-clean", "public", "media", "UAOS_OFFICIAL_BRANDED_DEMO_LANDSCAPE.mp4")), true);
  assert.equal(fs.existsSync(path.join(root, "uaos-live-clean", "public", "media", "UAOS_OFFICIAL_SOCIAL_COVER.png")), true);
});

test("Phase 10 mobile readiness and updater never claim production availability", () => {
  const android = createAndroidReadiness();
  const ios = createIosReadiness();
  const updater = createUpdatePolicy({ availableVersion: "1.0.1" });
  assert.equal(android.debugApkReady, false);
  assert.equal(android.playStoreReady, false);
  assert.equal(android.embeddedSecrets, false);
  assert.equal(ios.buildStatusOnWindows, "unsupported");
  assert.equal(ios.fakeSuccessfulBuild, false);
  assert.equal(updater.enabled, false);
  assert.equal(updater.unsignedProductionUpdateAccepted, false);
});

test("Phase 10 telemetry, crash reporting and backup stay sanitized", () => {
  const telemetry = createTelemetryState();
  assert.equal(telemetry.enabled, false);
  assert.equal(telemetry.externalTracking, false);
  assert.equal(telemetry.rawAudio, false);
  const crash = createCrashReport({ stack: "Error password=secret token=abc cookie=session" });
  assert.equal(JSON.stringify(crash).includes("secret"), false);
  assert.equal(crash.remoteUpload, "disabled");
  const backup = createBackupManifest({ files: [{ path: "project.json" }, { path: "../secret.dll" }] });
  assert.equal(backup.restoreValidation, false);
  assert.equal(backup.dllAllowed, false);
  assert.equal(backup.pathTraversalAllowed, false);
});

test("Phase 10 release notes, final matrix and final gate remain unsigned until external evidence", () => {
  const notes = createReleaseNotes({ date: "2026-06-14" });
  assert.equal(notes.signingStatus, "unsigned");
  assert.equal(notes.privacyStatus.includes("legal review"), true);
  const matrix = createFinalTestMatrix();
  assert.equal(matrix.some((item) => item.status === "MANUAL_REQUIRED"), true);
  const gate = evaluateFinalReleaseGate({
    automatedTests: true,
    staticChecks: true,
    builds: true,
    routeSmoke: true,
    e2e: true,
    accessibilityBaseline: true,
    performanceBudget: true,
    securityBaseline: true,
    pricingConsistency: true,
    installerReadiness: true,
    mobileReadiness: true,
    updaterDisabled: true
  });
  assert.equal(gate.status, "RELEASE_CANDIDATE_READY_UNSIGNED");
  assert.equal(gate.productionActivationReady, false);
  assert.notEqual(evaluateFinalReleaseGate({ automatedTests: true }).status, "PRODUCTION_READY");
});
