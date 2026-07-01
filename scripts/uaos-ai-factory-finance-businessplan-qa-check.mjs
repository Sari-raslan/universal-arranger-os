import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packDir = path.join(root, "uaos-ai-factory/jobcenter-finance-businessplan");
const statusMd = path.join(packDir, "FINANCE_BUSINESSPLAN_QA_STATUS.md");
const statusJson = path.join(packDir, "FINANCE_BUSINESSPLAN_QA_STATUS.json");
const liveMonitorUrl = "https://sari-raslan.github.io/universal-arranger-os/monitor/";
const pdfName = "UAOS_FINANZ_BUSINESSPLAN_2026-07-01_DE.pdf";
const pptxName = "UAOS_FINANZ_BUSINESSPLAN_2026-07-01_DE.pptx";
const fallbackPdfName = "UAOS_FINANZ_BUSINESSPLAN_2026-07-01_DE_PRESENTATION_FALLBACK.pdf";
const zipName = "UAOS_JOBCENTER_FINANCE_BUSINESSPLAN_SEND_READY_2026-07-01.zip";
const keyboardExtensions = [".STY", ".SET", ".PRS"];
const requiredTerms = [
  "2026-07-01",
  "01.07.2026",
  liveMonitorUrl,
  "2.200",
  "3.950",
  "1.500",
  "2.500",
  "75",
  "210",
  "12-Monats-Roadmap",
  "Eigenleistung",
  "450",
  "750",
  "11.250",
  "33.750",
  "Anfangsumsatz: 0"
];
const forbiddenPhrases = [
  "private supporter",
  "private friend",
  "supporter pack",
  "friend support",
  "private unterstützung",
  "private unterstuetzung",
  "production ready",
  "production-ready",
  "payment enabled",
  "keyboard ready",
  "ready for keyboard",
  "keyboard transfer ready",
  "real writer ready",
  "einkommen ist garantiert",
  "garantierte einnahmen",
  "garantierter umsatz"
];
const mojibakeMarkers = ["Ã", "Â", "ï¿½", "�", "â‚¬", "â€“", "â€”"];
const requiredUmlauts = ["ä", "ö", "ü", "Ä", "Ö", "Ü", "ß"];

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

