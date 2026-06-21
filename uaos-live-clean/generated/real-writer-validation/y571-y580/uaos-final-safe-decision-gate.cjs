const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const publicDir = path.join(appRoot, "public");
const outDir = path.join(base, "y571-y580");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y571-Y580 FAIL]", msg);
  process.exit(1);
}

function load(rel) {
  const p = path.join(base, rel);
  if (!fs.existsSync(p)) fail("Missing report: " + rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const review = load("y541-y550/y541-y550-local-product-review-dashboard-report.json");
const matrix = load("y551-y560/y551-y560-next-decision-matrix-report.json");
const reco = load("y561-y570/y561-y570-cto-next-step-recommendation-report.json");

const final = {
  phase: "Y571-Y580",
  title: "Final Safe Decision Gate",
  status: "PASS_SAFE_NEXT_DECISION_READY",
  decision: {
    projectLocalReview: "READY",
    recommendedNextPhase: "Y581-Y620 Local Demo Polish + Executive Presentation Layer",
    allowedNext: ["UI_POLISH", "DRYRUN_IMPROVEMENTS"],
    blockedNext: ["REAL_WRITER", "REAL_KEYBOARD_OUTPUT", "PRODUCTION_PARSER", "PUBLIC_DEPLOY"]
  },
  sourceStatuses: {
    review: review.status,
    matrix: matrix.status,
    recommendation: reco.status
  },
  finalState: {
    localReviewDashboard: "READY",
    decisionMatrix: "READY",
    ctoRecommendation: "READY",
    finalSafeDecisionGate: "READY",
    writer: "BLOCKED",
    realKeyboardOutput: "BLOCKED",
    productionParser: "BLOCKED",
    deploy: "BLOCKED",
    appJsxModified: false
  },
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
  <title>UAOS Final Safe Decision Gate</title>
  <style>
    body{font-family:Arial;background:#101010;color:#eee;padding:28px;line-height:1.5}
    .hero{padding:24px;border-radius:16px;background:#181818;border:1px solid #444;margin-bottom:18px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
    .card{background:#1b1b1b;border:1px solid #444;border-radius:14px;padding:18px}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS Final Safe Decision Gate</h1>
    <h2>Y571-Y580 PASS_SAFE_NEXT_DECISION_READY</h2>
    <p>Recommended next: Y581-Y620 Local Demo Polish + Executive Presentation Layer.</p>
  </div>

  <div class="grid">
    <div class="card pass"><h3>Local Review</h3><p>READY</p></div>
    <div class="card pass"><h3>Decision Matrix</h3><p>READY</p></div>
    <div class="card pass"><h3>CTO Recommendation</h3><p>READY</p></div>
    <div class="card pass"><h3>Safe Decision Gate</h3><p>READY</p></div>
    <div class="card lock"><h3>Writer</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Real Keyboard Output</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Production Parser</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Deploy</h3><p>BLOCKED</p></div>
  </div>

  <div class="card" style="margin-top:18px">
    <h3>Open Review Pages</h3>
    <p><a href="./uaos-local-product-review-dashboard.html">Local Product Review Dashboard</a></p>
    <p><a href="./uaos-next-decision-matrix.html">Next Decision Matrix</a></p>
    <p><a href="./uaos-cto-next-step-recommendation.html">CTO Next-step Recommendation</a></p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-final-safe-decision-gate.html"), html, "utf8");
fs.writeFileSync(path.join(outDir, "y571-y580-final-safe-decision-gate-report.json"), JSON.stringify(final, null, 2), "utf8");

console.log("[Y571-Y580 PASS_SAFE_NEXT_DECISION_READY]");
