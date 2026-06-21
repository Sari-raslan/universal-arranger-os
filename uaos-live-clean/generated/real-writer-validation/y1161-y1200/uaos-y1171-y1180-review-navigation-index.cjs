const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y1161-y1200");
const docsRoot = path.join(appRoot, "reports", "repository-presentation");
const publicRoot = path.join(appRoot, "public", "governance", "y1161-y1200");
const publicGov = path.join(appRoot, "public", "governance");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(publicGov, { recursive: true });

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

const links = [
  { title: "Final Master Index", url: "../final-master-index.html", priority: "PRIMARY" },
  { title: "Final Handover Freeze", url: "../final-handover-freeze.html", priority: "PRIMARY" },
  { title: "Public Review Index", url: "../y1121-y1160/public-review-index.html", priority: "PRIMARY" },
  { title: "Executive Overview", url: "../y1121-y1160/executive-overview.html", priority: "HIGH" },
  { title: "Ready / Blocked", url: "../y1121-y1160/ready-blocked.html", priority: "HIGH" },
  { title: "CTO Handover Summary", url: "../y1121-y1160/cto-handover-summary.html", priority: "HIGH" },
  { title: "Next Decision Options", url: "../y1121-y1160/next-decision-options.html", priority: "HIGH" },
  { title: "Repository README", url: "./repository-readme.html", priority: "HIGH" },
  { title: "Final Safe Closure", url: "../y1001-y1080/final-safe-closure.html", priority: "REFERENCE" },
  { title: "Sandbox Audit Freeze", url: "../y941-y1000/final-sandbox-audit-freeze.html", priority: "REFERENCE" }
];

const report = {
  phase: "Y1171-Y1180",
  title: "Review Navigation Index",
  status: "PASS_REVIEW_NAVIGATION_INDEX_READY",
  links,
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const rows = links.map(x => `<tr><td>${esc(x.priority)}</td><td>${esc(x.title)}</td><td><a href="${esc(x.url)}">${esc(x.url)}</a></td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Review Navigation Index</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style>
</head>
<body>
<div class="card"><h1>UAOS Review Navigation Index</h1><h2 class="pass">Reviewer Navigation Ready</h2></div>
<div class="card"><table><tr><th>Priority</th><th>Page</th><th>Link</th></tr>${rows}</table></div>
<div class="card lock"><h2>Locks</h2><p>Writer: BLOCKED | Real output: BLOCKED | Parser: BLOCKED | Deploy: BLOCKED | Fixtures: BLOCKED | App.jsx: false</p></div>
</body>
</html>`;

fs.writeFileSync(path.join(docsRoot, "Y1171-review-navigation-index.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1171-y1180-review-navigation-index-report.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "review-navigation-index.html"), html, "utf8");

console.log("[Y1171-Y1180 PASS_REVIEW_NAVIGATION_INDEX_READY]");
