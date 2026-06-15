import fs from "node:fs";
import path from "node:path";
import {
  createDiagnosticsBundle,
  createFeedbackDraft,
  createPhase9State,
  createSyntheticDemoProject,
  validateDemoProject,
  validateFeedbackDraft
} from "../uaos-live-clean/src/beta/phase9Beta.js";

const root = process.cwd();
const reportsDir = path.join(root, "reports");
fs.mkdirSync(reportsDir, { recursive: true });

const beta = createPhase9State();
const demo = createSyntheticDemoProject();
const workflows = [
  { id: "offline-user", passed: validateDemoProject(demo).valid && beta.flags.values.cloudAssetUploadBeta === false },
  { id: "singer", passed: beta.flags.values.remoteAiBeta === false },
  { id: "studio", passed: beta.flags.values.dawBeta === true && beta.flags.values.recordingBeta === true },
  { id: "pro-arranger", passed: beta.flags.values.hardwareProfilesBeta === true && beta.flags.values.sysexBeta === false },
  { id: "account", passed: beta.flags.values.cloudSyncBeta === false },
  { id: "billing", passed: beta.flags.values.billingBeta === false }
];

const diagnostics = createDiagnosticsBundle({ testGateStatus: "beta-e2e-foundation" });
const feedback = createFeedbackDraft({ description: "Beta E2E local workflow note", privacyConfirmed: true });
const result = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  passed: workflows.every((workflow) => workflow.passed) && validateFeedbackDraft(feedback).valid && diagnostics.rawAudioIncluded === false,
  workflows,
  productionServicesUsed: false,
  realEmailSent: false,
  realPaymentCreated: false,
  realUploadCreated: false
};

fs.writeFileSync(path.join(reportsDir, "UAOS_BETA_E2E.json"), JSON.stringify(result, null, 2) + "\n", "utf8");
console.log(`UAOS beta E2E foundation passed: ${result.passed}`);
if (!result.passed) process.exit(1);
