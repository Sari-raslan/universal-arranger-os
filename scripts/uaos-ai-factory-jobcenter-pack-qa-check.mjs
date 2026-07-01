import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const packDir = path.join(root, "uaos-ai-factory/jobcenter-send-ready");
const requiredDate = "2026-07-01";
const requiredPlaceholder = "[JOBCENTER_MONITORING_LINK_HERE]";
const plannedJobcenterLink = "https://sari-raslan.github.io/universal-arranger-os/jobcenter/";
const notLiveMarker = "noch nicht live";
const keyboardNativeExtensions = [".STY", ".SET", ".PRS"];
const forbiddenPhrases = [
  "private friend",
  "unterstützer",
  "unterstuetzer",
  "private unterstützung",
  "private unterstuetzung",
  "friend support pack",
  "supporter pack",
  "supporter",
  "keyboard ready",
  "ready for keyboard",
  "production ready",
  "production-ready",
  "payment enabled",
  "deploy ready",
  "public release ready",
  "keyboard transfer ready",
  "real writer ready",
  "produktionsreif",
  "produktionsbereit",
  "ط¬ط§ظ‡ط² ظ„ظ„ط¨ظٹط¹",
  "ظ†ظ‚ظ„ ط¥ظ„ظ‰ ط§ظ„ط£ظˆط±ط؛ ط¬ط§ظ‡ط²"
];

const failures = [];

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

if (!existsSync(packDir)) failures.push(`Missing pack folder: ${rel(packDir)}`);

const files = existsSync(packDir) ? walk(packDir) : [];
const pdfs = files.filter((file) => path.extname(file).toLowerCase() === ".pdf");
const pptx = files.filter((file) => path.extname(file).toLowerCase() === ".pptx");

if (pdfs.length !== 1) failures.push(`Expected exactly one PDF, found ${pdfs.length}`);
if (pptx.length !== 1) failures.push(`Expected exactly one PPTX, found ${pptx.length}`);
for (const file of [...pdfs, ...pptx]) {
  if (existsSync(file) && statSync(file).size <= 0) failures.push(`Output is empty: ${rel(file)}`);
}

for (const file of files) {
  if (keyboardNativeExtensions.includes(path.extname(file).toUpperCase())) failures.push(`Keyboard-native file found: ${rel(file)}`);
}

const generatedStatusFiles = new Set([
  "JOBCENTER_PACK_QA_STATUS.json",
  "JOBCENTER_PACK_QA_STATUS.md",
  "JOBCENTER_FINAL_QA_STATUS.json",
  "JOBCENTER_FINAL_QA_STATUS.md"
]);
const textFiles = files.filter((file) => [".md", ".json", ".html", ".txt"].includes(path.extname(file).toLowerCase()) && !generatedStatusFiles.has(path.basename(file)));
const combinedText = textFiles.map((file) => readFileSync(file, "utf8")).join("\n").toLowerCase();
if (!combinedText.includes(requiredDate)) failures.push(`Required date missing: ${requiredDate}`);
if (!combinedText.includes(requiredPlaceholder.toLowerCase())) failures.push("Monitoring placeholder missing");
if (!combinedText.includes(plannedJobcenterLink)) failures.push("Planned Jobcenter link missing");
if (!combinedText.includes(notLiveMarker)) failures.push("Planned Jobcenter link is not marked as not live");
for (const phrase of forbiddenPhrases) {
  if (combinedText.includes(phrase)) failures.push(`Forbidden wording found: ${phrase}`);
}

const status = {
  schema: "uaos-jobcenter-pack-qa-status-v1",
  status: failures.length ? "FAIL" : "PASS",
  pdfs: pdfs.map(rel),
  pptx: pptx.map(rel),
  requiredDate,
  monitoringPlaceholderPresent: combinedText.includes(requiredPlaceholder.toLowerCase()),
  plannedJobcenterLinkPresent: combinedText.includes(plannedJobcenterLink),
  linkMarkedNotLiveUntilDeployApproval: combinedText.includes(notLiveMarker),
  failures,
  safety: {
    localOnly: true,
    keyboardOutputCreated: false,
    keyboardTransferAllowed: false,
    pushDeployVercelPayment: false
  }
};

writeFileSync(path.join(root, "uaos-ai-factory/jobcenter-send-ready/JOBCENTER_PACK_QA_STATUS.json"), `${JSON.stringify(status, null, 2)}\n`);
writeFileSync(path.join(root, "uaos-ai-factory/jobcenter-send-ready/JOBCENTER_PACK_QA_STATUS.md"), `# Jobcenter Pack QA Status

Status: ${status.status}

PDF files:
${status.pdfs.map((file) => `- ${file}`).join("\n") || "- None"}

PPTX files:
${status.pptx.map((file) => `- ${file}`).join("\n") || "- None"}

Monitoring placeholder present: ${status.monitoringPlaceholderPresent ? "YES" : "NO"}

Failures:
${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}
`);

console.log("UAOS Jobcenter Pack QA Check");
console.log(`Status: ${status.status}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("UAOS Jobcenter Pack QA Check: PASS");
