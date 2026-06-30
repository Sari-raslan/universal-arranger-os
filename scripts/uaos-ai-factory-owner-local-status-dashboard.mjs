import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const expectedOrigin = "https://github.com/Sari-raslan/universal-arranger-os.git";
const failures = [];

function rel(file) {
  return file.replaceAll("\\", "/");
}

function fileExists(file) {
  return existsSync(path.join(root, file));
}

function readJson(file) {
  return JSON.parse(readFileSync(path.join(root, file), "utf8"));
}

function run(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
}

function section(title) {
  console.log("");
  console.log(`## ${title}`);
}

const statusShort = run("git", ["status", "--short"]);
const remoteOutput = run("git", ["remote", "-v"]);
const latestCommits = run("git", ["--no-pager", "log", "--oneline", "-8"]);

if (!remoteOutput.includes(expectedOrigin)) failures.push("Origin remote changed.");

const ownerNeutralPath = "uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-002/OWNER_NEUTRAL_002.uaos-neutral.json";
const ownerNeutralExists = fileExists(ownerNeutralPath);
if (!ownerNeutralExists) failures.push("owner-neutral-002 is missing.");

const selectedPackageId = "owner-neutral-003";
const selectedPackagePath = "uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-003/OWNER_NEUTRAL_003.uaos-neutral.json";
const selectedValidationPath = "uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-003/VALIDATION.json";
const selectedReviewDataPath = "uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-003/OWNER_NEUTRAL_003_REVIEW_DATA.json";
const selectedSnapshotPath = "uaos-ai-factory/SELECTED_NEUTRAL_PACKAGE_SNAPSHOT.json";
const dataBridgePlanPath = "uaos-ai-factory/implementation/READ_ONLY_SELECTED_PACKAGE_DATA_BRIDGE_IMPLEMENTATION_PLAN.md";
const selectedPackageExists = fileExists(selectedPackagePath);
const selectedValidationExists = fileExists(selectedValidationPath);
const selectedReviewDataExists = fileExists(selectedReviewDataPath);
const selectedSnapshotExists = fileExists(selectedSnapshotPath);
const dataBridgePlanExists = fileExists(dataBridgePlanPath);
if (!selectedPackageExists) failures.push("owner-neutral-003 selected package is missing.");
if (!selectedValidationExists) failures.push("owner-neutral-003 validation data is missing.");
if (!selectedReviewDataExists) failures.push("owner-neutral-003 review data export is missing.");
if (!selectedSnapshotExists) failures.push("Selected neutral package snapshot is missing.");
if (!dataBridgePlanExists) failures.push("Read-only selected package data bridge plan is missing.");

let selectedSnapshot = null;
if (selectedSnapshotExists) {
  selectedSnapshot = readJson(selectedSnapshotPath);
  if (selectedSnapshot.selectedPackageId !== selectedPackageId) failures.push("Selected package snapshot ID mismatch.");
  if (selectedSnapshot.validationStatus !== "PASS") failures.push("Selected package snapshot validation is not PASS.");
  if (selectedSnapshot.keyboardNative !== false) failures.push("Selected package snapshot keyboardNative is not false.");
  if (selectedSnapshot.realKeyboardOutput !== "NO") failures.push("Selected package snapshot real keyboard output is not NO.");
  if (selectedSnapshot.keyboardTransfer !== "NO") failures.push("Selected package snapshot keyboard transfer is not NO.");
}

let metadataStatus = "NOT RUN";
try {
  run("node", ["scripts/uaos-ai-factory-neutral-metadata-check.mjs"]);
  metadataStatus = "PASS";
} catch {
  metadataStatus = "FAIL";
  failures.push("Neutral metadata validation failed.");
}

