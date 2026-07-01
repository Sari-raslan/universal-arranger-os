import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "uaos-ai-factory/local-demo-evidence-pack/ppt-output");
const implementationDir = path.join(root, "uaos-ai-factory/implementation");
const reportsDir = path.join(implementationDir, "reports");

const pptxFiles = [
  "UAOS_JOBCENTER_EVIDENCE_PACK_DE.pptx",
  "UAOS_SUPPORTER_EVIDENCE_PACK_DE.pptx",
  "UAOS_OWNER_REVIEW_PACK_AR.pptx",
  "UAOS_LOCAL_DEMO_EVIDENCE_MASTER_PACK.pptx"
];

function rel(file) {
  return path.relative(root, file).replaceAll("\\", "/");
}

const results = [];
const failures = [];

for (const file of pptxFiles) {
  const full = path.join(outputDir, file);
  if (!existsSync(full)) {
    failures.push(`Missing PPTX: ${rel(full)}`);
    results.push({ path: rel(full), exists: false, size: 0, first8BytesHex: null, startsWithPk: false });
    continue;
  }
  const buffer = readFileSync(full);
  const first8BytesHex = Array.from(buffer.subarray(0, 8)).map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
  const startsWithPk = buffer.length >= 2 && buffer[0] === 0x50 && buffer[1] === 0x4B;
  const size = statSync(full).size;
  if (!startsWithPk) failures.push(`PPTX does not start with PK: ${rel(full)} (${first8BytesHex})`);
  results.push({ path: rel(full), exists: true, size, first8BytesHex, startsWithPk });
}

const status = {
  schema: "uaos-pptx-signature-diagnosis-status-v1",
  status: failures.length ? "FAIL" : "PASS",
  results,
  failures,
  safety: {
    localOnly: true,
    keyboardOutputCreated: false,
    keyboardTransferAllowed: false
  }
};

writeFileSync(path.join(root, "uaos-ai-factory/PPTX_SIGNATURE_DIAGNOSIS_STATUS.json"), `${JSON.stringify(status, null, 2)}\n`);
writeFileSync(path.join(root, "uaos-ai-factory/PPTX_SIGNATURE_DIAGNOSIS_STATUS.md"), `# PPTX Signature Diagnosis Status

Status: ${status.status}

Results:
${results.map((item) => `- ${item.path}: first 8 bytes ${item.first8BytesHex ?? "missing"}, starts with PK: ${item.startsWithPk ? "YES" : "NO"}`).join("\n")}

Failures:
${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}
`);

writeFileSync(path.join(reportsDir, "PPT_004R2_SIGNATURE_DIAGNOSIS_REPORT.md"), `# PPT-004R2 Signature Diagnosis Report

Status: ${status.status}

Read each PPTX file as a Buffer and checked the first two bytes for the ZIP signature \`50 4B\`.

Results:
${results.map((item) => `- ${item.path}: first 8 bytes ${item.first8BytesHex ?? "missing"}, starts with PK: ${item.startsWithPk ? "YES" : "NO"}`).join("\n")}

Failures:
${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}
`);

writeFileSync(path.join(implementationDir, "PPT_004R2_SIGNATURE_DIAGNOSIS_SUMMARY.json"), `${JSON.stringify({
  schema: "uaos-ppt-recovery-stage-summary-v1",
  stage: "PPT-004R2-A",
  status: status.status,
  results,
  rebuildNeeded: failures.length > 0
}, null, 2)}\n`);

console.log("UAOS PPTX Signature Diagnosis");
console.log(`Status: ${status.status}`);
for (const item of results) console.log(`${item.path}: ${item.first8BytesHex ?? "missing"} PK=${item.startsWithPk ? "YES" : "NO"}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
