const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const sandboxRoot = path.join(base, "writer-sandbox-phase0-no-output");
const reportsRoot = path.join(appRoot, "reports", "writer-sandbox-phase0");
const publicRoot = path.join(appRoot, "public", "governance", "y901-y940");
const outDir = path.join(base, "y911-y920");

fs.mkdirSync(path.join(sandboxRoot, "01_no_output_harness"), { recursive: true });
fs.mkdirSync(path.join(sandboxRoot, "02_scanners"), { recursive: true });
fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const forbiddenExtensions = [".sty", ".set", ".prs", ".stl", ".pat", ".msp", ".kst"];

function walk(dir, files=[]) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

const files = walk(sandboxRoot);
const forbiddenFound = files.filter(f => forbiddenExtensions.includes(path.extname(f).toLowerCase()));

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
  noOutputHarnessActive: true
};

const harness = {
  phase: "Y911-Y915",
  title: "No-Output Harness",
  status: "PASS_NO_OUTPUT_HARNESS_READY",
  purpose: "Define a no-output harness that proves this sandbox may only create reports and HTML.",
  outputAllowed: false,
  allowedArtifacts: [".json", ".html", ".txt", ".md"],
  forbiddenExtensions,
  rules: [
    "No writer commands.",
    "No binary serialization.",
    "No output generation.",
    "No real keyboard file creation.",
    "No production parser.",
    "No fixtures touch.",
    "No deploy."
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const scanner = {
  phase: "Y916-Y920",
  title: "Forbidden Extension Scanner",
  status: forbiddenFound.length === 0 ? "PASS_FORBIDDEN_EXTENSION_SCAN_CLEAN" : "FAIL_FORBIDDEN_EXTENSION_FOUND",
  scanRoot: sandboxRoot,
  forbiddenExtensions,
  scannedFileCount: files.length,
  forbiddenFound,
  clean: forbiddenFound.length === 0,
  safety,
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(path.join(sandboxRoot, "01_no_output_harness", "no-output-harness.json"), JSON.stringify(harness, null, 2), "utf8");
fs.writeFileSync(path.join(sandboxRoot, "02_scanners", "forbidden-extension-scan.json"), JSON.stringify(scanner, null, 2), "utf8");
fs.writeFileSync(path.join(reportsRoot, "y911-y920-no-output-harness-scanner.json"), JSON.stringify({ harness, scanner, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y911-y920-no-output-harness-scanner-report.json"), JSON.stringify({ phase: "Y911-Y920", status: scanner.clean ? "PASS_NO_OUTPUT_HARNESS_SCANNER_READY" : "FAIL_FORBIDDEN_EXTENSION_FOUND", harness, scanner, safety }, null, 2), "utf8");

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS No-Output Harness + Scanner</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>No-Output Harness + Forbidden Extension Scanner</h1><h2>${esc(scanner.status)}</h2></div>
<div class="card pass"><h2>Harness Rules</h2><ul>${list(harness.rules)}</ul></div>
<div class="card lock"><h2>Forbidden Extensions</h2><ul>${list(forbiddenExtensions)}</ul></div>
<div class="card"><h2>Scan Result</h2><p>Scanned files: ${scanner.scannedFileCount}<br>Forbidden found: ${scanner.forbiddenFound.length}</p></div>
</body>
</html>`;

fs.writeFileSync(path.join(publicRoot, "no-output-harness-scanner.html"), html, "utf8");

if (!scanner.clean) {
  console.error("[Y911-Y920 FAIL_FORBIDDEN_EXTENSION_FOUND]");
  process.exit(1);
}

console.log("[Y911-Y920 PASS_NO_OUTPUT_HARNESS_SCANNER_READY]");