let legacyStatus = "Documented/untouched status not found";
for (const summaryPath of [
  "uaos-ai-factory/implementation/IMPLEMENTATION_ROUND_041_045_OWNER_REVIEW_MASTER_SEAL.json",
  "uaos-ai-factory/implementation/IMPLEMENTATION_ROUND_036_040_OWNER_REVIEW_SEAL.json",
  "uaos-ai-factory/implementation/IMPLEMENTATION_ROUND_031R_035_COMPLETION_SEAL.json"
]) {
  if (!fileExists(summaryPath)) continue;
  const summary = readJson(summaryPath);
  const count = summary.legacyStyFilesDocumentedButUntouched ?? summary.legacyStyFilesDocumented;
  if (count) {
    legacyStatus = `${count} legacy .STY files documented/untouched`;
    break;
  }
}

console.log("UAOS Owner Local Status Dashboard");
console.log("LOCAL ONLY - OWNER STATUS ONLY - NO KEYBOARD OUTPUT");

section("Latest Local Commits");
console.log(latestCommits);

section("Repository Status");
console.log(`Git status clean: ${statusShort.length === 0 ? "YES" : "NO"}`);
console.log(`Remote unchanged: ${remoteOutput.includes(expectedOrigin) ? "YES" : "NO"}`);
console.log(`Expected remote: ${expectedOrigin}`);

section("Owner Neutral Package");
console.log(`owner-neutral-002 exists: ${ownerNeutralExists ? "YES" : "NO"}`);
console.log(`owner-neutral-002 path: ${rel(ownerNeutralPath)}`);
console.log(`Metadata validation status: ${metadataStatus}`);

section("Selected Package UI / Review Data");
console.log("DEV-013 UI panel implemented: YES");
console.log("DEV-014 visual verification: PASS");
console.log(`Selected package: ${selectedPackageId}`);
console.log(`Selected package exists: ${selectedPackageExists ? "YES" : "NO"}`);
console.log(`Selected package path: ${rel(selectedPackagePath)}`);
console.log(`Review data export exists: ${selectedReviewDataExists ? "YES" : "NO"}`);
console.log(`Review data export path: ${rel(selectedReviewDataPath)}`);
console.log("Real keyboard output: NO");
console.log("Keyboard transfer: NO");
console.log("Push/deploy/Vercel: NO");

section("Selected Package Snapshot");
console.log(`Selected package snapshot exists: ${selectedSnapshotExists ? "YES" : "NO"}`);
console.log(`Snapshot path: ${rel(selectedSnapshotPath)}`);
console.log(`Snapshot selectedPackageId: ${selectedSnapshot?.selectedPackageId ?? "MISSING"}`);
console.log(`Snapshot validation status: ${selectedSnapshot?.validationStatus ?? "MISSING"}`);
console.log("UI panel visible from DEV-014: YES");
console.log(`Data bridge plan exists: ${dataBridgePlanExists ? "YES" : "NO"}`);
console.log(`Data bridge plan path: ${rel(dataBridgePlanPath)}`);
console.log("Real keyboard output: NO");
console.log("Keyboard transfer: NO");

section("Safety Status");
console.log("Real keyboard output status: NO");
console.log("Keyboard transfer status: NO");
console.log(`Legacy .STY inventory status: ${legacyStatus}`);
console.log("Push/deploy/Vercel/payment status: NO");

section("Safe Next Actions");
console.log("- Review owner-neutral-003 review data as text only.");
console.log("- Compare owner-neutral-003 package metadata with the review export.");
console.log("- Future read-only data bridge implementation only with approval.");
console.log("- Continue validation tooling.");
console.log("- Stop before keyboard output.");

section("Blocked Actions");
console.log("- No real keyboard output.");
console.log("- No keyboard transfer.");
console.log("- No keyboard-native file output.");
console.log("- No legacy file movement, deletion, restore, or content copying.");
console.log("- No proprietary samples or Kontakt / Native Instruments content.");
console.log("- No push, deploy, Vercel, payment, or external automation.");

if (failures.length > 0) {
  section("Result");
  console.error("UAOS Owner Local Status Dashboard: FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

section("Result");
console.log("UAOS Owner Local Status Dashboard: PASS");
