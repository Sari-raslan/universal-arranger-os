import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packDir = path.join(root, "uaos-ai-factory/jobcenter-send-ready");
const requiredDate = "2026-07-01";
const businessplanPdfName = "UAOS_JOBCENTER_BUSINESSPLAN_2026-07-01_DE.pdf";
const finalPptxName = "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE.pptx";
const fallbackPdfName = "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE_PRESENTATION_FALLBACK.pdf";
const removedJobcenterLink = "https://sari-raslan.github.io/universal-arranger-os/jobcenter/";
const monitorLabel = "projekt-monitor:";
const monitorNachgereichtText = "der projekt-monitor ist vorgesehen und wird nach technischer freigabe separat nachgereicht.";
const noActivePublicLinkText = "derzeit wird kein öffentlicher projektlink als aktiver nachweis verwendet. es wurde kein push, kein upload und kein deploy freigegeben.";
const keyboardNativeExtensions = [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"];
const requiredUmlauts = ["ä", "ö", "ü", "Ä", "Ö", "Ü", "ß"];
const mojibakeMarkers = ["â”œ", "أ‚", "ï؟½", "ï¿½", "├", "Ã", "Â", "�"];
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
  "zahlung aktiviert",
  "deploy-fertig",
  "keyboard-transfer bereit"
];
const officeNamespaceHosts = [
  "schemas.openxmlformats.org",
  "purl.org",
  "schemas.microsoft.com",
  "www.w3.org"
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

function readExpandedPptxText(file) {
  if (!existsSync(file)) return "";
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "uaos-jobcenter-pptx-"));
  try {
    const archiveCopy = path.join(tempDir, "presentation.zip");
    writeFileSync(archiveCopy, readFileSync(file));
    const result = spawnSync("powershell", [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${archiveCopy.replaceAll("'", "''")}' -DestinationPath '${tempDir.replaceAll("'", "''")}' -Force`
    ], { encoding: "utf8" });
    if (result.status !== 0) {
      failures.push(`Could not inspect PPTX internals: ${result.stderr || result.stdout || rel(file)}`);
      return "";
    }
    return walk(tempDir)
      .filter((expandedFile) => [".xml", ".rels"].includes(path.extname(expandedFile).toLowerCase()))
      .map((expandedFile) => readFileSync(expandedFile, "utf8"))
      .join("\n");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function externalWebLinks(value) {
  return [...new Set(value.match(/https?:\/\/[^"' <>\r\n]+/gi) ?? [])]
    .filter((link) => {
      try {
        const url = new URL(link);
        return !officeNamespaceHosts.includes(url.hostname.toLowerCase());
      } catch {
        return true;
      }
    });
}

function normalizeLink(link) {
  return link.endsWith("/") ? link : `${link}/`;
}

if (!existsSync(packDir)) failures.push(`Missing pack folder: ${rel(packDir)}`);

const files = existsSync(packDir) ? walk(packDir) : [];
const pdfs = files.filter((file) => path.extname(file).toLowerCase() === ".pdf");
const businessplanPdfs = pdfs.filter((file) => path.basename(file) === businessplanPdfName);
const fallbackPdfs = pdfs.filter((file) => path.basename(file) === fallbackPdfName);
const unexpectedPdfs = pdfs.filter((file) => ![businessplanPdfName, fallbackPdfName].includes(path.basename(file)));
const pptxFiles = files.filter((file) => path.extname(file).toLowerCase() === ".pptx");
const finalPptxFiles = pptxFiles.filter((file) => path.basename(file) === finalPptxName);
const unexpectedPptx = pptxFiles.filter((file) => path.basename(file) !== finalPptxName);

if (businessplanPdfs.length !== 1) failures.push(`Expected exactly one Businessplan PDF, found ${businessplanPdfs.length}`);
if (finalPptxFiles.length !== 1) failures.push(`Expected exactly one final PPTX, found ${finalPptxFiles.length}`);
if (fallbackPdfs.length > 1) failures.push(`Expected at most one presentation fallback PDF, found ${fallbackPdfs.length}`);
for (const file of unexpectedPdfs) failures.push(`Unexpected PDF found: ${rel(file)}`);
for (const file of unexpectedPptx) failures.push(`Unexpected PPTX found: ${rel(file)}`);
for (const file of [...businessplanPdfs, ...finalPptxFiles, ...fallbackPdfs]) {
  if (existsSync(file) && statSync(file).size <= 0) failures.push(`Output is empty: ${rel(file)}`);
}

for (const file of files) {
  if (keyboardNativeExtensions.includes(path.extname(file).toUpperCase())) failures.push(`Keyboard-native file found: ${rel(file)}`);
}

const generatedStatusFiles = new Set([
  "JOBCENTER_PACK_QA_STATUS.json",
  "JOBCENTER_PACK_QA_STATUS.md"
]);
const textFiles = files.filter((file) => [".md", ".json", ".html", ".txt", ".xml"].includes(path.extname(file).toLowerCase()) && !generatedStatusFiles.has(path.basename(file)));
const rawCombinedText = textFiles.map((file) => readFileSync(file, "utf8")).join("\n");
const pptxInternalText = finalPptxFiles.map(readExpandedPptxText).join("\n");
const searchableText = `${rawCombinedText}\n${pptxInternalText}`;
const searchableLower = searchableText.toLowerCase();
const externalLinks = externalWebLinks(searchableText).map(normalizeLink);
const unexpectedLinks = externalLinks.filter((link) => link !== removedJobcenterLink);

if (!searchableLower.includes(requiredDate)) failures.push(`Required date missing: ${requiredDate}`);
if (searchableLower.includes(removedJobcenterLink)) failures.push("GitHub Pages Jobcenter URL still present");
if (!searchableLower.includes(monitorLabel)) failures.push("Project monitor label missing");
if (!searchableLower.includes(monitorNachgereichtText)) failures.push("Project monitor wording does not say it will be provided separately later");
if (!searchableLower.includes(noActivePublicLinkText)) failures.push("No-active-public-link status wording missing");
if (unexpectedLinks.length) failures.push(`Unexpected clickable web link remains in Jobcenter pack text/PPTX internals: ${[...new Set(unexpectedLinks)].join(", ")}`);
for (const phrase of forbiddenPhrases) {
  if (searchableLower.includes(phrase)) failures.push(`Forbidden wording found: ${phrase}`);
}
for (const umlaut of requiredUmlauts) {
  if (!searchableText.includes(umlaut)) failures.push(`German umlaut missing from pack text/PPTX internals: ${umlaut}`);
}
for (const marker of mojibakeMarkers) {
  if (searchableText.includes(marker)) failures.push(`Mojibake marker found: ${JSON.stringify(marker)}`);
}

const status = {
  schema: "uaos-jobcenter-pack-qa-status-v3",
  status: failures.length ? "FAIL" : "PASS",
  businessplanPdfs: businessplanPdfs.map(rel),
  finalPptx: finalPptxFiles.map(rel),
  presentationFallbackPdfs: fallbackPdfs.map(rel),
  requiredDate,
  removedJobcenterLinkPresent: searchableLower.includes(removedJobcenterLink),
  clickableMonitorUrlPresent: externalLinks.includes(removedJobcenterLink),
  monitorLabelPresent: searchableLower.includes(monitorLabel),
  monitorMarkedNachgereicht: searchableLower.includes(monitorNachgereichtText),
  noActivePublicProjectLink: searchableLower.includes(noActivePublicLinkText),
  unexpectedWebLinks: [...new Set(unexpectedLinks)],
  germanUmlautsPreserved: requiredUmlauts.every((umlaut) => searchableText.includes(umlaut)),
  mojibakeMarkerPass: !mojibakeMarkers.some((marker) => searchableText.includes(marker)),
  forbiddenWordingPass: !forbiddenPhrases.some((phrase) => searchableLower.includes(phrase)),
  failures,
  safety: {
    localOnly: true,
    keyboardOutputCreated: false,
    keyboardTransferAllowed: false,
    pushDeployVercelPayment: false
  }
};

writeFileSync(path.join(packDir, "JOBCENTER_PACK_QA_STATUS.json"), `${JSON.stringify(status, null, 2)}\n`, "utf8");
writeFileSync(path.join(packDir, "JOBCENTER_PACK_QA_STATUS.md"), `# Jobcenter Pack QA Status

Status: ${status.status}

Businessplan PDF:
${status.businessplanPdfs.map((file) => `- ${file}`).join("\n") || "- None"}

Final PPTX:
${status.finalPptx.map((file) => `- ${file}`).join("\n") || "- None"}

Presentation fallback PDF:
${status.presentationFallbackPdfs.map((file) => `- ${file}`).join("\n") || "- None"}

GitHub Pages URL removed: ${!status.removedJobcenterLinkPresent ? "YES" : "NO"}

Monitor marked nachgereicht: ${status.monitorMarkedNachgereicht ? "YES" : "NO"}

German umlauts preserved: ${status.germanUmlautsPreserved ? "YES" : "NO"}

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
