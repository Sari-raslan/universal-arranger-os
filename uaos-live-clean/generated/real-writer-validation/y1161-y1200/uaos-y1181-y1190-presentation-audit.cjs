const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y1161-y1200");
const docsRoot = path.join(appRoot, "reports", "repository-presentation");
const publicRoot = path.join(appRoot, "public", "governance", "y1161-y1200");

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(docsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });

const requiredFiles = [
  "README_SAFE_REVIEW.md",
  "public/governance/final-master-index.html",
  "public/governance/final-handover-freeze.html",
  "public/governance/y1121-y1160/public-review-index.html",
  "public/governance/y1121-y1160/executive-overview.html",
  "public/governance/y1121-y1160/ready-blocked.html",
  "public/governance/y1121-y1160/cto-handover-summary.html",
  "public/governance/y1121-y1160/next-decision-options.html",
  "public/governance/y1161-y1200/repository-readme.html",
  "public/governance/y1161-y1200/review-navigation-index.html"
];

const readiness = requiredFiles.map(rel => ({
  rel,
  exists: fs.existsSync(path.join(appRoot, rel))
}));

const missing = readiness.filter(x => !x.exists);

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

const report = {
  phase: "Y1181-Y1190",
  title: "Final Repository Presentation Audit",
  status: missing.length === 0 ? "PASS_REPOSITORY_PRESENTATION_AUDIT_CLEAN" : "FAIL_REPOSITORY_PRESENTATION_MISSING_FILES",
  requiredFiles: readiness,
  missing,
  clean: missing.length === 0,
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
const rows = readiness.map(x => `<tr><td>${esc(x.rel)}</td><td>${x.exists ? "READY" : "MISSING"}</td></tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>UAOS Repository Presentation Audit</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}
</style>
</head>
<body>
<div class="card"><h1>UAOS Repository Presentation Audit</h1><h2>${esc(report.status)}</h2></div>
<div class="card"><table><tr><th>Required File</th><th>Status</th></tr>${rows}</table></div>
</body>
</html>`;

fs.writeFileSync(path.join(docsRoot, "Y1181-presentation-audit.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y1181-y1190-presentation-audit-report.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(publicRoot, "presentation-audit.html"), html, "utf8");

if (!report.clean) {
  console.error("[Y1181-Y1190 FAIL_REPOSITORY_PRESENTATION_MISSING_FILES]");
  process.exit(1);
}

console.log("[Y1181-Y1190 PASS_REPOSITORY_PRESENTATION_AUDIT_CLEAN]");
