const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const publicDir = path.join(appRoot, "public");
const outDir = path.join(base, "y631-y640");
fs.mkdirSync(outDir, { recursive: true });

const flow = [
  { step: 1, title: "Open Navigation Hub", file: "uaos-polished-navigation-hub.html", purpose: "Start the review from one page." },
  { step: 2, title: "Executive Presentation", file: "uaos-executive-presentation.html", purpose: "Explain value and status." },
  { step: 3, title: "Founder Demo Script", file: "uaos-founder-demo-script.html", purpose: "Use the speaking path." },
  { step: 4, title: "Investor / Partner Summary", file: "uaos-investor-partner-proof-summary.html", purpose: "Show opportunity and ask." },
  { step: 5, title: "Evidence Index", file: "uaos-local-evidence-index.html", purpose: "Inspect all technical proof pages." },
  { step: 6, title: "Final Safe Decision Gate", file: "uaos-final-safe-decision-gate.html", purpose: "Close with the safe next decision." }
];

const checked = flow.map(x => ({ ...x, exists: fs.existsSync(path.join(publicDir, x.file)), href: `./${x.file}` }));
const missing = checked.filter(x => !x.exists);

const stepsHtml = checked.map(s => `
<div class="step ${s.exists ? "ok" : "missing"}">
  <div class="num">${s.step}</div>
  <div>
    <h2>${s.title}</h2>
    <p>${s.purpose}</p>
    <p><a href="${s.href}">Open page</a> · <small>${s.exists ? "READY" : "MISSING"}</small></p>
  </div>
</div>`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Guided Review Flow</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .hero{padding:30px;border-radius:20px;background:#181818;border:1px solid #444;margin-bottom:18px}
    .step{display:flex;gap:16px;background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:18px;margin:14px 0}
    .step.ok{border-color:#437a55}.step.missing{border-color:#aa5555}
    .num{width:42px;height:42px;border-radius:50%;background:#80ffb0;color:#101010;font-weight:bold;display:flex;align-items:center;justify-content:center}
    .lock{color:#ffcc66}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS Guided Review Flow</h1>
    <p>Follow this sequence during a live local review.</p>
    <p class="lock">No writer, no real keyboard output, no production parser, no deploy.</p>
  </div>
  ${stepsHtml}
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-guided-review-flow.html"), html, "utf8");

const report = {
  phase: "Y631-Y640",
  title: "Guided Review Flow Page",
  status: missing.length === 0 ? "PASS_REVIEW_FLOW_READY" : "PASS_REVIEW_FLOW_READY_WITH_MISSING_LINKS",
  publicPage: "uaos-guided-review-flow.html",
  stepCount: checked.length,
  missingCount: missing.length,
  flow: checked,
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

fs.writeFileSync(path.join(outDir, "y631-y640-guided-review-flow-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log("[Y631-Y640]", report.status);
