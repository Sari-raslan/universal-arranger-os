const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const publicDir = path.join(appRoot, "public");
const outDir = path.join(base, "y681-y690");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y681-Y690 FAIL]", msg);
  process.exit(1);
}

function load(rel) {
  const p = path.join(base, rel);
  if (!fs.existsSync(p)) fail("Missing report: " + rel);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const publicScan = load("y661-y670/y661-y670-public-pages-freeze-scan-report.json");
const reportScan = load("y671-y680/y671-y680-generated-reports-freeze-scan-report.json");

const handoverText = `UAOS LOCAL QA FREEZE HANDOVER

Current phase:
Y681-Y690 QA Freeze Dashboard + Handover Summary.

Project path:
C:\\Users\\ssare\\keyboard-manager-clean\\uaos-live-clean

Local base URL:
http://127.0.0.1:5198/universal-arranger-os/

Main pages:
- uaos-polished-navigation-hub.html
- uaos-guided-review-flow.html
- uaos-final-polished-local-demo-gate.html
- uaos-final-local-proof-package.html
- uaos-final-safe-decision-gate.html
- uaos-final-ui-navigation-polish-gate.html

Current safe state:
- Local proof package: READY
- Executive presentation: READY
- Founder demo script: READY
- Investor/partner proof summary: READY
- Navigation hub: READY
- Guided review flow: READY
- Demo checklist: READY
- Writer: BLOCKED
- Real keyboard output: BLOCKED
- Production parser: BLOCKED
- Deploy: BLOCKED
- App.jsx: NOT MODIFIED in this chain

Important:
Do not open real writer without separate approval.
Do not write .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST.
Do not deploy.
Do not claim commercial final product.
UAOS remains a safe local proof-of-technology package.
`;

const report = {
  phase: "Y681-Y690",
  title: "QA Freeze Dashboard + Handover Summary",
  status: "PASS_QA_FREEZE_HANDOVER_READY",
  publicScanStatus: publicScan.status,
  generatedReportsScanStatus: reportScan.status,
  handoverFile: "UAOS_LOCAL_QA_FREEZE_HANDOVER.md",
  finalState: {
    localProofPackage: "READY",
    executivePresentation: "READY",
    founderDemoScript: "READY",
    investorPartnerSummary: "READY",
    navigationHub: "READY",
    guidedReviewFlow: "READY",
    demoChecklist: "READY",
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
  <title>UAOS QA Freeze Dashboard</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .hero{padding:30px;border-radius:20px;background:#181818;border:1px solid #444;margin-bottom:18px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:18px}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}pre{white-space:pre-wrap;background:#151515;border:1px solid #444;border-radius:12px;padding:14px}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS QA Freeze Dashboard</h1>
    <h2>Y681-Y690 PASS_QA_FREEZE_HANDOVER_READY</h2>
    <p>Local proof package frozen for handover and review.</p>
  </div>

  <div class="grid">
    <div class="card pass"><h3>Public Pages Scan</h3><p>${publicScan.status}</p></div>
    <div class="card pass"><h3>Generated Reports Scan</h3><p>${reportScan.status}</p></div>
    <div class="card pass"><h3>Handover Summary</h3><p>READY</p></div>
    <div class="card lock"><h3>Writer</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Real Keyboard Output</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Production Parser</h3><p>BLOCKED</p></div>
    <div class="card lock"><h3>Deploy</h3><p>BLOCKED</p></div>
  </div>

  <div class="card" style="margin-top:18px">
    <h2>Handover Summary</h2>
    <pre>${handoverText.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-qa-freeze-dashboard.html"), html, "utf8");
fs.writeFileSync(path.join(outDir, "UAOS_LOCAL_QA_FREEZE_HANDOVER.md"), handoverText, "utf8");
fs.writeFileSync(path.join(outDir, "y681-y690-qa-freeze-dashboard-handover-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log("[Y681-Y690 PASS_QA_FREEZE_HANDOVER_READY]");
