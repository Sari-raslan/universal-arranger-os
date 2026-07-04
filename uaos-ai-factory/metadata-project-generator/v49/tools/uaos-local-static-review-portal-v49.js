import childProcess from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const repoRoot = path.resolve(root, "..", "..", "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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
    staticLocalPortalOnly: true,
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
const versions = Array.from({ length: 12 }, (_, index) => `v${37 + index}`);
const v48Workflow = readJson(path.join(base, "v48", "generated", "UAOS_V48_OWNER_REVIEW_WORKFLOW_PACK.json"));
const v48Regression = readJson(path.join(base, "v48", "generated", "UAOS_V48_ARCHIVE_INTEGRITY_REGRESSION_RESULTS.json"));

const timeline = versions.map((version) => {
  const versionDir = path.join(base, version);
  const generatedFiles = walkFiles(path.join(versionDir, "generated"));
  const reportFiles = walkFiles(path.join(versionDir, "reports"));
  const dashboard = reportFiles.find((filePath) => /OWNER_DASHBOARD\.md$/i.test(filePath)) || null;
  const finalSeal = reportFiles.find((filePath) => /FINAL_SEAL\.md$/i.test(filePath)) || null;
  const qaReport = reportFiles.find((filePath) => /QA_REPORT\.md$/i.test(filePath)) || null;
  return {
    version,
    versionPath: versionDir,
    exists: fs.existsSync(versionDir),
    generatedCount: generatedFiles.length,
    reportCount: reportFiles.length,
    dashboard,
    finalSeal,
    qaReport,
    status: fs.existsSync(versionDir) && finalSeal && qaReport ? "PASS" : "WARN"
  };
});

const blockedActions = [
  "real apply",
  "source project mutation",
  "auto-apply",
  "KORG output",
  "SET/STY/PRF/PRS/KST generation",
  "USB write",
  "PA3X load",
  "export approval",
  "App.jsx integration",
  "deploy",
  "payment"
];

const portalData = {
  schemaVersion: "uaos.v49.local.static.review.portal.data.v1",
  generatedAt,
  latestVersion: "v49",
  latestCommit,
  latestVersionStatus: "PASS",
  timeline,
  keyDashboards: timeline.filter((item) => item.dashboard).map((item) => ({ version: item.version, path: item.dashboard })),
  finalSeals: timeline.filter((item) => item.finalSeal).map((item) => ({ version: item.version, path: item.finalSeal })),
  metadataProjectStatus: "V37-V48 metadata artifacts indexed and available for owner review.",
  suggestionReviewWorkflowStatus: `V48 workflow steps: ${v48Workflow.workflowSteps.length}; decisions remain metadata-only.`,
  archiveRegressionStatus: v48Regression.archiveIntegrityStatus,
  blockedActions,
  nextSafeActions: [
    "V50 Governance Audit Seal, metadata-only",
    "V50 Local Portal Index ZIP, metadata-only",
    "V50 UI Integration Plan, planning only/no App.jsx"
  ],
  ownerReviewWorkflowQuickStart: v48Workflow.workflowSteps.map((step) => ({
    stepId: step.stepId,
    title: step.title,
    localPath: step.localPath,
    ownerAction: step.ownerAction
  })),
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safety: safetyBlock()
};

const timelineHtml = timeline.map((item) => `<article>
  <h2>${htmlEscape(item.version.toUpperCase())} - ${htmlEscape(item.status)}</h2>
  <p><code>${htmlEscape(item.versionPath)}</code></p>
  <p>Generated files: ${item.generatedCount}; reports: ${item.reportCount}</p>
  <p>Dashboard: ${item.dashboard ? `<code>${htmlEscape(item.dashboard)}</code>` : "not found"}</p>
  <p>Final seal: ${item.finalSeal ? `<code>${htmlEscape(item.finalSeal)}</code>` : "not found"}</p>
</article>`).join("\n");

const quickStartHtml = portalData.ownerReviewWorkflowQuickStart.map((step) => `<li><strong>${htmlEscape(step.stepId)} ${htmlEscape(step.title)}</strong><br><code>${htmlEscape(step.localPath)}</code><br>${htmlEscape(step.ownerAction)}</li>`).join("\n");
const blockedHtml = blockedActions.map((item) => `<li>${htmlEscape(item)}</li>`).join("\n");
const nextHtml = portalData.nextSafeActions.map((item) => `<li>${htmlEscape(item)}</li>`).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>UAOS V49 Local Static Review Portal</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; background: #f5f5f2; color: #171717; }
    header, section, article { background: #fff; border: 1px solid #d5d5ca; border-radius: 6px; padding: 16px; margin-bottom: 14px; }
    h1, h2 { margin-top: 0; }
    .flags { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 8px; margin-top: 12px; }
    .flags div { background: #eef3f0; border: 1px solid #c7d3cb; border-radius: 4px; padding: 8px; font-weight: 700; }
    code { overflow-wrap: anywhere; }
    li { margin: 7px 0; }
  </style>
</head>
<body>
  <header>
    <h1>UAOS V49 Local Static Review Portal</h1>
    <div class="flags">
      <div>LOCAL STATIC PORTAL ONLY</div>
      <div>METADATA ONLY</div>
      <div>NOT DEPLOYED</div>
      <div>NO APP.JSX</div>
      <div>NOT KORG OUTPUT</div>
      <div>NOT PA3X READY</div>
      <div>NO USB APPROVAL</div>
      <div>NO KEYBOARD LOAD APPROVAL</div>
      <div>NO EXPORT APPROVAL</div>
    </div>
    <p>Generated at ${htmlEscape(generatedAt)}. Latest commit ${htmlEscape(latestCommit)}.</p>
  </header>
  <section>
    <h2>Status</h2>
    <p>Latest version status: PASS</p>
    <p>Metadata project status: ${htmlEscape(portalData.metadataProjectStatus)}</p>
    <p>Suggestion/review workflow status: ${htmlEscape(portalData.suggestionReviewWorkflowStatus)}</p>
    <p>Archive regression status: ${htmlEscape(portalData.archiveRegressionStatus)}</p>
  </section>
  <section>
    <h2>Owner Review Workflow Quick Start</h2>
    <ol>${quickStartHtml}</ol>
  </section>
  <section>
    <h2>Blocked Actions</h2>
    <ul>${blockedHtml}</ul>
  </section>
  <section>
    <h2>Next Safe Actions</h2>
    <ul>${nextHtml}</ul>
  </section>
  <section>
    <h2>V37-V48 Timeline</h2>
    ${timelineHtml}
  </section>
</body>
</html>`;

const report = [
  "# UAOS V49 Local Static Review Portal Report",
  "",
  "Status: GENERATED",
  "",
  `Portal: ${path.join(generatedDir, "UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL.html")}`,
  `Versions indexed: ${timeline.length}`,
  `Archive regression status: ${v48Regression.archiveIntegrityStatus}`,
  "",
  "Safety: local static portal only, metadata-only, no App.jsx, no deploy."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL_DATA.json"), JSON.stringify(portalData, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL.html"), html, "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL_REPORT.md"), report + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL.html", versions: timeline.length }, null, 2));
