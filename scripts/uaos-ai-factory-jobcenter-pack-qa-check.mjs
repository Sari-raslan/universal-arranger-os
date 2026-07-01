import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const packDir = path.join(root, "uaos-ai-factory/jobcenter-send-ready");
const requiredDate = "2026-07-01";
const requiredPlaceholder = "[JOBCENTER_MONITORING_LINK_HERE]";
const plannedJobcenterLink = "https://sari-raslan.github.io/universal-arranger-os/jobcenter/";
const monitorActivationText = "wird nach freigabe des uploads aktiviert";
const notLiveMarker = "der link ist derzeit noch nicht \u00f6ffentlich live, da kein upload, kein push und kein deploy freigegeben wurde";
const keyboardNativeExtensions = [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"];
const transliterationFailures = [
  "oeffentlich",
  "Oeffentlich",
  "Veroeffentlichung",
  "Praesentation",
  "Erklaerung",
  "fuer",
  "ueber",
  "moeglich",
  "Pruefung",
  "Geraet"
];
const mojibakeMarkers = [
  "\u00e2\u201d\u0153",
  "\u251c",
  "\u00c3",
  "\u00c2",
  "\u00ef\u00bf\u00bd",
  "\ufffd"
];
const forbiddenPhrases = [
  "private friend",
  "unterst\u00fctzer",
  "unterstuetzer",
  "private unterst\u00fctzung",
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
  "\u0637\u00ac\u0637\u00a7\u0638\u2021\u0637\u00b2 \u0638\u201e\u0638\u201e\u0637\u00a8\u0638\u064a\u0637\u00b9",
  "\u0638\u2020\u0638\u201a\u0638\u201e \u0637\u00a5\u0638\u201e\u0638\u2030 \u0637\u00a7\u0638\u201e\u0637\u00a3\u0638\u02c6\u0637\u00b1\u0637\u061b \u0637\u00ac\u0637\u00a7\u0638\u2021\u0637\u00b2"
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
const textFiles = files.filter((file) => [".md", ".json", ".html", ".txt", ".xml"].includes(path.extname(file).toLowerCase()) && !generatedStatusFiles.has(path.basename(file)));
const rawCombinedText = textFiles.map((file) => readFileSync(file, "utf8")).join("\n");
const combinedText = rawCombinedText.toLowerCase();

if (!combinedText.includes(requiredDate)) failures.push(`Required date missing: ${requiredDate}`);
if (!combinedText.includes(requiredPlaceholder.toLowerCase())) failures.push("Monitoring placeholder missing");
if (!combinedText.includes(plannedJobcenterLink)) failures.push("Planned Jobcenter link missing");
if (!combinedText.includes(monitorActivationText)) failures.push("Project monitor is not marked as activated only after upload approval");
if (!combinedText.includes(notLiveMarker)) failures.push("Planned monitor link is not marked as not live until upload/deploy approval");
for (const phrase of forbiddenPhrases) {
  if (combinedText.includes(phrase)) failures.push(`Forbidden wording found: ${phrase}`);
}
for (const phrase of transliterationFailures) {
  if (rawCombinedText.includes(phrase)) failures.push(`German umlaut quality failure: ${phrase}`);
}
for (const marker of mojibakeMarkers) {
  if (rawCombinedText.includes(marker)) failures.push(`Mojibake marker found: ${JSON.stringify(marker)}`);
}

const status = {
  schema: "uaos-jobcenter-pack-qa-status-v1",
  status: failures.length ? "FAIL" : "PASS",
  pdfs: pdfs.map(rel),
  pptx: pptx.map(rel),
  requiredDate,
  monitoringPlaceholderPresent: combinedText.includes(requiredPlaceholder.toLowerCase()),
  plannedJobcenterLinkPresent: combinedText.includes(plannedJobcenterLink),
  monitorMarkedActivationAfterUploadApproval: combinedText.includes(monitorActivationText),
  linkMarkedNotLiveUntilUploadDeployApproval: combinedText.includes(notLiveMarker),
  germanUmlautQualityPass: !transliterationFailures.some((phrase) => rawCombinedText.includes(phrase)),
  mojibakeMarkerPass: !mojibakeMarkers.some((marker) => rawCombinedText.includes(marker)),
  failures,
  safety: {
    localOnly: true,
    keyboardOutputCreated: false,
    keyboardTransferAllowed: false,
    pushDeployVercelPayment: false
  }
};

writeFileSync(path.join(root, "uaos-ai-factory/jobcenter-send-ready/JOBCENTER_PACK_QA_STATUS.json"), `${JSON.stringify(status, null, 2)}\n`, "utf8");
writeFileSync(path.join(root, "uaos-ai-factory/jobcenter-send-ready/JOBCENTER_PACK_QA_STATUS.md"), `# Jobcenter Pack QA Status

Status: ${status.status}

PDF files:
${status.pdfs.map((file) => `- ${file}`).join("\n") || "- None"}

PPTX files:
${status.pptx.map((file) => `- ${file}`).join("\n") || "- None"}

Monitoring placeholder present: ${status.monitoringPlaceholderPresent ? "YES" : "NO"}

German umlaut quality pass: ${status.germanUmlautQualityPass ? "YES" : "NO"}

Mojibake marker pass: ${status.mojibakeMarkerPass ? "YES" : "NO"}

Failures:
${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}
`, "utf8");

console.log("UAOS Jobcenter Pack QA Check");
console.log(`Status: ${status.status}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("UAOS Jobcenter Pack QA Check: PASS");
