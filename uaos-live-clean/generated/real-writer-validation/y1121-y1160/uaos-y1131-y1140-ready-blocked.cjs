const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y1121-y1160");
const docsRoot = path.join(appRoot, "reports", "public-review-docs");
const publicRoot = path.join(appRoot, "public", "governance", "y1121-y1160");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });

const safety = {
  writerImplementation: "BLOCKED",
  realWriter: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  forbiddenKeyboardExtensions: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  fixturesReadCopyModify: "BLOCKED",
  appJsxModified: false,
  outputAllowed: false,
  docsOnly: true,
  commercialProduct: "NO"
};

const readyBlocked = {
  phase: "Y1131-Y1140",
  title: "What Is Ready / What Is Blocked",
  status: "PASS_READY_BLOCKED_DOC_READY",
  ready: [
    { item: "Local proof", status: "READY", note: "Safe local review evidence exists." },
    { item: "Commercial readiness planning", status: "READY", note: "Planning only, not launch." },
    { item: "Writer specification", status: "READY", note: "Spec only, no implementation." },
    { item: "Conformance design", status: "READY", note: "Design only." },
    { item: "Approval governance", status: "READY", note: "NO-GO unless separately approved." },
    { item: "No-output sandbox", status: "READY", note: "Isolated generated sandbox only." },
    { item: "Dry-run contracts", status: "READY", note: "Contracts only, no output." },
    { item: "Read-only simulator", status: "READY", note: "Rejects forbidden actions." },
    { item: "Final handover freeze", status: "READY", note: "Safe closure pages ready." }
  ],
  blocked: [
    { item: "Writer implementation", status: "BLOCKED", reason: "Requires separate explicit approval." },
    { item: "Real writer", status: "BLOCKED", reason: "Not implemented." },
    { item: "Real keyboard output", status: "BLOCKED", reason: "No .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST." },
    { item: "Production parser", status: "BLOCKED", reason: "Not approved." },
    { item: "Deploy/public release", status: "BLOCKED", reason: "No release authorization." },
    { item: "Fixtures read/copy/modify", status: "BLOCKED", reason: "No fixture permission." },
    { item: "App.jsx modification", status: "BLOCKED", reason: "Protected by constraint." },
    { item: "Commercial product claim", status: "NO", reason: "Only safe local proof and planning are ready." }
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const md = `# What Is Ready / What Is Blocked

## Ready

${readyBlocked.ready.map(x => `- ${x.item}: ${x.status} — ${x.note}`).join("\n")}

## Blocked

${readyBlocked.blocked.map(x => `- ${x.item}: ${x.status} — ${x.reason}`).join("\n")}
`;

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function rows(items, type){
  return items.map(x => `<tr><td>${esc(x.item)}</td><td>${esc(x.status)}</td><td>${esc(type === "ready" ? x.note : x.reason)}</td></tr>`).join("\n");
}

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Ready / Blocked</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}
</style>
</head>
<body>
<div class="card"><h1>UAOS What Is Ready / What Is Blocked</h1></div>
<div class="card pass"><h2>Ready</h2><table><tr><th>Item</th><th>Status</th><th>Note</th></tr>${rows(readyBlocked.ready, "ready")}</table></div>
<div class="card bad"><h2>Blocked</h2><table><tr><th>Item</th><th>Status</th><th>Reason</th></tr>${rows(readyBlocked.blocked, "blocked")}</table></div>
</body>
</html>`;

fs.writeFileSync(path.join(docsRoot, "Y1131-ready-blocked.json"), JSON.stringify(readyBlocked, null, 2), "utf8");
fs.writeFileSync(path.join(docsRoot, "Y1131-ready-blocked.md"), md, "utf8");
fs.writeFileSync(path.join(outDir, "y1131-y1140-ready-blocked-report.json"), JSON.stringify({ phase: "Y1131-Y1140", status: "PASS_READY_BLOCKED_DOC_READY", readyBlocked, safety }, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "ready-blocked.html"), html, "utf8");

console.log("[Y1131-Y1140 PASS_READY_BLOCKED_DOC_READY]");
