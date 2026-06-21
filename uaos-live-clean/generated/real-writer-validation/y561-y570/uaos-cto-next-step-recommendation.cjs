const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const publicDir = path.join(appRoot, "public");
const outDir = path.join(base, "y561-y570");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y561-Y570 FAIL]", msg);
  process.exit(1);
}

const matrixPath = path.join(base, "y551-y560", "y551-y560-next-decision-matrix-report.json");
if (!fs.existsSync(matrixPath)) fail("Missing decision matrix report");

const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8"));

const recommendation = {
  phase: "Y561-Y570",
  title: "CTO Next-step Recommendation",
  status: "PASS_CTO_RECOMMENDATION_READY",
  primaryRecommendation: "UI_POLISH",
  secondaryRecommendation: "DRYRUN_IMPROVEMENTS",
  doNotDoNow: ["REAL_WRITER", "PUBLIC_DEPLOY"],
  rationale: [
    "UI polish increases demo value without technical risk.",
    "Dry-run improvements strengthen evidence while staying JSON-only.",
    "Real writer is too risky without formal binary spec and conformance validation.",
    "Public deploy is premature because production parser and real writer are blocked."
  ],
  recommendedNextPhase: {
    phaseRange: "Y581-Y620",
    name: "Local Demo Polish + Executive Presentation Layer",
    safeScope: [
      "public HTML pages only",
      "navigation polish",
      "executive presentation copy",
      "proof package clarity",
      "no writer",
      "no deploy",
      "no App.jsx"
    ]
  },
  sourceDecisionMatrix: matrix.status,
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
  <title>UAOS CTO Next-step Recommendation</title>
  <style>
    body{font-family:Arial;background:#101010;color:#eee;padding:28px;line-height:1.5}
    .hero{padding:24px;border-radius:16px;background:#181818;border:1px solid #444;margin-bottom:18px}
    .card{background:#1b1b1b;border:1px solid #444;border-radius:14px;padding:18px;margin:14px 0}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}code{color:#9fe870}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS CTO Next-step Recommendation</h1>
    <h2>Recommended: UI Polish + Dry-run Improvements</h2>
  </div>

  <div class="card pass">
    <h3>Primary Recommendation</h3>
    <p>Y581-Y620: Local Demo Polish + Executive Presentation Layer.</p>
  </div>

  <div class="card">
    <h3>Why</h3>
    <ul>
      <li>Improves demo clarity safely.</li>
      <li>Strengthens product story.</li>
      <li>Does not open writer or real keyboard output.</li>
      <li>Does not deploy.</li>
    </ul>
  </div>

  <div class="card lock">
    <h3>Do Not Do Now</h3>
    <p>Real writer, real keyboard output, production parser, public deploy.</p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-cto-next-step-recommendation.html"), html, "utf8");
fs.writeFileSync(path.join(outDir, "y561-y570-cto-next-step-recommendation-report.json"), JSON.stringify(recommendation, null, 2), "utf8");

console.log("[Y561-Y570 PASS_CTO_RECOMMENDATION_READY]");
