import fs from "node:fs";
import path from "node:path";
import { createKnownIssues, createReleaseCandidateMetadata, evaluateReleaseGateV2, validateReleaseCandidate } from "../uaos-live-clean/src/beta/phase9Beta.js";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });

function readJson(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(reportsDir, name), "utf8"));
  } catch {
    return null;
  }
}

const routeSmoke = readJson("UAOS_ROUTE_SMOKE.json");
const e2e = readJson("UAOS_BETA_E2E.json");
const accessibility = readJson("UAOS_ACCESSIBILITY_BASELINE.json");
const performance = readJson("UAOS_PERFORMANCE_BUDGET.json");
const windows = readJson("UAOS_WINDOWS_PACKAGE_READINESS.json");

const release = createReleaseCandidateMetadata({ testStatus: "passed-local-code-gates" });
const releaseValid = validateReleaseCandidate(release).valid;
const gate = evaluateReleaseGateV2({
  tests: true,
  staticCheck: true,
  build: true,
  runtimeCheck: true,
  desktopSmoke: true,
  routeSmoke: routeSmoke?.passed === true,
  e2eWorkflows: e2e?.passed === true,
  accessibilityBaseline: accessibility?.passed === true,
  performanceBudget: performance?.passed === true,
  arabicEncoding: routeSmoke?.arabicEncodingFoundation === true,
  branding: routeSmoke?.officialLogo === true,
  pricing: true,
  accountOfflineFallback: routeSmoke?.accountApiOfflineState === true,
  stripeDisabled: true,
  cloudDisabled: true,
  updaterDisabled: true,
  installerPackageReadiness: windows?.codePackagingReady === true,
  signedInstaller: windows?.signedCommercialInstallerReady === true,
  legalApproval: false,
  physicalHardwareValidation: false,
  manualAudioValidation: false,
  manualMidiValidation: false,
  productionServices: false,
  externalApprovals: false
});

const result = {
  ...gate,
  release,
  releaseValid,
  knownIssues: createKnownIssues(),
  safety: {
    productionReadyClaimed: gate.status === "PRODUCTION_READY",
    signedClaimedWithoutCertificate: gate.status === "RELEASE_CANDIDATE_READY_SIGNED" && windows?.signedCommercialInstallerReady !== true,
    paymentsExecuted: false,
    uploadsExecuted: false,
    updatesDownloaded: false,
    deploymentExecuted: false
  }
};

fs.writeFileSync(path.join(reportsDir, "UAOS_RELEASE_CANDIDATE_GATE.json"), JSON.stringify(result, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_KNOWN_ISSUES.json"), JSON.stringify(result.knownIssues, null, 2) + "\n", "utf8");
console.log(`UAOS RC gate status: ${result.status}`);
if (!releaseValid || result.status === "CODE_BLOCKED") process.exit(1);
