const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const report = path.join(base, "y1081-y1120", "y1101-y1120-final-handover-freeze-report.json");

function fail(msg){ console.error("[Y1101-Y1120 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing final handover freeze report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1101-Y1120") fail("Wrong phase");
if (r.status !== "PASS_FINAL_HANDOVER_FREEZE_READY") fail("Bad status");

const c = r.finalClosure || {};
if (c.finalVerdict !== "SAFE_LOCAL_PROOF_AND_SANDBOX_GOVERNANCE_COMPLETE_NO_OUTPUT") fail("Final verdict incorrect");

const st = c.finalState || {};
if (st.finalHandoverFreeze !== "READY") fail("Final handover freeze not ready");
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
if (s.writerImplementation !== "BLOCKED") fail("Safety writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Safety real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Safety real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Safety production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Safety deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Safety fixtures not blocked");
if (s.appJsxModified !== false) fail("Safety App.jsx failed");
if (s.outputAllowed !== false) fail("Safety output flag failed");

for (const file of [
  "public/governance/final-master-index.html",
  "public/governance/final-handover-freeze.html",
  "public/governance/y1081-y1120/final-master-index.html",
  "public/governance/y1081-y1120/final-handover-freeze.html",
  "reports/final-handover/UAOS_FINAL_HANDOVER_FREEZE.md"
]) {
  if (!fs.existsSync(path.join(appRoot, file))) fail("Missing file: " + file);
}

fs.writeFileSync(
  path.join(base, "y1081-y1120", "y1101-y1120-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1101-Y1120",
    status: "PASS",
    confirmed: [
      "FINAL_HANDOVER_FREEZE_READY",
      "SAFE_LOCAL_PROOF_AND_SANDBOX_GOVERNANCE_COMPLETE_NO_OUTPUT",
      "MASTER_INDEX_READY",
      "NO_OUTPUT",
      "WRITER_BLOCKED",
      "REAL_WRITER_BLOCKED",
      "REAL_OUTPUT_BLOCKED",
      "PRODUCTION_PARSER_BLOCKED",
      "DEPLOY_BLOCKED",
      "FIXTURES_BLOCKED",
      "NO_APP_JSX",
      "COMMERCIAL_PRODUCT_NO"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1101-Y1120 FINAL SAFETY PASS]");
