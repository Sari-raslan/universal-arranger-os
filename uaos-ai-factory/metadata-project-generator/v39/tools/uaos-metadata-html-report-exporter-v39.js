import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const v37Root = path.resolve(root, "..", "v37");
const v38Root = path.resolve(root, "..", "v38");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

const inputs = {
  project: path.join(v37Root, "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
  dsp: path.join(v37Root, "generated", "UAOS_EXAMPLE_DSP_PLAN_V37.json"),
  style: path.join(v37Root, "generated", "UAOS_EXAMPLE_STYLE_REVIEW_PLAN_V37.json"),
  inspection: path.join(v38Root, "generated", "UAOS_V38_PROJECT_BUNDLE_INSPECTION.json"),
  score: path.join(v38Root, "generated", "UAOS_V38_STYLE_REVIEW_SCORE.json"),
  matrix: path.join(v38Root, "generated", "UAOS_V38_RECOMMENDATION_MATRIX.json")
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function safetyBlock() {
  return {
    metadataOnly: true,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const project = readJson(inputs.project);
const dsp = readJson(inputs.dsp);
const style = readJson(inputs.style);
const inspection = readJson(inputs.inspection);
const score = readJson(inputs.score);
const matrix = readJson(inputs.matrix);
const generatedAt = new Date().toISOString();

const data = {
  schemaVersion: "uaos.v39.metadata.report.data.v1",
  generatedAt,
  metadataOnly: true,
  korgOutputAllowed: false,
  setModificationAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  compatibilityClaim: false,
  pa3xReadyClaim: false,
  project,
  dspSummary: {
    channelCount: dsp.channels.length,
    sampleRate: dsp.master.sampleRate,
    targetLufs: dsp.master.targetLufs,
    peakCeilingDb: dsp.master.peakCeilingDb
  },
  styleChecklist: style.styleChecklist,
  bundleInspection: {
    validBundle: inspection.validBundle,
    missingFields: inspection.missingFields,
    warnings: inspection.warnings
  },
  styleScore: score.scores,
  recommendationMatrix: matrix.recommendations,
  blockedActions: [
    "KORG output",
    "SET modification",
    "STY/PRF/PRS/KST generation",
    "USB approval",
    "Keyboard load approval",
    "PA3X-ready claim",
    "Compatibility claim",
    "Deploy or payment flow"
  ],
  nextSafeActions: [
    "Expand metadata-only style review rules.",
    "Create local HTML index for V37-V39 reports.",
    "Continue with metadata-only rule-based style suggestions."
  ],
  safety: safetyBlock()
};

const dataPath = path.join(generatedDir, "UAOS_V39_METADATA_REPORT_DATA.json");
const htmlPath = path.join(generatedDir, "UAOS_V39_METADATA_REPORT.html");
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n", "utf8");

const scoreRows = Object.entries(score.scores).map(([key, value]) => `<tr><td>${esc(key)}</td><td>${esc(value)}</td></tr>`).join("");
const dspRows = dsp.channels.map((channel) => `<tr><td>${esc(channel.trackId)}</td><td>${esc(channel.role)}</td><td>${esc(channel.eqIntent)}</td><td>${esc(channel.reverbIntent)}</td></tr>`).join("");
const checklistRows = Object.entries(style.styleChecklist).map(([key, value]) => `<tr><td>${esc(key)}</td><td>${esc(value)}</td></tr>`).join("");
const recommendations = matrix.recommendations.map((item) => `<li><strong>${esc(item.id)}</strong>: ${esc(item.action)} <span>${esc(item.priority)}</span></li>`).join("");
const blocked = data.blockedActions.map((item) => `<li>${esc(item)}</li>`).join("");
const next = data.nextSafeActions.map((item) => `<li>${esc(item)}</li>`).join("");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>UAOS V39 Metadata Report</title>
  <style>
    :root{--bg:#030712;--panel:#111827;--line:#2b3649;--text:#f8fafc;--muted:#9ca3af;--green:#22c55e;--cyan:#22d3ee;--amber:#f59e0b}
    *{box-sizing:border-box}body{margin:0;background:#030712;color:var(--text);font-family:Arial,Tahoma,sans-serif;line-height:1.5}
    header{padding:22px;background:#050914;border-bottom:1px solid var(--line)}h1{margin:4px 0 0;font-size:30px}header p{margin:0;color:var(--cyan);font-weight:800}
    main{padding:16px;display:grid;gap:14px}.hero,.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
    section,.card{background:linear-gradient(180deg,rgba(17,24,39,.98),rgba(8,13,24,.98));border:1px solid var(--line);border-radius:8px;padding:14px}
    .warning{border-color:var(--amber)}.badge{display:inline-block;border:1px solid rgba(34,211,238,.45);border-radius:999px;padding:6px 9px;margin:3px;color:var(--cyan);font-weight:800}
    h2{margin:0 0 10px}table{width:100%;border-collapse:collapse}td,th{border-top:1px solid var(--line);padding:8px;text-align:left}td:first-child{color:var(--muted)}
    li{margin:6px 0}.ok{color:var(--green);font-weight:800}.blocked{color:var(--amber);font-weight:800}
  </style>
</head>
<body>
  <header>
    <p>UAOS Metadata Project Generator</p>
    <h1>V39 Metadata HTML Report</h1>
    <span class="badge">METADATA ONLY</span>
    <span class="badge">NOT KORG OUTPUT</span>
    <span class="badge">NOT PA3X READY</span>
    <span class="badge">NO USB APPROVAL</span>
    <span class="badge">NO KEYBOARD LOAD APPROVAL</span>
  </header>
  <main>
    <section class="warning">
      <h2>Metadata-only Warning</h2>
      <p>This static report is metadata-only. It is NOT KORG OUTPUT, NOT PA3X READY, gives NO USB APPROVAL, and gives NO KEYBOARD LOAD APPROVAL.</p>
    </section>
    <section>
      <h2>Project Overview</h2>
      <div class="grid">
        <div class="card"><strong>${esc(project.projectName)}</strong><br><span>${esc(project.projectId)}</span></div>
        <div class="card">Source mode<br><strong>${esc(project.sourceMode)}</strong></div>
        <div class="card">Target label<br><strong>${esc(project.targetKeyboard)}</strong></div>
        <div class="card">Bundle inspection<br><strong class="ok">${inspection.validBundle ? "VALID" : "CHECK"}</strong></div>
      </div>
    </section>
    <section>
      <h2>Safety Status</h2>
      <p class="ok">Metadata-only: YES</p>
      <p>KORG output allowed: NO. SET modification allowed: NO. USB write allowed: NO. Keyboard load allowed: NO.</p>
    </section>
    <section>
      <h2>Bundle Inspection Summary</h2>
      <p>Missing fields: ${inspection.missingFields.length ? esc(inspection.missingFields.join(", ")) : "none"}</p>
      <p>Warnings: ${inspection.warnings.length ? esc(inspection.warnings.join(", ")) : "none"}</p>
    </section>
    <section>
      <h2>Style Scoring Summary</h2>
      <table><tbody>${scoreRows}</tbody></table>
    </section>
    <section>
      <h2>DSP Plan Summary</h2>
      <table><thead><tr><th>Track</th><th>Role</th><th>EQ Intent</th><th>Reverb Intent</th></tr></thead><tbody>${dspRows}</tbody></table>
    </section>
    <section>
      <h2>Style Review Checklist</h2>
      <table><tbody>${checklistRows}</tbody></table>
    </section>
    <section>
      <h2>Recommendation Matrix</h2>
      <ul>${recommendations}</ul>
    </section>
    <section>
      <h2>Blocked Actions</h2>
      <ul class="blocked">${blocked}</ul>
    </section>
    <section>
      <h2>Next Safe Actions</h2>
      <ul>${next}</ul>
    </section>
  </main>
</body>
</html>`;
fs.writeFileSync(htmlPath, html, "utf8");

fs.writeFileSync(path.join(reportsDir, "UAOS_V39_HTML_EXPORTER_REPORT.md"), [
  "# UAOS V39 HTML Exporter Report",
  "",
  "Status: GENERATED",
  "",
  `HTML report: generated/UAOS_V39_METADATA_REPORT.html`,
  `Report data: generated/UAOS_V39_METADATA_REPORT_DATA.json`,
  "",
  "Safety: static HTML only, metadata-only, no App.jsx, no deploy output."
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", html: "generated/UAOS_V39_METADATA_REPORT.html", data: "generated/UAOS_V39_METADATA_REPORT_DATA.json" }, null, 2));
