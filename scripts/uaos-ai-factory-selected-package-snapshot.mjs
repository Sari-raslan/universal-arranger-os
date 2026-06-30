import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const selectedPackageId = "owner-neutral-003";

const paths = {
  package: "uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-003/OWNER_NEUTRAL_003.uaos-neutral.json",
  manifest: "uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-003/MANIFEST.json",
  validation: "uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-003/VALIDATION.json",
  reviewData: "uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-003/OWNER_NEUTRAL_003_REVIEW_DATA.json",
  snapshotJson: "uaos-ai-factory/SELECTED_NEUTRAL_PACKAGE_SNAPSHOT.json",
  snapshotMd: "uaos-ai-factory/SELECTED_NEUTRAL_PACKAGE_SNAPSHOT.md"
};

function abs(file) {
  return path.join(root, file);
}

function readJson(file) {
  return JSON.parse(readFileSync(abs(file), "utf8"));
}

function requireFile(file) {
  if (!existsSync(abs(file))) {
    throw new Error(`Required file missing: ${file}`);
  }
}

for (const file of [paths.package, paths.manifest, paths.validation, paths.reviewData]) {
  requireFile(file);
}

const pkg = readJson(paths.package);
const manifest = readJson(paths.manifest);
const validation = readJson(paths.validation);
const reviewData = readJson(paths.reviewData);

const failures = [];
if (pkg.package_id !== selectedPackageId) failures.push("Package ID mismatch.");
if (reviewData.package_id !== selectedPackageId) failures.push("Review data package ID mismatch.");
if (validation.package_id !== selectedPackageId) failures.push("Validation package ID mismatch.");
if (pkg.keyboard_native !== false) failures.push("Package keyboard_native is not false.");
if (validation.status !== "PASS") failures.push("Validation status is not PASS.");
if (pkg.real_keyboard_compatibility !== "UNVERIFIED") failures.push("Compatibility is not UNVERIFIED.");
if (pkg.real_keyboard_output_created !== false) failures.push("Real keyboard output flag is not false.");
if (pkg.keyboard_transfer_allowed !== false) failures.push("Keyboard transfer flag is not false.");

if (failures.length > 0) {
  console.error("UAOS Selected Package Snapshot: FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

const snapshot = {
  schema: "uaos-selected-neutral-package-snapshot-v1",
  selectedPackageId,
  packageType: ".uaos-neutral.json",
  keyboardNative: false,
  compatibility: "UNVERIFIED",
  validationStatus: "PASS",
  reviewStatus: "Owner manual review",
  realKeyboardOutput: "NO",
  keyboardTransfer: "NO",
  sourcePaths: {
    package: paths.package,
    manifest: paths.manifest,
    validation: paths.validation,
    reviewDataExport: paths.reviewData
  },
  manifestPath: paths.manifest,
  validationPath: paths.validation,
  reviewDataExportPath: paths.reviewData,
  safetyLabels: [
    "LOCAL_ONLY",
    "READ_ONLY",
    "NOT_PUBLIC_RELEASE",
    "NOT_KEYBOARD_OUTPUT"
  ],
  packageStatus: pkg.status,
  manifestStatus: manifest.status ?? "PRESENT",
  sectionsCount: reviewData.sections_summary?.count ?? pkg.sections?.length ?? 0,
  tracksCount: reviewData.tracks_summary?.count ?? pkg.tracks?.length ?? 0,
  generatedAt: "2026-06-30",
  localOnly: true,
  readOnlyOnly: true,
  noNetwork: true,
  noWriteFromUi: true,
  noExportFromUi: true,
  noKeyboardActions: true,
  noDeploy: true,
  noVercel: true,
  noPayment: true,
  noKeyboardOutput: true
};

const markdown = `# Selected Neutral Package Snapshot

LOCAL ONLY - READ ONLY - NOT KEYBOARD OUTPUT

## Status

- Selected package ID: \`${snapshot.selectedPackageId}\`
- Package type: \`${snapshot.packageType}\`
- Keyboard native: ${snapshot.keyboardNative}
- Compatibility: ${snapshot.compatibility}
- Validation status: ${snapshot.validationStatus}
- Review status: ${snapshot.reviewStatus}
- Real keyboard output: ${snapshot.realKeyboardOutput}
- Keyboard transfer: ${snapshot.keyboardTransfer}

## Source Paths

- Package: \`${paths.package}\`
- Manifest: \`${paths.manifest}\`
- Validation: \`${paths.validation}\`
- Review data export: \`${paths.reviewData}\`

## Safety Labels

${snapshot.safetyLabels.map((label) => `- ${label}`).join("\n")}

## Snapshot Rules

- Local only: YES
- Read only: YES
- No network: YES
- No write/export/keyboard action: YES
- No deploy/Vercel/payment: YES
- No keyboard output: YES
`;

mkdirSync(abs("uaos-ai-factory"), { recursive: true });
writeFileSync(abs(paths.snapshotJson), `${JSON.stringify(snapshot, null, 2)}\n`);
writeFileSync(abs(paths.snapshotMd), markdown);

console.log("UAOS Selected Package Snapshot");
console.log("LOCAL ONLY - DATA OUTPUT ONLY - NO KEYBOARD OUTPUT");
console.log(`Selected package: ${selectedPackageId}`);
console.log(`Snapshot JSON: ${paths.snapshotJson}`);
console.log(`Snapshot MD: ${paths.snapshotMd}`);
console.log("Validation status: PASS");
console.log("Real keyboard output: NO");
console.log("Keyboard transfer: NO");
console.log("UAOS Selected Package Snapshot: PASS");

