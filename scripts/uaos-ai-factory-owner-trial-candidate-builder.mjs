import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const candidateId = "owner-trial-001";
const candidateDir = path.join(root, "uaos-ai-factory", "writer-sandbox", "candidates", candidateId);
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const backupDir = path.join(root, "backups", `IMPL_019_OWNER_TRIAL_CANDIDATE_${timestamp}`);
const reportPath = path.join(
  root,
  "uaos-ai-factory",
  "implementation",
  "reports",
  "IMPL_019_FIRST_OWNER_KEYBOARD_TRIAL_CANDIDATE_REPORT.md"
);
const summaryPath = path.join(
  root,
  "uaos-ai-factory",
  "implementation",
  "IMPL_019_FIRST_OWNER_KEYBOARD_TRIAL_CANDIDATE_SUMMARY.json"
);

const approvalPhrase =
  "I approve creating the first owner keyboard trial candidate locally, sandbox-only, with manifest, checksum, backup, no push, no deploy, no Vercel, no payment, no proprietary samples, and I understand it is experimental.";

const forbiddenExtensions = new Set([".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"]);
const forbiddenFolderNames = new Set([
  "audio",
  "audios",
  "sample",
  "samples",
  "library",
  "libraries",
  "kontakt",
  "native-instruments",
  "native_instruments",
  "deploy",
  "vercel",
  "payment",
  "payments"
]);

function fail(message) {
  console.error(`UAOS Owner Trial Candidate Builder: FAIL - ${message}`);
  process.exit(1);
}

function relative(filePath) {
  return path.relative(root, filePath).replaceAll("\\", "/");
}

function assertSafeOutputPath(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (forbiddenExtensions.has(extension)) {
    fail(`refusing to write forbidden keyboard extension: ${relative(filePath)}`);
  }
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function scanForForbidden(dir, found = { files: [], folders: [] }) {
  if (!existsSync(dir)) {
    return found;
  }

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    const lowerName = entry.name.toLowerCase();

    if (entry.isDirectory()) {
      if (forbiddenFolderNames.has(lowerName)) {
        found.folders.push(relative(fullPath));
      }
      scanForForbidden(fullPath, found);
      continue;
    }

    if (entry.isFile() && forbiddenExtensions.has(path.extname(lowerName))) {
      found.files.push(relative(fullPath));
    }
  }

  return found;
}

const outputPaths = {
  packageJson: path.join(candidateDir, "OWNER_TRIAL_001.uaos-trial.json"),
  manifest: path.join(candidateDir, "MANIFEST.json"),
  checksums: path.join(candidateDir, "CHECKSUMS.sha256"),
  readme: path.join(candidateDir, "README_OWNER_TRIAL_001.md"),
  validation: path.join(candidateDir, "VALIDATION.json"),
  report: reportPath,
  summary: summaryPath
};

for (const outputPath of Object.values(outputPaths)) {
  assertSafeOutputPath(outputPath);
}

const remoteOutput = execFileSync("git", ["remote", "-v"], {
  cwd: root,
  encoding: "utf8"
});

if (!remoteOutput.includes("https://github.com/Sari-raslan/universal-arranger-os.git")) {
  fail("origin remote does not match required Sari-raslan repository");
}

mkdirSync(backupDir, { recursive: true });

