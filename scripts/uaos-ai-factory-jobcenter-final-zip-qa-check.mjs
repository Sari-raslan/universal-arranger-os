import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packDir = path.join(root, "uaos-ai-factory/jobcenter-send-ready");
const zipName = "UAOS_JOBCENTER_SEND_READY_2026-07-01_FINAL_OFFLINE.zip";
const zipPath = path.join(packDir, zipName);
const expectedFiles = [
  "UAOS_JOBCENTER_BUSINESSPLAN_2026-07-01_DE.pdf",
  "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE.pptx",
  "UAOS_JOBCENTER_PRESENTATION_2026-07-01_DE_PRESENTATION_FALLBACK.pdf"
];
const sourceFiles = [
  path.join(packDir, expectedFiles[0]),
  path.join(packDir, expectedFiles[1]),
  path.join(packDir, "ppt-visual-proof", expectedFiles[2])
];
const forbiddenExtensions = [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"];
const forbiddenPhrases = [
  "private friend",
  "private unterstützung",
  "private unterstuetzung",
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
const removedUrl = "https://sari-raslan.github.io/universal-arranger-os/jobcenter/";
const monitorNachgereicht = "nachgereicht";
const inspectFileNames = new Set([
  "JOBCENTER_FINAL_ZIP_MANIFEST.json",
  "JOBCENTER_FINAL_ZIP_MANIFEST.md",
  "JOBCENTER_FINAL_ZIP_READY_STATUS.json",
  "JOBCENTER_FINAL_ZIP_READY_STATUS.md",
  "JOBCENTER_PACK_QA_STATUS.json",
  "JOBCENTER_PACK_QA_STATUS.md"
]);

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

for (const file of sourceFiles) assertNonEmpty(file, "Send file");
assertNonEmpty(zipPath, "Final offline ZIP");

let entries = [];
if (existsSync(zipPath)) {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "uaos-jobcenter-final-zip-"));
  try {
    const result = spawnSync("powershell", [
      "-NoProfile",
      "-Command",
      `Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip=[System.IO.Compression.ZipFile]::OpenRead('${zipPath.replaceAll("'", "''")}'); try { $zip.Entries | ForEach-Object { $_.FullName } } finally { $zip.Dispose() }`
    ], { encoding: "utf8" });
    if (result.status !== 0) {
      failures.push(`Could not open ZIP: ${result.stderr || result.stdout}`);
    } else {
      entries = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

if (entries.length !== 3) failures.push(`Expected exactly 3 ZIP entries, found ${entries.length}`);
for (const expected of expectedFiles) {
  if (!entries.includes(expected)) failures.push(`ZIP missing expected file: ${expected}`);
}
for (const entry of entries) {
  if (!expectedFiles.includes(entry)) failures.push(`Unexpected ZIP entry: ${entry}`);
}

for (const file of walk(packDir)) {
  if (forbiddenExtensions.includes(path.extname(file).toUpperCase())) failures.push(`Keyboard output file found: ${rel(file)}`);
}

const inspectFiles = walk(packDir).filter((file) => inspectFileNames.has(path.basename(file)));
const combinedText = inspectFiles.map((file) => readFileSync(file, "utf8")).join("\n");
const combinedLower = combinedText.toLowerCase();

if (combinedLower.includes(removedUrl)) failures.push("GitHub Pages active URL remains in manifest/status");
if (!combinedLower.includes(monitorNachgereicht)) failures.push("Monitor is not marked as nachgereicht in manifest/status");
for (const phrase of forbiddenPhrases) {
  if (combinedLower.includes(phrase)) failures.push(`Forbidden wording found in manifest/status: ${phrase}`);
}

const status = {
  schema: "uaos-jobcenter-final-zip-qa-status-v1",
  status: failures.length ? "FAIL" : "PASS",
  zip: rel(zipPath),
  zipExists: existsSync(zipPath),
  zipSize: existsSync(zipPath) ? statSync(zipPath).size : 0,
  entries,
  expectedFiles,
  sourceFiles: sourceFiles.map(rel),
  monitorNachgereicht: combinedLower.includes(monitorNachgereicht),
  activeMonitorUrlPresent: combinedLower.includes(removedUrl),
  failures,
  safety: {
    localOnly: true,
    pushDeployVercel: false,
    payment: false,
    keyboardOutputTransfer: false
  }
};

writeFileSync(path.join(packDir, "JOBCENTER_FINAL_ZIP_QA_STATUS.json"), `${JSON.stringify(status, null, 2)}\n`, "utf8");

console.log("UAOS Jobcenter Final ZIP QA Check");
console.log(`Status: ${status.status}`);
if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("UAOS Jobcenter Final ZIP QA Check: PASS");
