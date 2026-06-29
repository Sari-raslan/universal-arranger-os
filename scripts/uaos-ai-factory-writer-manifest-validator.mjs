import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sandboxDir = path.join(root, "uaos-ai-factory", "writer-sandbox");
const manifestPath = path.join(sandboxDir, "dry-runs", "owner-test-package-dry-run.json");
const validationPath = path.join(sandboxDir, "dry-runs", "owner-test-package-dry-run.validation.json");

const forbiddenExtensions = new Set([
  ".sty",
  ".set",
  ".prs",
  ".stl",
  ".pat",
  ".msp",
  ".kst"
]);

function fail(message) {
  console.error(`UAOS Writer Manifest Validator: FAIL - ${message}`);
  process.exit(1);
}

function walkForbiddenFiles(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkForbiddenFiles(fullPath, found);
      continue;
    }
    if (entry.isFile() && forbiddenExtensions.has(path.extname(entry.name).toLowerCase())) {
      found.push(path.relative(root, fullPath));
    }
  }
  return found;
}

function requireTrue(value, message) {
  if (value !== true) {
    fail(message);
  }
}

function requireFalse(value, message) {
  if (value !== false) {
    fail(message);
  }
}

function requireLabel(manifest, label) {
  if (!Array.isArray(manifest.labels) || !manifest.labels.includes(label)) {
    fail(`manifest missing label: ${label}`);
  }
}

if (!existsSync(manifestPath) || !statSync(manifestPath).isFile()) {
  fail("dry-run manifest is missing");
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

requireLabel(manifest, "EXPERIMENTAL");
requireLabel(manifest, "MANIFEST_ONLY");
requireLabel(manifest, "NOT_A_REAL_KEYBOARD_FILE");
requireLabel(manifest, "NOT_FOR_PUBLIC_RELEASE");

requireTrue(manifest.artifactPolicy?.manifestOnly, "manifest does not confirm manifest-only");
requireTrue(manifest.artifactPolicy?.notARealKeyboardFile, "manifest does not confirm not a real keyboard file");
requireTrue(manifest.safetyGates?.noPublicRelease, "manifest does not confirm no public release");
requireTrue(manifest.safetyGates?.noRealKeyboardOutput, "manifest does not confirm no real keyboard output");

const produced = manifest.artifactPolicy?.forbiddenExtensionsProduced;
if (!Array.isArray(produced) || produced.length !== 0) {
  fail("manifest reports forbidden keyboard extensions were produced");
}

requireFalse(manifest.contentPolicy?.proprietarySamplesIncluded, "manifest reports proprietary samples included");
requireFalse(manifest.contentPolicy?.kontaktContentIncluded, "manifest reports Kontakt content included");
requireFalse(manifest.contentPolicy?.nativeInstrumentsContentIncluded, "manifest reports Native Instruments content included");
requireFalse(manifest.contentPolicy?.sampleLibrariesIncluded, "manifest reports sample libraries included");
requireTrue(
  manifest.futureChecksumPlaceholder?.requiredBeforeGeneratedArtifacts,
  "future checksum placeholder is missing"
);
requireTrue(
  manifest.futureOwnerApproval?.requiredBeforeAnyTrialCandidate,
  "future owner approval requirement is missing"
);

const forbiddenFiles = walkForbiddenFiles(sandboxDir);
if (forbiddenFiles.length > 0) {
  fail(`forbidden keyboard output files found: ${forbiddenFiles.join(", ")}`);
}

const remoteOutput = execFileSync("git", ["remote", "-v"], {
  cwd: root,
  encoding: "utf8"
});

if (!remoteOutput.includes("https://github.com/Sari-raslan/universal-arranger-os.git")) {
  fail("origin remote does not match required Sari-raslan repository");
}

const validation = {
  schema: "uaos-owner-writer-sandbox-validation-result-v1",
  id: "owner-test-package-dry-run.validation",
  status: "PASS",
  manifestPath: "uaos-ai-factory/writer-sandbox/dry-runs/owner-test-package-dry-run.json",
  labelsVerified: [
    "EXPERIMENTAL",
    "MANIFEST_ONLY",
    "NOT_A_REAL_KEYBOARD_FILE",
    "NOT_FOR_PUBLIC_RELEASE"
  ],
  rulesVerified: {
    dryRunManifestExists: true,
    noForbiddenKeyboardExtensionsProduced: true,
    noProprietarySamples: true,
    noKontaktContent: true,
    noNativeInstrumentsContent: true,
    futureChecksumPlaceholderExists: true,
    futureOwnerApprovalRequired: true,
    noForbiddenKeyboardOutputFilesUnderWriterSandbox: true,
    remoteUnchanged: true
  },
  forbiddenExtensionsChecked: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
  realKeyboardOutputCreated: false,
  readyForImpl018OwnerApprovalGate: true,
  readyForRealKeyboardTrialCandidate: false
};

writeFileSync(validationPath, `${JSON.stringify(validation, null, 2)}\n`, "utf8");

console.log("UAOS Writer Manifest Validator: PASS");
console.log("Validation JSON: uaos-ai-factory/writer-sandbox/dry-runs/owner-test-package-dry-run.validation.json");
console.log("Forbidden keyboard output files found: 0");
console.log("Real keyboard output created: NO");
console.log("Remote unchanged: https://github.com/Sari-raslan/universal-arranger-os.git");
