import fs from "node:fs";
import path from "node:path";
import { createFinalTestMatrix, evaluateFinalReleaseGate } from "../uaos-live-clean/src/commercial/phase10Commercial.js";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });
function read(name) {
  try { return JSON.parse(fs.readFileSync(path.join(reportsDir, name), "utf8")); } catch { return null; }
}
const gate = evaluateFinalReleaseGate({
  automatedTests: true,
  staticChecks: true,
  builds: true,
  routeSmoke: read("UAOS_ROUTE_SMOKE.json")?.passed === true,
  e2e: read("UAOS_BETA_E2E.json")?.passed === true,
  accessibilityBaseline: read("UAOS_ACCESSIBILITY_BASELINE.json")?.passed === true,
  performanceBudget: read("UAOS_PERFORMANCE_BUDGET.json")?.passed === true,
  securityBaseline: read("UAOS_SECURITY_CHECK.json")?.passed === true,
  pricingConsistency: read("UAOS_PRICING_CHECK.json")?.passed === true,
  installerReadiness: read("UAOS_INSTALLER_CHECK.json")?.passed === true,
  mobileReadiness: read("UAOS_MOBILE_READINESS.json")?.passed === true,
  updaterDisabled: true,
  signingCertificate: false,
  legalApproval: false,
  privacyApproval: false,
  productionPostgres: false,
  productionStripe: false,
  productionSmtp: false,
  domainTls: false,
  physicalHardwareValidation: false,
  manualAudioValidation: false,
  manualMidiValidation: false,
  manualRecordingValidation: false,
  releaseAuthorization: false
});
const matrix = createFinalTestMatrix();
fs.writeFileSync(path.join(reportsDir, "UAOS_FINAL_RELEASE_GATE.json"), JSON.stringify({ ...gate, matrix }, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_FINAL_TEST_MATRIX.json"), JSON.stringify(matrix, null, 2) + "\n", "utf8");
console.log(`UAOS final release gate status: ${gate.status}`);
if (gate.status === "CODE_BLOCKED") process.exit(1);
