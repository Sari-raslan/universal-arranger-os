import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "uaos-ai-factory/local-demo-evidence-pack/pdf-output");
const sourceMdDir = path.join(outputDir, "source-md");
const sourceHtmlDir = path.join(outputDir, "source-html");
const reportsDir = path.join(root, "uaos-ai-factory/implementation/reports");
const implementationDir = path.join(root, "uaos-ai-factory/implementation");

const pdfs = [
  "UAOS_JOBCENTER_EVIDENCE_PACK_DE.pdf",
  "UAOS_SUPPORTER_EVIDENCE_PACK_DE.pdf",
  "UAOS_OWNER_REVIEW_PACK_AR.pdf",
  "UAOS_LOCAL_DEMO_EVIDENCE_MASTER_PACK.pdf"
];
const htmlFiles = [
  "UAOS_JOBCENTER_EVIDENCE_PACK_DE.html",
  "UAOS_SUPPORTER_EVIDENCE_PACK_DE.html",
  "UAOS_OWNER_REVIEW_PACK_AR.html",
  "UAOS_LOCAL_DEMO_EVIDENCE_MASTER_PACK.html"
];
const mdFiles = [
  "JOBCENTER_PDF_SOURCE_DE.md",
  "SUPPORTER_PDF_SOURCE_DE.md",
  "OWNER_REVIEW_PDF_SOURCE_AR.md",
  "MASTER_EVIDENCE_PDF_SOURCE.md"
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
const pdfStatus = [];

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

for (const file of pdfs) {
  const full = path.join(outputDir, file);
  if (!existsSync(full)) {
    failures.push(`Missing PDF: ${rel(full)}`);
    continue;
  }
  const size = statSync(full).size;
  pdfStatus.push({ path: rel(full), size });
  if (size <= 0) failures.push(`Empty PDF: ${rel(full)}`);
}

for (const file of htmlFiles) {
  const full = path.join(sourceHtmlDir, file);
  if (!existsSync(full)) failures.push(`Missing HTML source: ${rel(full)}`);
}

for (const file of mdFiles) {
  const full = path.join(sourceMdDir, file);
  if (!existsSync(full)) failures.push(`Missing MD source: ${rel(full)}`);
}

const manifestPath = path.join(outputDir, "PDF_OUTPUT_MANIFEST.json");
if (!existsSync(manifestPath)) failures.push(`Missing manifest: ${rel(manifestPath)}`);

for (const file of walk(outputDir)) {
  const ext = path.extname(file).toUpperCase();
  if (keyboardNativeExtensions.includes(ext)) failures.push(`Keyboard-native extension found: ${rel(file)}`);
}

for (const file of [...mdFiles.map((name) => path.join(sourceMdDir, name)), ...htmlFiles.map((name) => path.join(sourceHtmlDir, name))]) {
  if (!existsSync(file)) continue;
  const text = readFileSync(file, "utf8").toLowerCase();
  for (const phrase of forbiddenWording) {
    if (text.includes(phrase.toLowerCase())) failures.push(`Forbidden wording "${phrase}" in ${rel(file)}`);
  }
}

const status = {
  schema: "uaos-pdf-output-qa-status-v1",
  status: failures.length ? "FAIL" : "PASS",
  pdfs: pdfStatus,
  htmlFiles: htmlFiles.map((name) => rel(path.join(sourceHtmlDir, name))),
  mdFiles: mdFiles.map((name) => rel(path.join(sourceMdDir, name))),
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

writeFileSync(path.join(root, "uaos-ai-factory/PDF_OUTPUT_QA_STATUS.json"), `${JSON.stringify(status, null, 2)}\n`);
writeFileSync(path.join(root, "uaos-ai-factory/PDF_OUTPUT_QA_STATUS.md"), `# PDF Output QA Status

Status: ${status.status}

PDF files:
${pdfStatus.map((item) => `- ${item.path}: ${item.size} bytes`).join("\n")}

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

writeFileSync(path.join(reportsDir, "PDF_004R_OUTPUT_QA_REPORT.md"), `# PDF-004R Output QA Report

Status: ${status.status}

Verified local PDF output, HTML sources, markdown sources, manifest, forbidden extensions, and forbidden wording.

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

writeFileSync(path.join(implementationDir, "PDF_004R_OUTPUT_QA_SUMMARY.json"), `${JSON.stringify({
  schema: "uaos-pdf-recovery-stage-summary-v1",
  stage: "PDF-004R",
  status: status.status,
  failures,
  pdfs: pdfStatus,
  safety: status.safety
}, null, 2)}\n`);

console.log("UAOS PDF Output QA Check");
console.log(`Status: ${status.status}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("UAOS PDF Output QA Check: PASS");
