import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const expectedOrigin = "https://github.com/Sari-raslan/universal-arranger-os.git";
const selectedPackageId = "owner-neutral-003";

const files = {
  catalog: "uaos-ai-factory/writer-sandbox/neutral-package-writer/NEUTRAL_PACKAGE_CATALOG.json",
  package: "uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-003/OWNER_NEUTRAL_003.uaos-neutral.json",
  reviewData: "uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-003/OWNER_NEUTRAL_003_REVIEW_DATA.json",
  snapshot: "uaos-ai-factory/SELECTED_NEUTRAL_PACKAGE_SNAPSHOT.json",
  dashboardScript: "scripts/uaos-ai-factory-owner-local-status-dashboard.mjs",
  statusJson: "uaos-ai-factory/OWNER_REVIEW_CONSISTENCY_STATUS.json",
  statusMd: "uaos-ai-factory/OWNER_REVIEW_CONSISTENCY_STATUS.md"
};

function abs(file) {
  return path.join(root, file);
}

function readJson(file) {
  return JSON.parse(readFileSync(abs(file), "utf8"));
}

function run(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
}

const failures = [];
for (const [name, file] of Object.entries(files)) {
  if (name.startsWith("status")) continue;
  if (!existsSync(abs(file))) failures.push(`Missing ${name}: ${file}`);
}

let catalog = null;
let pkg = null;
let reviewData = null;
let snapshot = null;
let dashboard = "";

if (failures.length === 0) {
  catalog = readJson(files.catalog);
  pkg = readJson(files.package);
  reviewData = readJson(files.reviewData);
  snapshot = readJson(files.snapshot);
  dashboard = readFileSync(abs(files.dashboardScript), "utf8");

  const catalogSelectedPackage = catalog.current_selected_package;
  const catalogSelectedEntry = catalog.packages?.find((entry) => entry.package_id === selectedPackageId);

  if (catalogSelectedPackage !== selectedPackageId) failures.push("Catalog selected package is not owner-neutral-003.");
  if (!catalogSelectedEntry) failures.push("Catalog entry for owner-neutral-003 is missing.");
  if (snapshot.selectedPackageId !== selectedPackageId) failures.push("Snapshot selected package is not owner-neutral-003.");
  if (reviewData.package_id !== selectedPackageId || reviewData.selected !== true) failures.push("Review data selected package is not owner-neutral-003.");
  if (pkg.package_id !== selectedPackageId) failures.push("Package ID is not owner-neutral-003.");

  if (catalogSelectedEntry?.keyboard_native !== false) failures.push("Catalog keyboard_native is not false.");
  if (snapshot.keyboardNative !== false) failures.push("Snapshot keyboardNative is not false.");
  if (reviewData.keyboard_native !== false) failures.push("Review data keyboard_native is not false.");
  if (pkg.keyboard_native !== false) failures.push("Package keyboard_native is not false.");

  if (catalogSelectedEntry?.compatibility_status !== "UNVERIFIED") failures.push("Catalog compatibility is not UNVERIFIED.");
  if (snapshot.compatibility !== "UNVERIFIED") failures.push("Snapshot compatibility is not UNVERIFIED.");
  if (reviewData.compatibility !== "UNVERIFIED") failures.push("Review data compatibility is not UNVERIFIED.");
  if (pkg.real_keyboard_compatibility !== "UNVERIFIED") failures.push("Package compatibility is not UNVERIFIED.");

  if (catalogSelectedEntry?.validation_status !== "PASS") failures.push("Catalog validation is not PASS.");
  if (snapshot.validationStatus !== "PASS") failures.push("Snapshot validation is not PASS.");
  if (reviewData.validation_status !== "PASS") failures.push("Review data validation is not PASS.");

  if (catalog.real_keyboard_output_created !== false) failures.push("Catalog real keyboard output is not false.");
  if (snapshot.realKeyboardOutput !== "NO") failures.push("Snapshot real keyboard output is not NO.");
  if (reviewData.real_keyboard_output !== "NO") failures.push("Review data real keyboard output is not NO.");
  if (pkg.real_keyboard_output_created !== false) failures.push("Package real keyboard output is not false.");

  if (catalog.keyboard_transfer_allowed !== false) failures.push("Catalog keyboard transfer is not false.");
  if (snapshot.keyboardTransfer !== "NO") failures.push("Snapshot keyboard transfer is not NO.");
  if (reviewData.keyboard_transfer !== "NO") failures.push("Review data keyboard transfer is not NO.");
  if (pkg.keyboard_transfer_allowed !== false) failures.push("Package keyboard transfer is not false.");

  if (!pkg.labels?.includes("NOT_PUBLIC_RELEASE")) failures.push("Package NOT_PUBLIC_RELEASE label missing.");
  if (!reviewData.safety_labels?.includes("NOT_PUBLIC_RELEASE")) failures.push("Review data NOT_PUBLIC_RELEASE label missing.");
  if (!snapshot.safetyLabels?.includes("NOT_PUBLIC_RELEASE")) failures.push("Snapshot NOT_PUBLIC_RELEASE label missing.");
  if (pkg.not_public_release !== true) failures.push("Package not_public_release flag is not true.");
  if (pkg.no_payment !== true || pkg.no_deploy !== true || pkg.no_vercel !== true) failures.push("Package payment/deploy/Vercel safety flags are not true.");
  if (snapshot.noPayment !== true || snapshot.noDeploy !== true || snapshot.noVercel !== true) failures.push("Snapshot payment/deploy/Vercel safety flags are not true.");

  if (!dashboard.includes(`const selectedPackageId = "${selectedPackageId}"`)) failures.push("Dashboard selectedPackageId does not match owner-neutral-003.");
  if (!dashboard.includes("SELECTED_NEUTRAL_PACKAGE_SNAPSHOT.json")) failures.push("Dashboard snapshot reference is missing.");
}

