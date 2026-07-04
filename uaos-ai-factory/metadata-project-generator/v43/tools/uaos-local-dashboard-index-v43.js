import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
}

function entry(version, label, relativePath) {
  const absolute = version === "v43" ? path.join(root, relativePath) : path.join(base, version, relativePath);
  return { version, label, path: version === "v43" ? relativePath : path.relative(root, absolute).replace(/\\/g, "/"), exists: fs.existsSync(absolute) };
}

function safetyBlock() {
  return {
    metadataOnly: true,
    decisionCollectionOnly: true,
    dryRunOnly: true,
    sourceProjectModified: false,
    autoApplyEnabled: false,
    realApplyAllowed: false,
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

const entries = [
  entry("v37", "V37 generated project", "generated/UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
  entry("v37", "V37 reports", "reports/UAOS_V37_MASTER_INDEX.md"),
  entry("v38", "V38 inspection", "generated/UAOS_V38_PROJECT_BUNDLE_INSPECTION.json"),
  entry("v38", "V38 scoring", "generated/UAOS_V38_STYLE_REVIEW_SCORE.json"),
  entry("v38", "V38 reports", "reports/UAOS_V38_MASTER_INDEX.md"),
  entry("v39", "V39 metadata report", "generated/UAOS_V39_METADATA_REPORT.html"),
  entry("v39", "V39 expanded rules", "generated/UAOS_V39_STYLE_REVIEW_RULES_EXPANDED.json"),
  entry("v39", "V39 reports", "reports/UAOS_V39_MASTER_INDEX.md"),
  entry("v40", "V40 suggestions", "generated/UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.json"),
  entry("v40", "V40 local index", "generated/UAOS_V40_LOCAL_REPORT_INDEX.html"),
  entry("v40", "V40 reports", "reports/UAOS_V40_MASTER_INDEX.md"),
  entry("v41", "V41 review pack", "generated/UAOS_V41_SUGGESTION_REVIEW_PACK.json"),
  entry("v41", "V41 comparison matrix", "generated/UAOS_V41_LOCAL_PROJECT_COMPARISON_MATRIX.json"),
  entry("v41", "V41 reports", "reports/UAOS_V41_MASTER_INDEX.md"),
  entry("v42", "V42 simulation plan", "generated/UAOS_V42_METADATA_APPLY_SIMULATION_PLAN.json"),
  entry("v42", "V42 local dashboard", "generated/UAOS_V42_LOCAL_REVIEW_DASHBOARD.html"),
  entry("v42", "V42 reports", "reports/UAOS_V42_MASTER_INDEX.md"),
  entry("v43", "V43 decision template", "generated/UAOS_V43_OWNER_DECISION_TEMPLATE.json"),
  entry("v43", "V43 dashboard index", "generated/UAOS_V43_LOCAL_DASHBOARD_INDEX_V37_V42.html"),
  entry("v43", "V43 reports", "reports/UAOS_V43_MASTER_INDEX.md")
];

const generatedAt = new Date().toISOString();
const data = {
  schemaVersion: "uaos.v43.local.dashboard.index.data.v1",
  generatedAt,
  metadataOnly: true,
  decisionCollectionOnly: true,
  dryRunOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  entries,
  safety: safetyBlock()
};

const rows = entries.map((item) => `<tr><td>${esc(item.version)}</td><td>${esc(item.label)}</td><td><code>${esc(item.path)}</code></td><td>${item.exists ? "YES" : "NO"}</td></tr>`).join("");
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>UAOS V43 Local Dashboard Index</title>
  <style>
    :root{--bg:#030712;--panel:#111827;--line:#2b3649;--text:#f8fafc;--cyan:#22d3ee;--green:#22c55e;--amber:#f59e0b}
    *{box-sizing:border-box}body{margin:0;background:#030712;color:var(--text);font-family:Arial,Tahoma,sans-serif;line-height:1.5}
    header{padding:22px;background:#050914;border-bottom:1px solid var(--line)}h1{margin:4px 0 0}header p{margin:0;color:var(--cyan);font-weight:800}
    main{padding:16px}section{background:linear-gradient(180deg,rgba(17,24,39,.98),rgba(8,13,24,.98));border:1px solid var(--line);border-radius:8px;padding:14px;margin-bottom:14px}
    .badge{display:inline-block;border:1px solid rgba(34,211,238,.45);border-radius:999px;padding:6px 9px;margin:3px;color:var(--cyan);font-weight:800}
    table{width:100%;border-collapse:collapse}td,th{border-top:1px solid var(--line);padding:8px;text-align:left}td:last-child{color:var(--green);font-weight:800}code{color:var(--amber)}
  </style>
</head>
<body>
  <header>
    <p>UAOS Metadata Project Generator</p>
    <h1>V43 Local Dashboard Index V37-V42</h1>
    <span class="badge">LOCAL DASHBOARD INDEX ONLY</span>
    <span class="badge">METADATA ONLY</span>
    <span class="badge">DECISION COLLECTION ONLY</span>
    <span class="badge">DRY-RUN ONLY</span>
    <span class="badge">SOURCE PROJECT NOT MODIFIED</span>
    <span class="badge">NOT DEPLOYED</span>
    <span class="badge">NOT KORG OUTPUT</span>
    <span class="badge">NOT PA3X READY</span>
    <span class="badge">NO USB APPROVAL</span>
    <span class="badge">NO KEYBOARD LOAD APPROVAL</span>
  </header>
  <main>
    <section>
      <h2>Safety</h2>
      <p>This local dashboard index is metadata-only and decision collection only. It is not deployed, not KORG output, not PA3X ready, and gives no USB or keyboard load approval.</p>
    </section>
    <section>
      <h2>Local Dashboard Index</h2>
      <table><thead><tr><th>Version</th><th>Item</th><th>Local path</th><th>Exists</th></tr></thead><tbody>${rows}</tbody></table>
    </section>
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(generatedDir, "UAOS_V43_LOCAL_DASHBOARD_INDEX_DATA.json"), JSON.stringify(data, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V43_LOCAL_DASHBOARD_INDEX_V37_V42.html"), html, "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V43_LOCAL_DASHBOARD_INDEX_REPORT.md"), [
  "# UAOS V43 Local Dashboard Index Report",
  "",
  "Status: GENERATED",
  "",
  "Dashboard index: generated/UAOS_V43_LOCAL_DASHBOARD_INDEX_V37_V42.html",
  "Dashboard index data: generated/UAOS_V43_LOCAL_DASHBOARD_INDEX_DATA.json",
  "",
  "Safety: local index only, metadata-only, decision collection only, not deployed."
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", entries: entries.length, output: "generated/UAOS_V43_LOCAL_DASHBOARD_INDEX_V37_V42.html" }, null, 2));
