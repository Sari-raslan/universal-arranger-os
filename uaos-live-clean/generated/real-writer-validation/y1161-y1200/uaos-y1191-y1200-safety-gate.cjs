const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation", "y1161-y1200");
const report = path.join(base, "y1161-y1200-final-repository-presentation-report.json");

function fail(msg){ console.error("[Y1191-Y1200 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing final repository presentation report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1161-Y1200") fail("Wrong phase");
if (r.status !== "PASS_REPOSITORY_PRESENTATION_AND_NO_FURTHER_CODE_GATE_READY") fail("Bad status");

const gate = r.gate || {};
if (gate.gateState !== "ACTIVE") fail("No-further-code gate must be ACTIVE");
if (gate.finalRule !== "NO_FURTHER_CODE_WITHOUT_EXPLICIT_APPROVAL") fail("Final rule wrong");

const st = gate.finalState || {};
if (st.repositoryPresentation !== "READY") fail("Repository presentation not ready");
if (st.reviewNavigation !== "READY") fail("Review navigation not ready");
if (st.presentationAudit !== "CLEAN") fail("Presentation audit not clean");
if (st.noFurtherCodeGate !== "ACTIVE") fail("No further code gate not active");
if (st.outputAllowed !== "NO") fail("Output must be NO");
if (st.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (st.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (st.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (st.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (st.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (st.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (st.appJsxModified !== false) fail("App.jsx flag failed");
if (st.commercialProduct !== "NO") fail("Commercial product must be NO");

const s = r.safety || {};
if (s.noFurtherCodeWithoutApproval !== true) fail("No further code flag failed");

for (const file of [
  "README_SAFE_REVIEW.md",
  "public/governance/y1161-y1200/repository-readme.html",
  "public/governance/y1161-y1200/review-navigation-index.html",
  "public/governance/y1161-y1200/presentation-audit.html",
  "public/governance/y1161-y1200/no-further-code-gate.html",
  "public/governance/y1161-y1200/final-review-hub.html",
  "public/governance/final-review-hub.html"
]) {
  if (!fs.existsSync(path.join(appRoot, file))) fail("Missing file: " + file);
}

fs.writeFileSync(
  path.join(base, "y1191-y1200-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1191-Y1200",
    status: "PASS",
    confirmed: [
      "NO_FURTHER_CODE_WITHOUT_APPROVAL_GATE_ACTIVE",
      "REPOSITORY_PRESENTATION_READY",
      "FINAL_REVIEW_HUB_READY",
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

console.log("[Y1191-Y1200 FINAL SAFETY PASS]");
