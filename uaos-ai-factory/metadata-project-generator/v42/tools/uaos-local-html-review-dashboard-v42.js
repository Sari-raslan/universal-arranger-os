import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

const paths = {
  project: path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
  suggestions: path.join(base, "v40", "generated", "UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.json"),
  reviewPack: path.join(base, "v41", "generated", "UAOS_V41_SUGGESTION_REVIEW_PACK.json"),
  simulationPlan: path.join(generatedDir, "UAOS_V42_METADATA_APPLY_SIMULATION_PLAN.json"),
  preview: path.join(generatedDir, "UAOS_V42_METADATA_APPLY_SIMULATION_PREVIEW.json")
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
}

function safetyBlock() {
  return {
    metadataOnly: true,
    dryRunOnly: true,
    sourceProjectModified: false,
    autoApplyEnabled: false,
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

const project = readJson(paths.project);
const suggestions = readJson(paths.suggestions);
const reviewPack = readJson(paths.reviewPack);
const simulationPlan = readJson(paths.simulationPlan);
const preview = readJson(paths.preview);
const generatedAt = new Date().toISOString();

const blockedActions = [
  "Real apply",
  "Source project mutation",
  "Auto-apply suggestions",
  "KORG output",
  "SET modification",
  "STY/PRF/PRS/KST generation",
  "USB approval",
  "Keyboard load approval",
  "Deploy output",
  "App.jsx changes"
];
const nextSafeActions = [
  "Collect owner decisions in V43 metadata-only form.",
  "Create local dashboard index for V37-V42.",
  "Keep all export and keyboard load gates closed."
];
const data = {
  schemaVersion: "uaos.v42.local.review.dashboard.data.v1",
  generatedAt,
  metadataOnly: true,
  dryRunOnly: true,
  sourceProjectModified: false,
  autoApplyEnabled: false,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  projectSummary: {
    projectId: project.projectId,
    projectName: project.projectName,
    trackCount: project.tracks.length,
    sourceMode: project.sourceMode
  },
  suggestionsSummary: {
    totalSuggestions: suggestions.suggestions.length,
    highPriority: suggestions.suggestions.filter((item) => item.priority === "high").length
  },
  reviewPackSummary: {
    reviewItems: reviewPack.reviewItems.length,
    pendingItems: reviewPack.reviewItems.filter((item) => item.ownerDecision === "pending").length
  },
  simulationPreview: {
    simulationId: simulationPlan.simulationId,
    pendingChangeCount: preview.changedFieldsPreview.length,
    acceptedChangeCount: 0
  },
  pendingOwnerDecisions: preview.pendingOwnerDecisions,
  blockedActions,
  nextSafeActions,
  safety: safetyBlock()
};

const pendingRows = preview.changedFieldsPreview.map((item) => `<tr><td>${esc(item.sourceSuggestionId)}</td><td>${esc(item.field)}</td><td>${esc(item.previewChange)}</td><td>${esc(item.status)}</td></tr>`).join("");
const blockedList = blockedActions.map((item) => `<li>${esc(item)}</li>`).join("");
const nextList = nextSafeActions.map((item) => `<li>${esc(item)}</li>`).join("");
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>UAOS V42 Local Review Dashboard</title>
  <style>
    :root{--bg:#030712;--panel:#111827;--line:#2b3649;--text:#f8fafc;--muted:#9ca3af;--cyan:#22d3ee;--green:#22c55e;--amber:#f59e0b}
    *{box-sizing:border-box}body{margin:0;background:#030712;color:var(--text);font-family:Arial,Tahoma,sans-serif;line-height:1.5}
    header{padding:22px;background:#050914;border-bottom:1px solid var(--line)}h1{margin:4px 0 0}header p{margin:0;color:var(--cyan);font-weight:800}
    main{padding:16px;display:grid;gap:14px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
    section,.card{background:linear-gradient(180deg,rgba(17,24,39,.98),rgba(8,13,24,.98));border:1px solid var(--line);border-radius:8px;padding:14px}
    .badge{display:inline-block;border:1px solid rgba(34,211,238,.45);border-radius:999px;padding:6px 9px;margin:3px;color:var(--cyan);font-weight:800}
    table{width:100%;border-collapse:collapse}td,th{border-top:1px solid var(--line);padding:8px;text-align:left}td:last-child{color:var(--amber)}
    .ok{color:var(--green);font-weight:800}.blocked{color:var(--amber);font-weight:800}
  </style>
</head>
<body>
  <header>
    <p>UAOS Metadata Project Generator</p>
    <h1>V42 Local Review Dashboard</h1>
    <span class="badge">LOCAL DASHBOARD ONLY</span>
    <span class="badge">DRY-RUN ONLY</span>
    <span class="badge">METADATA ONLY</span>
    <span class="badge">SOURCE PROJECT NOT MODIFIED</span>
    <span class="badge">NOT DEPLOYED</span>
    <span class="badge">NOT KORG OUTPUT</span>
    <span class="badge">NOT PA3X READY</span>
    <span class="badge">NO USB APPROVAL</span>
    <span class="badge">NO KEYBOARD LOAD APPROVAL</span>
  </header>
  <main>
    <section>
      <h2>Safety Status</h2>
      <p class="ok">Dry-run only. Metadata only. Source project not modified. No approval for export, USB, or keyboard load.</p>
    </section>
    <section>
      <h2>V37 Project Summary</h2>
      <div class="grid">
        <div class="card">Project<br><strong>${esc(project.projectName)}</strong></div>
        <div class="card">Project id<br><strong>${esc(project.projectId)}</strong></div>
        <div class="card">Tracks<br><strong>${esc(project.tracks.length)}</strong></div>
        <div class="card">Source mode<br><strong>${esc(project.sourceMode)}</strong></div>
      </div>
    </section>
    <section>
      <h2>V40 Suggestions Summary</h2>
      <p>Total suggestions: ${suggestions.suggestions.length}. High priority: ${data.suggestionsSummary.highPriority}.</p>
    </section>
    <section>
      <h2>V41 Review Pack Summary</h2>
      <p>Review items: ${reviewPack.reviewItems.length}. Pending items: ${data.reviewPackSummary.pendingItems}.</p>
    </section>
    <section>
      <h2>V42 Simulation Preview</h2>
      <p>Simulation id: ${esc(simulationPlan.simulationId)}</p>
      <table><thead><tr><th>Suggestion</th><th>Field</th><th>Preview change</th><th>Status</th></tr></thead><tbody>${pendingRows}</tbody></table>
    </section>
    <section>
      <h2>Pending Owner Decisions</h2>
      <p>${preview.pendingOwnerDecisions.map(esc).join(", ")}</p>
    </section>
    <section>
      <h2>Blocked Actions List</h2>
      <ul class="blocked">${blockedList}</ul>
    </section>
    <section>
      <h2>Next Safe Actions</h2>
      <ul>${nextList}</ul>
    </section>
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(generatedDir, "UAOS_V42_LOCAL_REVIEW_DASHBOARD_DATA.json"), JSON.stringify(data, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V42_LOCAL_REVIEW_DASHBOARD.html"), html, "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V42_LOCAL_HTML_DASHBOARD_REPORT.md"), [
  "# UAOS V42 Local HTML Dashboard Report",
  "",
  "Status: GENERATED",
  "",
  "Dashboard: generated/UAOS_V42_LOCAL_REVIEW_DASHBOARD.html",
  "Dashboard data: generated/UAOS_V42_LOCAL_REVIEW_DASHBOARD_DATA.json",
  "",
  "Safety: local dashboard only, dry-run only, metadata-only, not deployed."
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", dashboard: "generated/UAOS_V42_LOCAL_REVIEW_DASHBOARD.html", pendingOwnerDecisions: preview.pendingOwnerDecisions.length }, null, 2));
