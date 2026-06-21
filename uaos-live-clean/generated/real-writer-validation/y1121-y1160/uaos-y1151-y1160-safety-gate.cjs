const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation", "y1121-y1160");
const report = path.join(base, "y1121-y1160-final-public-review-pack-report.json");

function fail(msg){ console.error("[Y1151-Y1160 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing final public review pack report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1121-Y1160") fail("Wrong phase");
if (r.status !== "PASS_PUBLIC_REVIEW_UI_DOCS_READY") fail("Bad status");

const st = r.finalPack.finalState || {};
if (st.executiveOverview !== "READY") fail("Executive overview not ready");
if (st.readyBlocked !== "READY") fail("Ready/blocked not ready");
if (st.ctoHandoverSummary !== "READY") fail("CTO handover not ready");
if (st.nextDecisionOptions !== "READY") fail("Next decision options not ready");
if (st.publicReviewIndex !== "READY") fail("Public review index not ready");
if (st.outputAllowed !== "NO") fail("Output must be NO");
if (st.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (st.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (st.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (st.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (st.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (st.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (st.appJsxModified !== false) fail("App.jsx flag failed");

const s = r.safety || {};
if (s.docsOnly !== true) fail("Docs-only flag failed");
if (s.outputAllowed !== false) fail("Safety output flag failed");
if (s.commercialProduct !== "NO") fail("Commercial product must be NO");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(appRoot, "reports", "public-review-docs"),
  path.join(appRoot, "public", "governance", "y1121-y1160")
];

function walk(dir, files=[]) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const stt = fs.statSync(p);
    if (stt.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

for (const root of roots) {
  for (const file of walk(root)) {
    const ext = path.extname(file).toLowerCase();
    if (forbiddenOutputExt.includes(ext)) fail("Forbidden output file exists: " + file);
  }
}

for (const file of [
  "public/governance/y1121-y1160/executive-overview.html",
  "public/governance/y1121-y1160/ready-blocked.html",
  "public/governance/y1121-y1160/cto-handover-summary.html",
  "public/governance/y1121-y1160/next-decision-options.html",
  "public/governance/y1121-y1160/public-review-index.html",
  "public/governance/public-review-index.html"
]) {
  if (!fs.existsSync(path.join(appRoot, file))) fail("Missing page: " + file);
}

fs.writeFileSync(
  path.join(base, "y1151-y1160-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1151-Y1160",
    status: "PASS",
    confirmed: [
      "NEXT_DECISION_OPTIONS_READY",
      "PUBLIC_REVIEW_INDEX_READY",
      "PUBLIC_REVIEW_UI_DOCS_READY",
      "NO_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES",
      "NO_APP_JSX",
      "COMMERCIAL_PRODUCT_NO"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1151-Y1160 FINAL SAFETY PASS]");
