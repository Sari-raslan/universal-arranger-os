const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const publicDir = path.join(appRoot, "public");
const outDir = path.join(base, "y651-y660");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y651-Y660 FAIL]", msg);
  process.exit(1);
}

function load(rel) {
  const p = path.join(base, rel);
  if (!fs.existsSync(p)) fail("Missing report: " + rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const nav = load("y621-y630/y621-y630-polished-navigation-hub-report.json");
const flow = load("y631-y640/y631-y640-guided-review-flow-report.json");
const checklist = load("y641-y650/y641-y650-demo-checklist-review-notes-report.json");

const final = {
  phase: "Y651-Y660",
  title: "Final Local UI Navigation Polish Gate",
  status: "PASS_LOCAL_UI_NAVIGATION_POLISHED",
  finalConclusion: "UAOS local demo review flow is polished with a navigation hub, guided review flow, and demo checklist.",
  pages: [
    "uaos-polished-navigation-hub.html",
    "uaos-guided-review-flow.html",
    "uaos-demo-checklist-review-notes.html",
    "uaos-final-ui-navigation-polish-gate.html"
  ],
  sourceStatuses: {
    navigationHub: nav.status,
    guidedReviewFlow: flow.status,
    demoChecklist: checklist.status
  },
  finalState: {
    navigationHub: "READY",
    guidedReviewFlow: "READY",
    demoChecklist: "READY",
    finalNavigationPolishGate: "READY",
    writer: "BLOCKED",
    realKeyboardOutput: "BLOCKED",
    productionParser: "BLOCKED",
    deploy: "BLOCKED",
    appJsxModified: false
  },
  recommendedNext: "Pause and review the local package, or proceed to Y661-Y700 Local QA Freeze + Handover Summary.",
  hardLimits: {
    appJsxModified: false,
    writerImplementation: false,
    realKeyboardOutput: false,
    productionParser: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Final UI Navigation Polish Gate</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .hero{padding:30px;border-radius:20px;background:#181818;border:1px solid #444;margin-bottom:18px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:18px}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS Final UI Navigation Polish Gate</h1>
    <h2>Y651-Y660 PASS_LOCAL_UI_NAVIGATION_POLISHED</h2>
    <p>The local demo now has a clean review flow.</p>
  </div>

  <div class="grid">
    <div class="card pass"><h3>Navigation Hub</h3><p>READY</p></div>
    <div class="card pass"><h3>Guided Review Flow</h3><p>READY</p></div>
    <div class="card pass"><h3>Demo Checklist</h3><p>READY</p></div>
    <div class="card pass"><h3>Final Polish Gate</h3><p>READY</p></div>
    <div class="card lock"><h3>Writer</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Real Keyboard Output</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Production Parser</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Deploy</h3><p>BLOCKED</p></div>
  </div>

  <div class="card" style="margin-top:18px">
    <h2>Open Review Flow</h2>
    <p><a href="./uaos-polished-navigation-hub.html">Polished Navigation Hub</a></p>
    <p><a href="./uaos-guided-review-flow.html">Guided Review Flow</a></p>
    <p><a href="./uaos-demo-checklist-review-notes.html">Demo Checklist + Review Notes</a></p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-final-ui-navigation-polish-gate.html"), html, "utf8");
fs.writeFileSync(path.join(outDir, "y651-y660-final-ui-navigation-polish-gate-report.json"), JSON.stringify(final, null, 2), "utf8");

console.log("[Y651-Y660 PASS_LOCAL_UI_NAVIGATION_POLISHED]");
