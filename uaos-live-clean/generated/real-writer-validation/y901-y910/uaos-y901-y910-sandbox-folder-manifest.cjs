const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const sandboxRoot = path.join(base, "writer-sandbox-phase0-no-output");
const reportsRoot = path.join(appRoot, "reports", "writer-sandbox-phase0");
const publicRoot = path.join(appRoot, "public", "governance", "y901-y940");
const outDir = path.join(base, "y901-y910");

fs.mkdirSync(sandboxRoot, { recursive: true });
fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const dirs = [
  "00_manifest",
  "01_no_output_harness",
  "02_scanners",
  "03_permission_checker",
  "04_rollback_freeze_monitor",
  "05_reports_only",
  "99_quarantine_empty"
];

for (const d of dirs) fs.mkdirSync(path.join(sandboxRoot, d), { recursive: true });

const safety = {
  writerImplementation: "BLOCKED",
  realWriter: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  forbiddenKeyboardExtensions: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  fixturesReadCopyModify: "BLOCKED",
  appJsxModified: false,
  sandboxPhase: "PHASE_0_NO_OUTPUT",
  sandboxIsolated: true
};

const manifest = {
  phase: "Y901-Y910",
  title: "Isolated No-Output Sandbox Folder Manifest",
  status: "PASS_SANDBOX_FOLDER_MANIFEST_READY",
  sandboxRoot,
  purpose: "Create an isolated folder for future sandbox governance only. No writer, no output, no parser, no fixtures.",
  allowedArtifacts: [".json", ".html", ".txt", ".md"],
  forbiddenExtensions: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
  directories: dirs.map(d => ({
    name: d,
    path: path.join(sandboxRoot, d),
    purpose: d === "99_quarantine_empty" ? "Must remain empty unless future failure evidence is copied manually after approval." : "Reports/governance only"
  })),
  safety,
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(path.join(sandboxRoot, "00_manifest", "sandbox-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y901-y910-sandbox-folder-manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y901-y910-sandbox-folder-manifest-report.json"), JSON.stringify({ phase: "Y901-Y910", status: "PASS_SANDBOX_FOLDER_MANIFEST_READY", manifest, safety }, null, 2), "utf8");

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const dirRows = manifest.directories.map(x => `<tr><td>${esc(x.name)}</td><td>${esc(x.purpose)}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Writer Sandbox Phase 0</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Writer Sandbox Phase 0</h1><h2>Isolated No-Output Sandbox Setup</h2><p>No writer is implemented. No output is allowed.</p></div>
<div class="card pass"><h2>Sandbox Folder</h2><p>${esc(sandboxRoot)}</p></div>
<div class="card"><h2>Directories</h2><table><tr><th>Name</th><th>Purpose</th></tr>${dirRows}</table></div>
<div class="card lock"><h2>Hard Locks</h2><p>Writer: BLOCKED<br>Real output: BLOCKED<br>Production parser: BLOCKED<br>Deploy: BLOCKED<br>Fixtures touch: BLOCKED<br>App.jsx: NOT MODIFIED</p></div>
</body>
</html>`;

fs.writeFileSync(path.join(publicRoot, "index.html"), html, "utf8");

console.log("[Y901-Y910 PASS_SANDBOX_FOLDER_MANIFEST_READY]");
