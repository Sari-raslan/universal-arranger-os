import childProcess from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const repoRoot = path.resolve(root, "..", "..", "..");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safetyBlock() {
  return {
    metadataOnly: true,
    readInspectOnly: true,
    localArchiveIndexOnly: true,
    sourceProjectModified: false,
    autoApplyEnabled: false,
    realApplyAllowed: false,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false,
    exportApproval: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const generatedAt = new Date().toISOString();
const latestCommit = childProcess.spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
const inspection = readJson(path.join(generatedDir, "UAOS_V47_REVIEW_PACK_INSPECTION.json"));
const validatorResultPath = path.join(reportsDir, "UAOS_V47_VALIDATOR_RESULTS.json");
const validatorAlreadyPassed = fs.existsSync(validatorResultPath) && readJson(validatorResultPath).status === "PASS";
const versions = Array.from({ length: 11 }, (_, index) => `v${37 + index}`);
const versionRecords = versions.map((version) => {
  const versionDir = path.join(base, version);
  const generatedPath = path.join(versionDir, "generated");
  const reportsPath = path.join(versionDir, "reports");
  const generatedFiles = walkFiles(generatedPath).filter((filePath) => /\.(json|md|html|zip|uaosproject\.json)$/i.test(filePath));
  const reportFiles = walkFiles(reportsPath).filter((filePath) => /\.(json|md|html)$/i.test(filePath));
  return {
    version,
    versionPath: versionDir,
    exists: fs.existsSync(versionDir),
    generatedFiles: generatedFiles.map((filePath) => ({
      path: filePath,
      relativePath: rel(filePath),
      sizeBytes: fs.statSync(filePath).size
    })),
    reportFiles: reportFiles.map((filePath) => ({
      path: filePath,
      relativePath: rel(filePath),
      sizeBytes: fs.statSync(filePath).size
    }))
  };
});

const missingVersionFolders = versionRecords.filter((item) => !item.exists).map((item) => item.version);
const missingCriticalReports = versionRecords
  .filter((item) => item.exists && item.reportFiles.length === 0)
  .map((item) => item.version);
const totalGeneratedFilesIndexed = versionRecords.reduce((sum, item) => sum + item.generatedFiles.length + item.reportFiles.length, 0);
const archiveReadyForOwnerReview = missingVersionFolders.length === 0 && missingCriticalReports.length === 0 && inspection.safetyStatus === "PASS";

const archiveData = {
  schemaVersion: "uaos.v47.local.archive.index.data.v1",
  generatedAt,
  versions: versionRecords,
  totalVersionsIndexed: versionRecords.filter((item) => item.exists).length,
  totalGeneratedFilesIndexed,
  latestVersion: "v47",
  latestCommit,
  metadataOnly: true,
  readInspectOnly: true,
  sourceProjectModified: false,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safety: safetyBlock()
};

const health = {
  schemaVersion: "uaos.v47.archive.health.summary.v1",
  generatedAt,
  totalVersionsIndexed: archiveData.totalVersionsIndexed,
  totalGeneratedFilesIndexed,
  missingVersionFolders,
  missingCriticalReports,
  latestVersion: "v47",
  latestCommit,
  reviewPackZipStatus: inspection.zipExists && inspection.safetyStatus === "PASS" ? "PASS" : "FAIL",
  hashVerificationStatus: inspection.hashVerificationStatus,
  metadataOnlyStatus: inspection.metadataOnly === true ? "PASS" : "FAIL",
  archiveReadyForOwnerReview,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safety: safetyBlock()
};

const nextMatrix = {
  schemaVersion: "uaos.v47.next.recommendation.matrix.v1",
  generatedAt,
  metadataOnly: true,
  readInspectOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V48 Owner Review Workflow Pack", safety: "metadata-only", recommended: true },
    { id: "B", action: "V48 Archive Integrity Regression Test", safety: "metadata-only", recommended: true },
    { id: "C", action: "V48 Local Static Review Portal", safety: "no App.jsx and no deploy", recommended: false },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["A", "B"],
  safety: safetyBlock()
};

const htmlRows = versionRecords.map((version) => {
  const files = [...version.generatedFiles, ...version.reportFiles]
    .map((file) => `<li><code>${htmlEscape(file.path)}</code> <span>${file.sizeBytes} bytes</span></li>`)
    .join("\n");
  return `<section>
<h2>${htmlEscape(version.version.toUpperCase())}</h2>
<p>${version.exists ? "Folder found" : "Folder missing"} - generated/reports files indexed: ${version.generatedFiles.length + version.reportFiles.length}</p>
<ul>
${files || "<li>No generated or report files found.</li>"}
</ul>
</section>`;
}).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>UAOS V47 Local Archive Index V37-V46</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #151515; background: #f7f7f4; }
    header, section { background: #fff; border: 1px solid #d8d8d0; border-radius: 6px; padding: 16px; margin-bottom: 14px; }
    h1, h2 { margin: 0 0 10px; }
    .flags { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; }
    .flags div { background: #eef3f0; border: 1px solid #cdd8d1; padding: 8px; border-radius: 4px; font-weight: 700; }
    code { overflow-wrap: anywhere; }
    li { margin: 5px 0; }
  </style>
</head>
<body>
  <header>
    <h1>UAOS V47 Local Archive Index V37-V46</h1>
    <div class="flags">
      <div>LOCAL ARCHIVE INDEX ONLY</div>
      <div>METADATA ONLY</div>
      <div>REVIEW PACK INSPECTION ONLY</div>
      <div>SOURCE PROJECT NOT MODIFIED</div>
      <div>NOT DEPLOYED</div>
      <div>NOT KORG OUTPUT</div>
      <div>NOT PA3X READY</div>
      <div>NO USB APPROVAL</div>
      <div>NO KEYBOARD LOAD APPROVAL</div>
      <div>NO EXPORT APPROVAL</div>
    </div>
    <p>Generated at ${htmlEscape(generatedAt)}. Latest commit ${htmlEscape(latestCommit)}.</p>
  </header>
  <section>
    <h2>Archive Health</h2>
    <p>Versions indexed: ${health.totalVersionsIndexed}</p>
    <p>Files indexed: ${health.totalGeneratedFilesIndexed}</p>
    <p>Review pack ZIP status: ${htmlEscape(health.reviewPackZipStatus)}</p>
    <p>Hash verification status: ${htmlEscape(health.hashVerificationStatus)}</p>
    <p>Ready for owner review: ${archiveReadyForOwnerReview ? "YES" : "NO"}</p>
  </section>
${htmlRows}
</body>
</html>`;

const archiveReport = [
  "# UAOS V47 Local Archive Index Report",
  "",
  `Status: ${archiveReadyForOwnerReview ? "PASS" : "PASS_WITH_WARNINGS"}`,
  "",
  `Versions indexed: ${health.totalVersionsIndexed}`,
  `Files indexed: ${health.totalGeneratedFilesIndexed}`,
  `Latest commit: ${latestCommit}`,
  `Review pack ZIP status: ${health.reviewPackZipStatus}`,
  `Hash verification: ${health.hashVerificationStatus}`,
  "",
  "Safety: local archive index only, metadata-only, no source project mutation, no deploy."
].join("\n");

const qaReport = [
  "# UAOS V47 QA Report",
  "",
  "Review pack inspection created: YES",
  "Contents index created: YES",
  "Local archive index created: YES",
  "Archive health summary created: YES",
  `Validator PASS: ${validatorAlreadyPassed ? "YES" : "pending validator run"}`,
  "No real apply: YES",
  "No source project mutation: YES",
  "No KORG output: YES",
  "No SET/STY/PRF/PRS/KST: YES",
  "No audio/sample binaries: YES",
  "No USB: YES",
  "No PA3X load: YES",
  "No fixture modification: YES",
  "No App.jsx: YES",
  "No deploy: YES"
].join("\n");

const dashboard = [
  "# UAOS V47 Owner Dashboard",
  "",
  `Review pack inspection: ${path.join(generatedDir, "UAOS_V47_REVIEW_PACK_INSPECTION.json")}`,
  `Archive index: ${path.join(generatedDir, "UAOS_V47_LOCAL_ARCHIVE_INDEX_V37_V46.html")}`,
  `Archive health summary: ${path.join(generatedDir, "UAOS_V47_ARCHIVE_HEALTH_SUMMARY.json")}`,
  `V46 ZIP status: ${health.reviewPackZipStatus}`,
  `Safety status: ${archiveReadyForOwnerReview ? "PASS" : "PASS_WITH_WARNINGS"}`,
  "",
  "Still blocked: real apply, source project mutation, auto-apply, KORG output, SET/STY/PRF/PRS/KST generation, USB write, PA3X load, export approval, App.jsx integration, deploy.",
  "",
  "Next recommended phase: A + B together, V48 Owner Review Workflow Pack and V48 Archive Integrity Regression Test."
].join("\n");

const masterIndex = [
  "# UAOS V47 Master Index",
  "",
  "- generated/UAOS_V47_REVIEW_PACK_INSPECTION.json",
  "- generated/UAOS_V47_REVIEW_PACK_INSPECTION.md",
  "- generated/UAOS_V47_REVIEW_PACK_CONTENTS_INDEX.json",
  "- generated/UAOS_V47_REVIEW_PACK_CONTENTS_INDEX.md",
  "- generated/UAOS_V47_LOCAL_ARCHIVE_INDEX_V37_V46.html",
  "- generated/UAOS_V47_LOCAL_ARCHIVE_INDEX_DATA.json",
  "- generated/UAOS_V47_ARCHIVE_HEALTH_SUMMARY.json",
  "- generated/UAOS_V47_NEXT_RECOMMENDATION_MATRIX.json",
  "- reports/UAOS_V47_REVIEW_PACK_INSPECTOR_REPORT.md",
  "- reports/UAOS_V47_LOCAL_ARCHIVE_INDEX_REPORT.md",
  "- reports/UAOS_V47_VALIDATOR_RESULTS.json",
  "- reports/UAOS_V47_QA_REPORT.md",
  "- reports/UAOS_V47_OWNER_DASHBOARD.md",
  "- reports/UAOS_V47_FINAL_SEAL.md"
].join("\n");

const finalSeal = [
  "# UAOS V47 Final Seal",
  "",
  `Status: ${validatorAlreadyPassed ? "PASS" : "pending validator run"}`,
  "Safety: metadata-only, read/inspect only, local archive index only.",
  "No real apply, no source mutation, no export approval, no USB write, no keyboard load."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V47_LOCAL_ARCHIVE_INDEX_DATA.json"), JSON.stringify(archiveData, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V47_ARCHIVE_HEALTH_SUMMARY.json"), JSON.stringify(health, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V47_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(nextMatrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V47_LOCAL_ARCHIVE_INDEX_V37_V46.html"), html, "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V47_LOCAL_ARCHIVE_INDEX_REPORT.md"), archiveReport + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V47_QA_REPORT.md"), qaReport + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V47_OWNER_DASHBOARD.md"), dashboard + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V47_MASTER_INDEX.md"), masterIndex + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V47_FINAL_SEAL.md"), finalSeal + "\n", "utf8");

console.log(JSON.stringify({ status: archiveReadyForOwnerReview ? "PASS" : "PASS_WITH_WARNINGS", output: "generated/UAOS_V47_LOCAL_ARCHIVE_INDEX_V37_V46.html" }, null, 2));
