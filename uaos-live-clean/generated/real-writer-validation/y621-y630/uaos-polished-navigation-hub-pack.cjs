const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const publicDir = path.join(appRoot, "public");
const outDir = path.join(base, "y621-y630");
fs.mkdirSync(outDir, { recursive: true });

const links = [
  { section: "Start", title: "Final Polished Local Demo Gate", file: "uaos-final-polished-local-demo-gate.html", tag: "START_HERE" },
  { section: "Executive", title: "Executive Presentation", file: "uaos-executive-presentation.html", tag: "EXECUTIVE" },
  { section: "Founder", title: "Founder Demo Script", file: "uaos-founder-demo-script.html", tag: "FOUNDER" },
  { section: "Partner", title: "Investor / Partner Proof Summary", file: "uaos-investor-partner-proof-summary.html", tag: "PARTNER" },
  { section: "Proof", title: "Final Local Proof Package", file: "uaos-final-local-proof-package.html", tag: "PROOF" },
  { section: "Proof", title: "Local Evidence Index", file: "uaos-local-evidence-index.html", tag: "INDEX" },
  { section: "Decision", title: "Final Safe Decision Gate", file: "uaos-final-safe-decision-gate.html", tag: "DECISION" },
  { section: "Decision", title: "Next Decision Matrix", file: "uaos-next-decision-matrix.html", tag: "MATRIX" },
  { section: "Technical", title: "Final Dry-run Local Viewer Gate", file: "y491-y500-final-dryrun-local-viewer-gate.html", tag: "DRYRUN_VIEWER" },
  { section: "Technical", title: "Final Dry-run Writer Readiness", file: "y451-y460-final-dryrun-writer-readiness.html", tag: "DRYRUN_WRITER" }
];

const checkedLinks = links.map(l => ({
  ...l,
  exists: fs.existsSync(path.join(publicDir, l.file)),
  href: `./${l.file}`
}));

const missing = checkedLinks.filter(l => !l.exists);

const grouped = {};
for (const l of checkedLinks) {
  grouped[l.section] = grouped[l.section] || [];
  grouped[l.section].push(l);
}

const groupsHtml = Object.entries(grouped).map(([section, items]) => `
<section class="card">
  <h2>${section}</h2>
  <div class="grid">
    ${items.map(i => `
      <a class="tile ${i.exists ? "ok" : "missing"}" href="${i.href}">
        <span class="tag">${i.tag}</span>
        <strong>${i.title}</strong>
        <small>${i.exists ? "READY" : "MISSING"}</small>
      </a>
    `).join("\n")}
  </div>
</section>`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Polished Local Navigation Hub</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .hero{padding:30px;border-radius:20px;background:#181818;border:1px solid #444;margin-bottom:18px}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:18px;margin:16px 0}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
    .tile{display:block;text-decoration:none;color:#eee;background:#232326;border:1px solid #444;border-radius:14px;padding:16px}
    .tile.ok{border-color:#437a55}
    .tile.missing{border-color:#aa5555}
    .tag{display:inline-block;font-size:12px;color:#101010;background:#80ffb0;padding:4px 8px;border-radius:999px;margin-bottom:10px}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS Polished Local Navigation Hub</h1>
    <h2>Y621-Y660 Review Flow</h2>
    <p>One clean navigation path for founder, CTO, partner, and technical review.</p>
  </div>

  <section class="card">
    <h2>Final Safety State</h2>
    <p class="pass">Local demo and proof package: READY</p>
    <p class="lock">Writer: BLOCKED | Real keyboard output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED</p>
  </section>

  ${groupsHtml}
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-polished-navigation-hub.html"), html, "utf8");

const report = {
  phase: "Y621-Y630",
  title: "Polished Local Navigation Hub",
  status: missing.length === 0 ? "PASS_NAVIGATION_HUB_READY" : "PASS_NAVIGATION_HUB_READY_WITH_MISSING_LINKS",
  publicPage: "uaos-polished-navigation-hub.html",
  linkCount: checkedLinks.length,
  missingCount: missing.length,
  links: checkedLinks,
  missing,
  hardLimits: {
    appJsxModified: false,
    writerImplementation: false,
    realKeyboardOutput: false,
    productionParser: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(path.join(outDir, "y621-y630-polished-navigation-hub-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log("[Y621-Y630]", report.status);