function readPptxText(file) {
  if (!existsSync(file)) return "";
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "uaos-finance-pptx-"));
  try {
    const archiveCopy = path.join(tempDir, "presentation.zip");
    writeFileSync(archiveCopy, readFileSync(file));
    const result = spawnSync("powershell", [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${archiveCopy.replaceAll("'", "''")}' -DestinationPath '${tempDir.replaceAll("'", "''")}' -Force`
    ], { encoding: "utf8" });
    if (result.status !== 0) {
      failures.push(`Could not inspect PPTX internals: ${rel(file)}`);
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

function zipEntries(file) {
  if (!existsSync(file)) return [];
  const command = `$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('${file.replaceAll("'", "''")}').Entries | ForEach-Object { $_.FullName }`;
  const result = spawnSync("powershell", ["-NoProfile", "-Command", command], { encoding: "utf8" });
  if (result.status !== 0) {
    failures.push(`Could not inspect ZIP entries: ${rel(file)}`);
    return [];
  }
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

if (!existsSync(packDir)) failures.push(`Missing finance pack folder: ${rel(packDir)}`);

const files = walk(packDir);
const pdfPath = path.join(packDir, pdfName);
const pptxPath = path.join(packDir, pptxName);
const fallbackPdfPath = path.join(packDir, fallbackPdfName);
const zipPath = path.join(packDir, zipName);

for (const file of [pdfPath, pptxPath, fallbackPdfPath, zipPath]) {
  if (!existsSync(file)) failures.push(`Missing required file: ${rel(file)}`);
  else if (statSync(file).size <= 0) failures.push(`File is empty: ${rel(file)}`);
}

for (const file of files) {
  if (keyboardExtensions.includes(path.extname(file).toUpperCase())) failures.push(`Keyboard-native output file found: ${rel(file)}`);
}

const textFiles = files.filter((file) => [".md", ".json", ".txt"].includes(path.extname(file).toLowerCase()));
const rawText = textFiles.map((file) => readFileSync(file, "utf8")).join("\n");
const pptxText = readPptxText(pptxPath);
const searchableText = `${rawText}\n${pptxText}`;
const searchableLower = searchableText.toLowerCase();

for (const term of requiredTerms) {
  if (!searchableText.includes(term)) failures.push(`Required content missing: ${term}`);
}
for (const phrase of forbiddenPhrases) {
  if (searchableLower.includes(phrase)) failures.push(`Forbidden wording found: ${phrase}`);
}
for (const marker of mojibakeMarkers) {
  if (searchableText.includes(marker)) failures.push(`Mojibake marker found: ${marker}`);
}
for (const umlaut of requiredUmlauts) {
  if (!searchableText.includes(umlaut)) failures.push(`German umlaut missing: ${umlaut}`);
}

const entries = zipEntries(zipPath).map((entry) => path.basename(entry));
const expectedEntries = [pdfName, pptxName, fallbackPdfName].sort();
if (entries.length !== 3 || entries.slice().sort().join("|") !== expectedEntries.join("|")) {
  failures.push(`ZIP must contain only PDF, PPTX and fallback PDF. Found: ${entries.join(", ") || "none"}`);
}

const status = {
  schema: "uaos-finance-businessplan-qa-status-v1",
  status: failures.length ? "FAIL" : "PASS",
  pdfExists: existsSync(pdfPath),
  pptxExists: existsSync(pptxPath),
  fallbackPdfExists: existsSync(fallbackPdfPath),
  zipExists: existsSync(zipPath),
  liveMonitorLinkPresent: searchableText.includes(liveMonitorUrl),
  datePresent: searchableText.includes("2026-07-01") && searchableText.includes("01.07.2026"),
  budgetNumbersPresent: ["2.200", "3.950", "1.500", "2.500"].every((term) => searchableText.includes(term)),
  monthlyCostsPresent: ["75", "210", "30", "80"].every((term) => searchableText.includes(term)),
  roadmapPresent: searchableText.includes("12-Monats-Roadmap") && searchableText.includes("Q1") && searchableText.includes("Q4"),
  eigenleistungPresent: searchableText.includes("Eigenleistung") && searchableText.includes("450") && searchableText.includes("750"),
  noPrivateSupporterFriendWording: !forbiddenPhrases.slice(0, 6).some((phrase) => searchableLower.includes(phrase)),
  noFalseClaims: !forbiddenPhrases.slice(6).some((phrase) => searchableLower.includes(phrase)),
  noMojibake: !mojibakeMarkers.some((marker) => searchableText.includes(marker)),
  noKeyboardNativeFiles: !files.some((file) => keyboardExtensions.includes(path.extname(file).toUpperCase())),
  zipEntries: entries,
  failures
};

writeFileSync(statusJson, `${JSON.stringify(status, null, 2)}\n`, "utf8");
writeFileSync(statusMd, `# Finance Businessplan QA Status

Status: ${status.status}

PDF exists: ${status.pdfExists ? "YES" : "NO"}

PPTX exists: ${status.pptxExists ? "YES" : "NO"}

Fallback PDF exists: ${status.fallbackPdfExists ? "YES" : "NO"}

Live monitor link present: ${status.liveMonitorLinkPresent ? "YES" : "NO"}

Budget numbers present: ${status.budgetNumbersPresent ? "YES" : "NO"}

Monthly costs present: ${status.monthlyCostsPresent ? "YES" : "NO"}

12-month roadmap present: ${status.roadmapPresent ? "YES" : "NO"}

Eigenleistung present: ${status.eigenleistungPresent ? "YES" : "NO"}

ZIP entries:
${entries.map((entry) => `- ${entry}`).join("\n") || "- None"}

Failures:
${failures.length ? failures.map((failure) => `- ${failure}`).join("\n") : "- None"}
`, "utf8");

console.log("UAOS Finance Businessplan QA Check");
console.log(`Status: ${status.status}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("UAOS Finance Businessplan QA Check: PASS");
