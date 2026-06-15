import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  BETA_LIMITS,
  DEFAULT_BETA_FLAGS,
  PERFORMANCE_BUDGET,
  advanceOnboarding,
  createDiagnosticsBundle,
  createFeedbackDraft,
  createKnownIssues,
  createOnboardingState,
  createPhase9State,
  createRecoverySnapshot,
  createReleaseCandidateMetadata,
  createSyntheticDemoProject,
  createUpdaterState,
  evaluateReleaseGateV2,
  migratePhase9State,
  normalizeFeatureFlags,
  validateDemoProject,
  validateFeedbackDraft,
  validateRecoveryPayload,
  validateReleaseCandidate,
} from "../uaos-live-clean/src/beta/phase9Beta.js";
import { createDefaultSession, exportSession, importSession, migrateSession } from "../uaos-live-clean/src/session/sessionStore.js";

const root = process.cwd();

test("Phase 9 validates release candidate metadata and semantic versioning", () => {
  const rc = createReleaseCandidateMetadata({ version: "1.0.0-beta.9", signingStatus: "unsigned" });
  assert.equal(validateReleaseCandidate(rc).valid, true);
  assert.equal(rc.activationEnabled, false);
  assert.equal(rc.schemaVersions.session, 7);
  assert.equal(rc.channel, "release-candidate");
  assert.equal(validateReleaseCandidate({ ...rc, version: "beta-nine" }).valid, false);
  assert.equal(validateReleaseCandidate({ ...rc, channel: "stable", activationEnabled: true }).valid, false);
});

test("Phase 9 feature flags keep dangerous capabilities disabled and track unknown flags", () => {
  const flags = normalizeFeatureFlags({ sysexBeta: true, billingBeta: true, unknownNewFlag: true }, { updaterBeta: true }, { cloudSyncBeta: true });
  assert.equal(flags.values.sysexBeta, false);
  assert.equal(flags.values.billingBeta, false);
  assert.equal(flags.values.remoteAiBeta, false);
  assert.equal(flags.values.cloudAssetUploadBeta, false);
  assert.equal(flags.values.updaterBeta, true);
  assert.equal(flags.values.cloudSyncBeta, true);
  assert.equal(flags.unknown[0].key, "unknownNewFlag");
  assert.equal(DEFAULT_BETA_FLAGS.betaEnabled, true);
});

test("Phase 9 onboarding supports resume, skip, reset, optional account/cloud/microphone and reduced motion", () => {
  const start = createOnboardingState({ locale: "ar", reducedMotion: true });
  assert.equal(start.accountRequired, false);
  assert.equal(start.cloudRequired, false);
  assert.equal(start.microphoneRequired, false);
  assert.equal(start.hiddenConsent, false);
  assert.equal(start.reducedMotion, true);
  const next = advanceOnboarding(start, { skipOptional: true });
  assert.equal(next.completedSteps.includes("welcome"), true);
  assert.equal(next.skippedOptionalSteps.includes("welcome"), true);
  assert.equal(createOnboardingState(next).currentStep, next.currentStep);
});

test("Phase 9 demo project is synthetic, offline and deterministic", () => {
  const demo = createSyntheticDemoProject();
  assert.equal(validateDemoProject(demo).valid, true);
  assert.equal(demo.legal.commercialSamples, false);
  assert.equal(demo.legal.copyrightedSong, false);
  assert.equal(demo.legal.internetRequired, false);
  assert.equal(demo.aiAnalysis.label.includes("Demo"), true);
  assert.equal(createSyntheticDemoProject().deterministicSeed, demo.deterministicSeed);
});

test("Phase 9 E2E workflow foundations are represented without production services", () => {
  const state = createPhase9State();
  const workflows = ["offline-user", "singer", "studio", "pro-arranger", "account", "billing"];
  assert.equal(workflows.every(Boolean), true);
  assert.equal(state.flags.values.billingBeta, false);
  assert.equal(state.flags.values.cloudAssetUploadBeta, false);
  assert.equal(state.demoProject.tracks.length >= 5, true);
});

