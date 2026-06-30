import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  app: "uaos-live-clean/src/App.jsx",
  visualSeal: "uaos-ai-factory/implementation/APPJSX_SNAPSHOT_VISUAL_VERIFICATION_SEAL.md",
  snapshot: "uaos-ai-factory/SELECTED_NEUTRAL_PACKAGE_SNAPSHOT.json",
  consistency: "uaos-ai-factory/OWNER_REVIEW_CONSISTENCY_STATUS.json",
  statusJson: "uaos-ai-factory/UI_SNAPSHOT_REGRESSION_STATUS.json",
  statusMd: "uaos-ai-factory/UI_SNAPSHOT_REGRESSION_STATUS.md"
};

function abs(file) {
  return path.join(root, file);
}

function fileExists(file) {
  return existsSync(abs(file));
}

const failures = [];
for (const file of [files.app, files.visualSeal, files.snapshot, files.consistency]) {
  if (!fileExists(file)) failures.push(`Missing required file: ${file}`);
}

let app = "";
if (fileExists(files.app)) app = readFileSync(abs(files.app), "utf8");

const requiredChecks = [
  {
    key: "embeddedSnapshotObject",
    passed: app.includes("selectedNeutralPackageSnapshot"),
    failure: "App.jsx does not contain selectedNeutralPackageSnapshot."
  },
  {
    key: "ownerNeutral003",
    passed: app.includes("owner-neutral-003"),
    failure: "App.jsx does not contain owner-neutral-003."
  },
  {
    key: "notKeyboardOutput",
    passed: app.includes("NOT KEYBOARD OUTPUT"),
    failure: "App.jsx does not contain NOT KEYBOARD OUTPUT."
  },
  {
    key: "readOnly",
    passed: app.includes("READ ONLY"),
    failure: "App.jsx does not contain READ ONLY."
  },
  {
    key: "keyboardTransferNo",
    passed: app.includes("keyboardTransfer") && app.includes("\"NO\""),
    failure: "App.jsx does not contain keyboard transfer NO or safe equivalent."
  }
];

for (const check of requiredChecks) {
  if (!check.passed) failures.push(check.failure);
}

const forbiddenWording = [
  "ready for keyboard",
  "export to organ",
  "production ready",
  "payment enabled",
  "live release",
  "real writer ready"
];

const lowerApp = app.toLowerCase();
for (const wording of forbiddenWording) {
  if (lowerApp.includes(wording)) failures.push(`Forbidden wording found in App.jsx: ${wording}`);
}

const status = {
  schema: "uaos-ui-snapshot-regression-status-v1",
  status: failures.length === 0 ? "PASS" : "FAIL",
  selectedPackage: "owner-neutral-003",
  checks: Object.fromEntries(requiredChecks.map((check) => [check.key, check.passed])),
  requiredFiles: {
    visualSealExists: fileExists(files.visualSeal),
    selectedSnapshotJsonExists: fileExists(files.snapshot),
    consistencyStatusExists: fileExists(files.consistency)
  },
  forbiddenWordingAbsent: failures.filter((failure) => failure.startsWith("Forbidden wording")).length === 0,
  forbiddenWording,
  safety: {
    localOnly: true,
    appJsxReadOnlySnapshotIntegration: true,
    realKeyboardOutputCreated: false,
    keyboardTransferAllowed: false,
    noPush: true,
    noDeploy: true,
    noVercel: true,
    noPayment: true
  },
  failures
};

const markdown = `# UI Snapshot Regression Status

LOCAL ONLY - READ ONLY CHECK - NO KEYBOARD OUTPUT

## Status

${status.status}

## Checks

- Embedded read-only snapshot object: ${status.checks.embeddedSnapshotObject ? "YES" : "NO"}
- owner-neutral-003 present: ${status.checks.ownerNeutral003 ? "YES" : "NO"}
- NOT KEYBOARD OUTPUT present: ${status.checks.notKeyboardOutput ? "YES" : "NO"}
- READ ONLY present: ${status.checks.readOnly ? "YES" : "NO"}
- Keyboard transfer NO or safe equivalent: ${status.checks.keyboardTransferNo ? "YES" : "NO"}
- DEV-030 visual seal exists: ${status.requiredFiles.visualSealExists ? "YES" : "NO"}
- Selected snapshot JSON exists: ${status.requiredFiles.selectedSnapshotJsonExists ? "YES" : "NO"}
- Consistency status exists: ${status.requiredFiles.consistencyStatusExists ? "YES" : "NO"}
- Forbidden wording absent: ${status.forbiddenWordingAbsent ? "YES" : "NO"}

## Forbidden Wording

${forbiddenWording.map((wording) => `- ${wording}`).join("\n")}

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}
`;

writeFileSync(abs(files.statusJson), `${JSON.stringify(status, null, 2)}\n`);
writeFileSync(abs(files.statusMd), markdown);

console.log("UAOS UI Snapshot Regression Check");
console.log("LOCAL ONLY - READ ONLY - NO KEYBOARD OUTPUT");
console.log(`Status: ${status.status}`);
console.log("Real keyboard output: NO");
console.log("Keyboard transfer: NO");

if (failures.length > 0) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("UAOS UI Snapshot Regression Check: PASS");

