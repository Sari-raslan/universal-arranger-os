import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const dryRunDir = path.join(root, "uaos-ai-factory", "writer-sandbox", "dry-runs");
const manifestPath = path.join(dryRunDir, "owner-test-package-dry-run.json");
const readmePath = path.join(dryRunDir, "README.md");

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
  console.error(`UAOS Writer Dry-Run Builder: FAIL - ${message}`);
  process.exit(1);
}

function assertNoForbiddenExtension(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (forbiddenExtensions.has(extension)) {
    fail(`refusing to write forbidden keyboard extension: ${filePath}`);
  }
}

const outputs = [manifestPath, readmePath];
for (const output of outputs) {
  assertNoForbiddenExtension(output);
}

const manifest = {
  schema: "uaos-owner-writer-sandbox-dry-run-manifest-v1",
  id: "owner-test-package-dry-run",
  status: "DRY_RUN_MANIFEST_ONLY",
  labels: [
    "EXPERIMENTAL",
    "MANIFEST_ONLY",
    "NOT_A_REAL_KEYBOARD_FILE",
    "NOT_FOR_PUBLIC_RELEASE",
    "SANDBOX_ONLY"
  ],
  createdBy: "scripts/uaos-ai-factory-writer-dry-run-builder.mjs",
  artifactPolicy: {
    manifestOnly: true,
    notARealKeyboardFile: true,
    notDeviceLoadable: true,
    noRealWriterOutput: true,
    noRealOrganKeyboardTrialPackage: true,
    forbiddenExtensionsProduced: [],
    forbiddenExtensionsBlocked: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"]
  },
  contentPolicy: {
    proprietarySamplesIncluded: false,
    kontaktContentIncluded: false,
    nativeInstrumentsContentIncluded: false,
    sampleLibrariesIncluded: false
  },
  futureChecksumPlaceholder: {
    requiredBeforeGeneratedArtifacts: true,
    algorithm: "sha256",
    items: []
  },
  futureOwnerApproval: {
    requiredBeforeAnyTrialCandidate: true,
    approvalPhrase: "I approve creating the first owner keyboard trial candidate locally, sandbox-only, with manifest, checksum, backup, no push, no deploy, no Vercel, no payment, no proprietary samples, and I understand it is experimental."
  },
  safetyGates: {
    localOnly: true,
    noPush: true,
    noDeploy: true,
    noVercel: true,
    noPayment: true,
    noPublicRelease: true,
    noRealKeyboardOutput: true,
    noProprietaryContent: true,
    externalAutomationBlocked: true
  }
};

const readme = `# Owner Writer Sandbox Dry-Runs

LOCAL ONLY - EXPERIMENTAL - MANIFEST ONLY - NOT FOR PUBLIC RELEASE

This folder contains dry-run manifest artifacts only.

Current sample:

- \`owner-test-package-dry-run.json\`

Safety notes:

- Not a real keyboard file.
- Not loadable on a real keyboard.
- No .STY, .SET, .PRS, .STL, .PAT, .MSP, or .KST output.
- No proprietary samples.
- No Kontakt or Native Instruments content.
- Future checksums are required before generated artifacts.
- Future owner approval is required before any trial candidate.
`;

mkdirSync(dryRunDir, { recursive: true });
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
writeFileSync(readmePath, readme, "utf8");

console.log("UAOS Writer Dry-Run Builder: PASS");
console.log("Created manifest-only dry-run JSON: uaos-ai-factory/writer-sandbox/dry-runs/owner-test-package-dry-run.json");
console.log("Created dry-run README: uaos-ai-factory/writer-sandbox/dry-runs/README.md");
console.log("Real keyboard output created: NO");
console.log("Forbidden keyboard extensions produced: 0");