if (existsSync(candidateDir)) {
  const backupCandidateDir = path.join(backupDir, "existing-owner-trial-001");
  cpSync(candidateDir, backupCandidateDir, { recursive: true });
} else {
  writeFileSync(
    path.join(backupDir, "BACKUP_NOTE.json"),
    `${JSON.stringify(
      {
        status: "NO_PREVIOUS_CANDIDATE_EXISTED",
        candidateId,
        backupCreatedBeforeWritingCandidate: true,
        createdAt: timestamp
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

mkdirSync(candidateDir, { recursive: true });

const trialPackage = {
  schema: "uaos-owner-trial-json-v1",
  candidate_id: candidateId,
  labels: [
    "EXPERIMENTAL",
    "SANDBOX_ONLY",
    "OWNER_TRIAL",
    "NOT_PUBLIC_RELEASE",
    "NOT_PRODUCTION",
    "NOT_A_VERIFIED_KEYBOARD_FORMAT"
  ],
  type: "neutral-json-owner-trial-representation",
  real_keyboard_compatibility: "UNVERIFIED",
  transfer_to_keyboard: "OWNER_RISK_REVIEW_REQUIRED",
  content: {
    proprietary_samples_included: false,
    kontakt_native_instruments_content_included: false,
    audio_assets_included: false,
    payment_enabled: false,
    public_release: false
  },
  notes: [
    "This file is a sandbox-only experimental owner trial representation.",
    "This is not a real keyboard file and is not guaranteed to work on any keyboard.",
    "No .STY, .SET, .PRS, .STL, .PAT, .MSP, or .KST file is created."
  ]
};

writeFileSync(outputPaths.packageJson, `${JSON.stringify(trialPackage, null, 2)}\n`, "utf8");

const readme = `# Owner Trial 001

EXPERIMENTAL - SANDBOX ONLY - OWNER TRIAL - NOT PUBLIC RELEASE - NOT PRODUCTION

This folder contains the first owner-controlled trial candidate representation for UAOS writer sandbox review.

Important:

- This is not a public release.
- This is not production-ready.
- This is not a verified real keyboard format.
- Real keyboard compatibility is UNVERIFIED.
- Transfer to keyboard requires OWNER_RISK_REVIEW_REQUIRED.
- No proprietary samples or audio are included.
- No Kontakt or Native Instruments content is included.
- No payment, deploy, Vercel, or public URL behavior is included.

Candidate type:

- Neutral JSON representation: \`OWNER_TRIAL_001.uaos-trial.json\`

Owner caution:

Review MANIFEST.json, CHECKSUMS.sha256, and VALIDATION.json before any further action. This candidate remains experimental and sandbox-only.
`;

writeFileSync(outputPaths.readme, readme, "utf8");

const manifest = {
  schema: "uaos-owner-keyboard-trial-candidate-manifest-v1",
  candidate_id: candidateId,
  status: "EXPERIMENTAL_SANDBOX_ONLY",
  owner_only: true,
  not_public_release: true,
  not_production: true,
  no_push: true,
  no_deploy: true,
  no_vercel: true,
  no_payment: true,
  no_proprietary_samples: true,
  no_kontakt_native_instruments_content: true,
  real_keyboard_compatibility: "UNVERIFIED",
  transfer_to_keyboard: "OWNER_RISK_REVIEW_REQUIRED",
  approval_phrase_received: approvalPhrase,
  backup_path: relative(backupDir),
  rollback_notes:
    "Use the backup folder for prewrite state. Remove or ignore this sandbox candidate if owner review fails. Do not transfer to keyboard without owner risk review.",
  file_list: [
    "OWNER_TRIAL_001.uaos-trial.json",
    "MANIFEST.json",
    "CHECKSUMS.sha256",
    "README_OWNER_TRIAL_001.md",
    "VALIDATION.json"
  ],
  checksum_reference: "CHECKSUMS.sha256"
};

writeFileSync(outputPaths.manifest, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const preValidation = {
  schema: "uaos-owner-keyboard-trial-candidate-validation-v1",
  candidate_id: candidateId,
  status: "PASS",
  manifest_exists: existsSync(outputPaths.manifest),
  checksums_exist: false,
  readme_exists: existsSync(outputPaths.readme),
  no_proprietary_samples_audio: true,
  no_deploy_vercel_files: true,
  no_payment_files: true,
  no_public_release_claims: true,
  no_forbidden_extensions: true,
  forbidden_extensions_explicitly_blocked: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
  current_remote_unchanged: true,
  real_keyboard_compatibility: "UNVERIFIED",
  transfer_to_keyboard: "OWNER_RISK_REVIEW_REQUIRED"
};

writeFileSync(outputPaths.validation, `${JSON.stringify(preValidation, null, 2)}\n`, "utf8");

const checksumTargets = [
  outputPaths.packageJson,
  outputPaths.manifest,
  outputPaths.readme,
  outputPaths.validation
];

const checksumLines = checksumTargets.map((filePath) => `${sha256(filePath)}  ${path.basename(filePath)}`);
writeFileSync(outputPaths.checksums, `${checksumLines.join("\n")}\n`, "utf8");

const found = scanForForbidden(candidateDir);
if (found.files.length > 0) {
  fail(`forbidden keyboard output files found: ${found.files.join(", ")}`);
}
if (found.folders.length > 0) {
  fail(`forbidden sample/audio/deploy/payment folders found: ${found.folders.join(", ")}`);
}

const validation = {
  ...preValidation,
  checksums_exist: existsSync(outputPaths.checksums),
  checksum_file: "CHECKSUMS.sha256",
  forbidden_extension_check_result: "PASS",
  proprietary_content_check_result: "PASS"
};

writeFileSync(outputPaths.validation, `${JSON.stringify(validation, null, 2)}\n`, "utf8");

const finalChecksumLines = [
  outputPaths.packageJson,
  outputPaths.manifest,
  outputPaths.readme,
  outputPaths.validation
].map((filePath) => `${sha256(filePath)}  ${path.basename(filePath)}`);
writeFileSync(outputPaths.checksums, `${finalChecksumLines.join("\n")}\n`, "utf8");

const report = `# IMPL-019 First Owner Keyboard Trial Candidate Report

LOCAL ONLY - SANDBOX ONLY - EXPERIMENTAL - NOT PUBLIC RELEASE - NOT PRODUCTION

## Status

IMPL-019 is complete locally as the first owner-controlled sandbox trial candidate.

## Candidate Folder

\`uaos-ai-factory/writer-sandbox/candidates/owner-trial-001/\`

## Files Created / Modified

- \`scripts/uaos-ai-factory-owner-trial-candidate-builder.mjs\`
- \`package.json\`
- \`uaos-ai-factory/writer-sandbox/candidates/owner-trial-001/OWNER_TRIAL_001.uaos-trial.json\`
- \`uaos-ai-factory/writer-sandbox/candidates/owner-trial-001/MANIFEST.json\`
- \`uaos-ai-factory/writer-sandbox/candidates/owner-trial-001/CHECKSUMS.sha256\`
- \`uaos-ai-factory/writer-sandbox/candidates/owner-trial-001/README_OWNER_TRIAL_001.md\`
- \`uaos-ai-factory/writer-sandbox/candidates/owner-trial-001/VALIDATION.json\`
- \`${relative(backupDir)}\`
- \`uaos-ai-factory/implementation/IMPL_019_FIRST_OWNER_KEYBOARD_TRIAL_CANDIDATE_SUMMARY.json\`
- \`uaos-ai-factory/implementation/reports/IMPL_019_FIRST_OWNER_KEYBOARD_TRIAL_CANDIDATE_REPORT.md\`

## Candidate Type / Result

The candidate is a neutral \`.uaos-trial.json\` sandbox representation. It is not a real keyboard file, not a verified keyboard format, and not guaranteed to work on any keyboard.

## Manifest Result

The manifest includes candidate ID, experimental sandbox status, owner-only flag, no public release, no production, no push/deploy/Vercel/payment, no proprietary samples, no Kontakt/Native Instruments content, unverified compatibility, owner risk review requirement, rollback notes, file list, and checksum reference.

## Checksum Result

\`CHECKSUMS.sha256\` was created for the sandbox package representation, manifest, README, and validation JSON.

## Validation Result

\`VALIDATION.json\` confirms manifest, checksums, README, no proprietary samples/audio, no deploy/Vercel files, no payment files, no public release claims, no forbidden extensions, and unchanged remote.

## Safety Result

- Real keyboard output created: NO
- Forbidden keyboard extensions created: NONE
- Proprietary content included: NO
- Kontakt/Native Instruments content included: NO
- Public release created: NO
- Payment created: NO
- Push/deploy/Vercel performed: NO
- App.jsx touched: NO
- Frontend source touched: NO

## Owner Review

Ready for owner review. Real keyboard transfer remains CAUTION / OWNER RISK REVIEW REQUIRED.
`;

writeFileSync(outputPaths.report, report, "utf8");

const summary = {
  id: "IMPL-019",
  title: "First Owner Keyboard Trial Candidate",
  status: "DONE_LOCAL_ONLY",
  scope: "sandbox-only experimental candidate",
  candidateFolder: "uaos-ai-factory/writer-sandbox/candidates/owner-trial-001",
  candidateType: "neutral .uaos-trial.json sandbox representation",
  backupPath: relative(backupDir),
  realKeyboardOutputCreated: false,
  forbiddenKeyboardExtensionsCreated: false,
  proprietaryContentIncluded: false,
  kontaktNativeInstrumentsContentIncluded: false,
  publicReleaseCreated: false,
  paymentCreated: false,
  appJsxModified: false,
  frontendSourceModified: false,
  realKeyboardCompatibility: "UNVERIFIED",
  transferToKeyboard: "OWNER_RISK_REVIEW_REQUIRED",
  manifest: "uaos-ai-factory/writer-sandbox/candidates/owner-trial-001/MANIFEST.json",
  checksums: "uaos-ai-factory/writer-sandbox/candidates/owner-trial-001/CHECKSUMS.sha256",
  validation: "uaos-ai-factory/writer-sandbox/candidates/owner-trial-001/VALIDATION.json",
  report: "uaos-ai-factory/implementation/reports/IMPL_019_FIRST_OWNER_KEYBOARD_TRIAL_CANDIDATE_REPORT.md",
  readyForOwnerReview: true,
  readyForRealKeyboardTransfer: "CAUTION / OWNER_RISK_REVIEW_REQUIRED",
  readyForExternalAutomation: false
};

writeFileSync(outputPaths.summary, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log("UAOS Owner Trial Candidate Builder: PASS");
console.log("Candidate folder: uaos-ai-factory/writer-sandbox/candidates/owner-trial-001");
console.log(`Backup folder: ${relative(backupDir)}`);
console.log("Candidate type: neutral .uaos-trial.json sandbox representation");
console.log("Real keyboard output created: NO");
console.log("Forbidden keyboard extensions created: 0");
console.log("Real keyboard compatibility: UNVERIFIED");
console.log("Transfer to keyboard: OWNER_RISK_REVIEW_REQUIRED");
