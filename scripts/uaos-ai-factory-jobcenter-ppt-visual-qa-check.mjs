import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const packDir = path.join(root, "uaos-ai-factory/jobcenter-send-ready");
const proofDir = path.join(packDir, "ppt-visual-proof");
const pptxPath = path.join(packDir, "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE.pptx");
const fallbackPdfPath = path.join(proofDir, "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE_PRESENTATION_FALLBACK.pdf");
const statusJsonPath = path.join(packDir, "JOBCENTER_PPT_VISUAL_RECOVERY_STATUS.json");
const statusMdPath = path.join(packDir, "JOBCENTER_PPT_VISUAL_RECOVERY_STATUS.md");

const removedUrl = "https://sari-raslan.github.io/universal-arranger-os/jobcenter";
const forbiddenPhrases = [
  "supporter",
  "friend",
  "production ready",
  "production-ready",
  "payment enabled",
  "deploy ready",
  "public release ready",
  "ready for keyboard",
  "keyboard transfer ready",
  "real writer ready",
  "produktionsreif"
];
const mojibakeMarkers = ["â”œ", "أ‚", "ï؟½"];
const requiredUmlauts = ["für", "öffentlich", "Veröffentlichung", "Präsentation", "Unterstützung", "Arbeitsgerät", "zuverlässig", "nächste", "Prüfung", "benötigt", "eigenständig"];

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

function assertNonEmpty(file, label) {
  if (!existsSync(file)) {
    failures.push(`${label} missing: ${rel(file)}`);
    return;
  }
  if (statSync(file).size <= 0) failures.push(`${label} is empty: ${rel(file)}`);
}

assertNonEmpty(pptxPath, "PPTX");
assertNonEmpty(fallbackPdfPath, "Fallback PDF");

if (!existsSync(proofDir)) {
  failures.push(`Visual proof folder missing: ${rel(proofDir)}`);
}

const pngs = existsSync(proofDir)
  ? readdirSync(proofDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^slide-\d\d\.png$/i.test(entry.name))
    .map((entry) => path.join(proofDir, entry.name))
    .sort()
  : [];

if (pngs.length < 10) failures.push(`Expected at least 10 PNG slide exports, found ${pngs.length}`);
for (const png of pngs) assertNonEmpty(png, "PNG slide proof");

const inspectFiles = [
  ...walk(packDir).filter((file) => [".md", ".json", ".txt", ".xml"].includes(path.extname(file).toLowerCase())),
  path.join(root, "uaos-ai-factory/implementation/reports/JOBCENTER_PPT_VISUAL_RECOVERY_REPORT.md"),
  path.join(root, "uaos-ai-factory/implementation/JOBCENTER_PPT_VISUAL_RECOVERY_SUMMARY.json"),
  path.join(root, "scripts/uaos-ai-factory-jobcenter-powerpoint-com-builder.ps1")
].filter((file) => existsSync(file));

const combinedText = inspectFiles.map((file) => readFileSync(file, "utf8")).join("\n");
const combinedLower = combinedText.toLowerCase();

if (combinedLower.includes(removedUrl)) failures.push("GitHub Pages Jobcenter URL remains in source/status/manifest text");
for (const phrase of forbiddenPhrases) {
  if (combinedLower.includes(phrase)) failures.push(`Forbidden wording found: ${phrase}`);
}
for (const marker of mojibakeMarkers) {
  if (combinedText.includes(marker)) failures.push(`Mojibake marker found: ${JSON.stringify(marker)}`);
}
for (const term of requiredUmlauts) {
  if (!combinedText.includes(term)) failures.push(`Required German umlaut term missing: ${term}`);
}

const status = {
  schema: "uaos-jobcenter-ppt-visual-qa-status-v1",
  status: failures.length ? "FAIL" : "PASS",
  pptx: rel(pptxPath),
  fallbackPdf: rel(fallbackPdfPath),
  visualProofFolder: rel(proofDir),
  slidePngCount: pngs.length,
  allPngsNonEmpty: pngs.every((png) => existsSync(png) && statSync(png).size > 0),
  githubPagesUrlPresent: combinedLower.includes(removedUrl),
  germanUmlautsPreserved: requiredUmlauts.every((term) => combinedText.includes(term)),
  mojibakeMarkerPass: !mojibakeMarkers.some((marker) => combinedText.includes(marker)),
  forbiddenWordingPass: !forbiddenPhrases.some((phrase) => combinedLower.includes(phrase)),
  failures,
  safety: {
    localOnly: true,
    pushDeployVercelPayment: false,
    keyboardOutputTransfer: false,
    appJsxTouched: false
  }
};

writeFileSync(statusJsonPath, `${JSON.stringify(status, null, 2)}\n`, "utf8");
writeFileSync(statusMdPath, `# Jobcenter PPT Visual QA Status

Status: ${status.status}

PPTX: ${status.pptx}

Fallback PDF: ${status.fallbackPdf}

Visual proof folder: ${status.visualProofFolder}

Slide PNG count: ${status.slidePngCount}

Background visible proof exported: ${status.slidePngCount >= 10 && status.allPngsNonEmpty ? "YES" : "NO"}

German umlauts preserved: ${status.germanUmlautsPreserved ? "YES" : "NO"}

Non-working link removed: ${!status.githubPagesUrlPresent ? "YES" : "NO"}

Failures:
${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}
`, "utf8");

console.log("UAOS Jobcenter PPT Visual QA Check");
console.log(`Status: ${status.status}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("UAOS Jobcenter PPT Visual QA Check: PASS");