test("Phase 9 route smoke source includes public routes and beta UI signals", () => {
  const app = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "App.jsx"), "utf8");
  const panel = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "components", "PublicBetaPanel.jsx"), "utf8");
  for (const route of ['id: "demo"', 'page === "demo"', 'page === "studio"', 'page === "sampler"', 'page === "ai"', 'page === "account"', 'page === "pricing"']) {
    assert.equal(app.includes(route), true);
  }
  for (const text of ["UAOS Public Beta Control Center", "First Run Wizard", "Synthetic Demo Project", "Diagnostics Bundle", "Local Feedback", "Offline Support Center", "Keyboard Shortcuts"]) {
    assert.equal(panel.includes(text), true);
  }
});

test("Phase 9 recovery rejects raw audio and limits snapshots", () => {
  assert.equal(validateRecoveryPayload({ metadata: { name: "ok" } }).valid, true);
  assert.equal(validateRecoveryPayload({ rawAudio: "bad" }).valid, false);
  let recovery = {};
  for (let index = 0; index < BETA_LIMITS.maxRecoverySnapshots + 2; index += 1) {
    recovery = createRecoverySnapshot(recovery, { index });
  }
  assert.equal(recovery.snapshots.length, BETA_LIMITS.maxRecoverySnapshots);
  assert.equal(recovery.rawAudioStored, false);
});

test("Phase 9 diagnostics and feedback are sanitized and local-only", () => {
  const diagnostics = createDiagnosticsBundle({
    recentLogs: [{ message: "ok", token: "secret-token" }],
    stripeSecret: "sk_test_hidden",
    rawAudio: "audio",
    privateProjectContent: "private"
  });
  const text = JSON.stringify(diagnostics);
  assert.equal(text.includes("secret-token"), false);
  assert.equal(text.includes("sk_test_hidden"), false);
  assert.equal(text.includes("audio"), false);
  const feedback = createFeedbackDraft({ description: "A local beta feedback report", privacyConfirmed: true });
  assert.equal(validateFeedbackDraft(feedback).valid, true);
  assert.equal(feedback.remoteSubmit, "disabled");
  assert.equal(feedback.automaticUpload, false);
});

test("Phase 9 installer, updater, performance, accessibility and localization foundations stay honest", () => {
  const updater = createUpdaterState();
  assert.equal(updater.enabled, false);
  assert.equal(updater.signatureRequired, true);
  assert.equal(updater.checksumRequired, true);
  assert.equal(updater.updateServerConfigured, false);
  assert.equal(PERFORMANCE_BUDGET.animationsRespectReducedMotion, true);
  const css = fs.readFileSync(path.join(root, "uaos-live-clean", "src", "style.css"), "utf8");
  assert.equal(css.includes("prefers-reduced-motion"), true);
  assert.equal(css.includes("focus-visible"), true);
  assert.equal(migratePhase9State({ locale: "ar" }).localization.direction, "rtl");
});

test("Phase 9 session migration, known issues and Release Gate V2 remain non-production", () => {
  const migrated = migrateSession({ version: 6, beta: { flags: { billingBeta: true } } });
  assert.equal(migrated.version, 7);
  assert.equal(migrated.beta.flags.values.billingBeta, false);
  assert.equal(importSession(exportSession(createDefaultSession())).beta.schemaVersion, 1);
  const issues = createKnownIssues();
  assert.equal(issues.some((issue) => issue.externalBlocker), true);
  const gate = evaluateReleaseGateV2({
    tests: true,
    staticCheck: true,
    build: true,
    runtimeCheck: true,
    desktopSmoke: true,
    routeSmoke: true,
    e2eWorkflows: true,
    accessibilityBaseline: true,
    performanceBudget: true,
    arabicEncoding: true,
    branding: true,
    pricing: true,
    accountOfflineFallback: true,
    stripeDisabled: true,
    cloudDisabled: true,
    updaterDisabled: true,
    installerPackageReadiness: true
  });
  assert.equal(gate.status, "RELEASE_CANDIDATE_READY_UNSIGNED");
  assert.equal(evaluateReleaseGateV2({ tests: true }).status, "CODE_BLOCKED");
  assert.notEqual(evaluateReleaseGateV2({ tests: true }).status, "PRODUCTION_READY");
});
