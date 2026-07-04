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
  const absolute = path.join(base, version, relativePath);
  return { version, label, path: path.relative(root, absolute).replace(/\\/g, "/"), exists: fs.existsSync(absolute) };
}

function safetyBlock() {
  return {
    metadataOnly: true,
    staticHtmlOnly: true,
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
const entries = [
  entry("v37", "V37 project", "generated/UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
  entry("v37", "V37 DSP plan", "generated/UAOS_EXAMPLE_DSP_PLAN_V37.json"),
  entry("v37", "V37 style review plan", "generated/UAOS_EXAMPLE_STYLE_REVIEW_PLAN_V37.json"),
  entry("v37", "V37 manifest", "generated/UAOS_EXAMPLE_PROJECT_BUNDLE_MANIFEST_V37.json"),
  entry("v37", "V37 final seal", "reports/UAOS_V37_FINAL_SEAL.md"),
  entry("v38", "V38 bundle inspection", "generated/UAOS_V38_PROJECT_BUNDLE_INSPECTION.json"),
  entry("v38", "V38 style review score", "generated/UAOS_V38_STYLE_REVIEW_SCORE.json"),
  entry("v38", "V38 recommendation matrix", "generated/UAOS_V38_RECOMMENDATION_MATRIX.json"),
  entry("v38", "V38 owner dashboard", "reports/UAOS_V38_OWNER_DASHBOARD.md"),
  entry("v39", "V39 metadata HTML report", "generated/UAOS_V39_METADATA_REPORT.html"),
  entry("v39", "V39 expanded rules", "generated/UAOS_V39_STYLE_REVIEW_RULES_EXPANDED.json"),
  entry("v39", "V39 rule score summary", "generated/UAOS_V39_STYLE_RULE_SCORE_SUMMARY.json"),
  entry("v39", "V39 owner dashboard", "reports/UAOS_V39_OWNER_DASHBOARD.md"),
  { version: "v40", label: "V40 style suggestions", path: "generated/UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.json", exists: fs.existsSync(path.join(root, "generated", "UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.json")) },
  { version: "v40", label: "V40 suggestion summary", path: "generated/UAOS_V40_SUGGESTION_SCORE_SUMMARY.json", exists: fs.existsSync(path.join(root, "generated", "UAOS_V40_SUGGESTION_SCORE_SUMMARY.json")) },
  { version: "v40", label: "V40 reports", path: "reports/UAOS_V40_MASTER_INDEX.md", exists: fs.existsSync(path.join(root, "reports", "UAOS_V40_MASTER_INDEX.md")) }
];

const data = {
  schemaVersion: "uaos.v40.local.report.index.data.v1",
  generatedAt,
  metadataOnly: true,
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
  <title>UAOS V40 Local Report Index</title>
  <style>
    :root{--bg:#030712;--panel:#111827;--line:#2b3649;--text:#f8fafc;--muted:#9ca3af;--cyan:#22d3ee;--green:#22c55e;--amber:#f59e0b}
    *{box-sizing:border-box}body{margin:0;background:#030712;color:var(--text);font-family:Arial,Tahoma,sans-serif;line-height:1.5}
    header{padding:22px;background:#050914;border-bottom:1px solid var(--line)}h1{margin:4px 0 0}header p{margin:0;color:var(--cyan);font-weight:800}
    main{padding:16px;display:grid;gap:14px}section{background:linear-gradient(180deg,rgba(17,24,39,.98),rgba(8,13,24,.98));border:1px solid var(--line);border-radius:8px;padding:14px}
    .badge{display:inline-block;border:1px solid rgba(34,211,238,.45);border-radius:999px;padding:6px 9px;margin:3px;color:var(--cyan);font-weight:800}
    table{width:100%;border-collapse:collapse}td,th{border-top:1px solid var(--line);padding:8px;text-align:left}td:last-child{color:var(--green);font-weight:800}code{color:var(--amber)}
  </style>
</head>
<body>
  <header>
    <p>UAOS Metadata Project Generator</p>
    <h1>V40 Local Report Index</h1>
    <span class="badge">LOCAL INDEX ONLY</span>
    <span class="badge">METADATA ONLY</span>
    <span class="badge">NOT DEPLOYED</span>
    <span class="badge">NOT KORG OUTPUT</span>
    <span class="badge">NOT PA3X READY</span>
    <span class="badge">NO USB APPROVAL</span>
    <span class="badge">NO KEYBOARD LOAD APPROVAL</span>
  </header>
  <main>
    <section>
      <h2>Safety</h2>
      <p>This local static HTML index is metadata-only. It is not deployed, not KORG output, not PA3X ready, and provides no USB or keyboard load approval.</p>
    </section>
    <section>
      <h2>Local Report Links</h2>
      <table><thead><tr><th>Version</th><th>Item</th><th>Local path</th><th>Exists</th></tr></thead><tbody>${rows}</tbody></table>
    </section>
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(generatedDir, "UAOS_V40_LOCAL_REPORT_INDEX_DATA.json"), JSON.stringify(data, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V40_LOCAL_REPORT_INDEX.html"), html, "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V40_LOCAL_HTML_INDEX_REPORT.md"), [
  "# UAOS V40 Local HTML Index Report",
  "",
  "Status: GENERATED",
  "",
  "Local index: generated/UAOS_V40_LOCAL_REPORT_INDEX.html",
  "Index data: generated/UAOS_V40_LOCAL_REPORT_INDEX_DATA.json",
  "",
  "Safety: local index only, metadata-only, not deployed."
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", index: "generated/UAOS_V40_LOCAL_REPORT_INDEX.html", entries: entries.length }, null, 2));