const remoteOutput = run("git", ["remote", "-v"]);
const remoteUnchanged = remoteOutput.includes(expectedOrigin);
if (!remoteUnchanged) failures.push("Remote changed.");

const status = {
  schema: "uaos-owner-review-consistency-status-v1",
  status: failures.length === 0 ? "PASS" : "FAIL",
  selectedPackageId,
  checks: {
    catalog_selected_package: catalog?.current_selected_package ?? "MISSING",
    snapshot_selected_package: snapshot?.selectedPackageId ?? "MISSING",
    review_data_selected_package: reviewData?.package_id ?? "MISSING",
    package_selected_package: pkg?.package_id ?? "MISSING",
    keyboardNativeFalseEverywhere: failures.every((failure) => !failure.includes("keyboard")),
    compatibilityUnverifiedEverywhere: failures.every((failure) => !failure.includes("compatibility")),
    validationPass: failures.every((failure) => !failure.includes("validation")),
    realKeyboardOutputNo: failures.every((failure) => !failure.includes("real keyboard output")),
    keyboardTransferNo: failures.every((failure) => !failure.includes("keyboard transfer")),
    noPublicReleaseLabelsPresent: failures.every((failure) => !failure.includes("NOT_PUBLIC_RELEASE")),
    noPaymentDeployVercelEnabled: failures.every((failure) => !failure.includes("payment/deploy/Vercel")),
    dashboardAgrees: failures.every((failure) => !failure.includes("Dashboard")),
    remoteUnchanged
  },
  safety: {
    localOnly: true,
    realKeyboardOutputCreated: false,
    keyboardTransferAllowed: false,
    noPush: true,
    noDeploy: true,
    noVercel: true,
    noPayment: true
  },
  failures
};

const markdown = `# Owner Review Consistency Status

LOCAL ONLY - READ ONLY CHECK - NO KEYBOARD OUTPUT

## Status

${status.status}

## Selected Package

\`${selectedPackageId}\`

## Checks

- Catalog selected package: ${status.checks.catalog_selected_package}
- Snapshot selected package: ${status.checks.snapshot_selected_package}
- Review data selected package: ${status.checks.review_data_selected_package}
- Package selected package: ${status.checks.package_selected_package}
- Keyboard native false everywhere: ${status.checks.keyboardNativeFalseEverywhere ? "YES" : "NO"}
- Compatibility UNVERIFIED everywhere: ${status.checks.compatibilityUnverifiedEverywhere ? "YES" : "NO"}
- Validation PASS: ${status.checks.validationPass ? "YES" : "NO"}
- Real keyboard output NO: ${status.checks.realKeyboardOutputNo ? "YES" : "NO"}
- Keyboard transfer NO: ${status.checks.keyboardTransferNo ? "YES" : "NO"}
- No public release labels present: ${status.checks.noPublicReleaseLabelsPresent ? "YES" : "NO"}
- No payment/deploy/Vercel enabled: ${status.checks.noPaymentDeployVercelEnabled ? "YES" : "NO"}
- Dashboard agrees: ${status.checks.dashboardAgrees ? "YES" : "NO"}
- Remote unchanged: ${remoteUnchanged ? "YES" : "NO"}

## Failures

${failures.length === 0 ? "- None" : failures.map((failure) => `- ${failure}`).join("\n")}
`;

writeFileSync(abs(files.statusJson), `${JSON.stringify(status, null, 2)}\n`);
writeFileSync(abs(files.statusMd), markdown);

console.log("UAOS Owner Review Consistency Check");
console.log("LOCAL ONLY - READ ONLY - NO KEYBOARD OUTPUT");
console.log(`Selected package: ${selectedPackageId}`);
console.log(`Status: ${status.status}`);
console.log("Real keyboard output: NO");
console.log("Keyboard transfer: NO");
console.log(`Remote unchanged: ${remoteUnchanged ? "YES" : "NO"}`);

if (failures.length > 0) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("UAOS Owner Review Consistency Check: PASS");

