import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "uaos-ai-factory/local-demo-evidence-pack/ppt-output");
const sourceMdDir = path.join(outputDir, "source-md");
const reportsDir = path.join(root, "uaos-ai-factory/implementation/reports");
const implementationDir = path.join(root, "uaos-ai-factory/implementation");

const pptxFiles = [
  "UAOS_JOBCENTER_EVIDENCE_PACK_DE.pptx",
  "UAOS_SUPPORTER_EVIDENCE_PACK_DE.pptx",
  "UAOS_OWNER_REVIEW_PACK_AR.pptx",
  "UAOS_LOCAL_DEMO_EVIDENCE_MASTER_PACK.pptx"
];
const sourceFiles = [
  "JOBCENTER_PPT_SOURCE_DE.md",
  "SUPPORTER_PPT_SOURCE_DE.md",
  "OWNER_REVIEW_PPT_SOURCE_AR.md",
  "MASTER_EVIDENCE_PPT_SOURCE.md"
];
const keyboardNativeExtensions = [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"];
const forbiddenWording = [
  "ready for keyboard",
  "keyboard transfer ready",
  "production ready",
  "payment enabled",
  "public release ready",
  "real writer ready",
  "produktionsreif",
  "ط¬ط§ظ‡ط² ظ„ظ„ط¨ظٹط¹",
  "ظ†ظ‚ظ„ ط¥ظ„ظ‰ ط§ظ„ط£ظˆط±ط؛ ط¬ط§ظ‡ط²"
];

const failures = [];
const pptxStatus = [];

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

for (const file of pptxFiles) {
  const full = path.join(outputDir, file);
  if (!existsSync(full)) {
    failures.push(`Missing PPTX: ${rel(full)}`);
    continue;
  }
  const size = statSync(full).size;
  const buffer = readFileSync(full);
  const zipSignature = buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4B;
  const first8BytesHex = Array.from(buffer.subarray(0, 8)).map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
  pptxStatus.push({ path: rel(full), size, zipSignature, first8BytesHex });
  if (size <= 0) failures.push(`Empty PPTX: ${rel(full)}`);
  if (!zipSignature) failures.push(`PPTX does not start with ZIP signature PK: ${rel(full)} (${first8BytesHex})`);
}

const manifestPath = path.join(outputDir, "PPT_OUTPUT_MANIFEST.json");
if (!existsSync(manifestPath)) failures.push(`Missing manifest: ${rel(manifestPath)}`);

for (const file of sourceFiles) {
  const full = path.join(sourceMdDir, file);
  if (!existsSync(full)) failures.push(`Missing source markdown: ${rel(full)}`);
}

for (const file of walk(outputDir)) {
  const ext = path.extname(file).toUpperCase();
  if (keyboardNativeExtensions.includes(ext)) failures.push(`Keyboard-native extension found: ${rel(file)}`);
}

const wordingFiles = [
  ...sourceFiles.map((file) => path.join(sourceMdDir, file)),
  path.join(outputDir, "PPT_OUTPUT_MANIFEST.json"),
  path.join(outputDir, "PPT_OUTPUT_MANIFEST.md")
];
for (const file of wordingFiles) {
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8").toLowerCase();
  for (const phrase of forbiddenWording) {
    if (text.includes(phrase.toLowerCase())) failures.push(`Forbidden wording "${phrase}" in ${rel(file)}`);
  }
}

const status = {
  schema: "uaos-ppt-output-qa-status-v1",
  status: failures.length ? "FAIL" : "PASS",
  pptxFiles: pptxStatus,
  sourceFiles: sourceFiles.map((file) => rel(path.join(sourceMdDir, file))),
  manifest: rel(manifestPath),
  keyboardNativeExtensions,
  forbiddenWording,
  failures,
  safety: {
    localOnly: true,
    keyboardOutputCreated: false,
    keyboardTransferAllowed: false,
    deploy: false,
    payment: false,
    publicRelease: false
  }
};

writeFileSync(path.join(root, "uaos-ai-factory/PPT_OUTPUT_QA_STATUS.json"), `${JSON.stringify(status, null, 2)}\n`);
writeFileSync(path.join(root, "uaos-ai-factory/PPT_OUTPUT_QA_STATUS.md"), `# PPT Output QA Status

Status: ${status.status}

PPTX files:
${pptxStatus.map((item) => `- ${item.path}: ${item.size} bytes, ZIP signature PK: ${item.zipSignature ? "YES" : "NO"}`).join("\n")}

Failures:
${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}

Safety:
- Local only: YES
- Keyboard output created: NO
- Keyboard transfer allowed: NO
- Deploy: NO
- Payment: NO
- Public release: NO
`);

writeFileSync(path.join(reportsDir, "PPT_004R_OUTPUT_QA_REPORT.md"), `# PPT-004R Output QA Report

Status: ${status.status}

Verified local PPTX output, ZIP signatures, manifest, forbidden extensions, and forbidden wording.

Failures:
${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}

Safety result:
- Local only: YES
- Keyboard output created: NO
- Keyboard transfer allowed: NO
- Deploy: NO
- Payment: NO
- Public release: NO
`);

writeFileSync(path.join(implementationDir, "PPT_004R_OUTPUT_QA_SUMMARY.json"), `${JSON.stringify({
  schema: "uaos-ppt-recovery-stage-summary-v1",
  stage: "PPT-004R",
  status: status.status,
  failures,
  pptxFiles: pptxStatus,
  safety: status.safety
}, null, 2)}\n`);

console.log("UAOS PPT Output QA Check");
console.log(`Status: ${status.status}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("UAOS PPT Output QA Check: PASS");
