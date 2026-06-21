const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const reportPath = path.join(base, "y681-y690", "y681-y690-qa-freeze-dashboard-handover-report.json");
const handoverPath = path.join(base, "y681-y690", "UAOS_LOCAL_QA_FREEZE_HANDOVER.md");
const htmlPath = path.join(appRoot, "public", "uaos-qa-freeze-dashboard.html");

function fail(msg) {
  console.error("[Y681-Y690 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing QA freeze report");
if (!fs.existsSync(handoverPath)) fail("Missing handover file");
if (!fs.existsSync(htmlPath)) fail("Missing QA freeze HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};
const f = r.finalState || {};
const handover = fs.readFileSync(handoverPath, "utf8");

if (r.phase !== "Y681-Y690") fail("Wrong phase");
if (r.status !== "PASS_QA_FREEZE_HANDOVER_READY") fail("Bad status");

if (f.writer !== "BLOCKED") fail("Writer not blocked");
if (f.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (f.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (f.deploy !== "BLOCKED") fail("Deploy not blocked");
if (f.appJsxModified !== false) fail("App.jsx flag failed");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

for (const phrase of ["Writer: BLOCKED", "Real keyboard output: BLOCKED", "Production parser: BLOCKED", "Deploy: BLOCKED", "Do not write .STY"]) {
  if (!handover.includes(phrase)) fail("Handover missing phrase: " + phrase);
}

fs.writeFileSync(
  path.join(base, "y681-y690", "y681-y690-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y681-Y690",
    status: "PASS",
    confirmed: [
      "QA_FREEZE_DASHBOARD_READY",
      "HANDOVER_SUMMARY_READY",
      "NO_APP_JSX",
      "NO_WRITER",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y681-Y690 SAFETY PASS]");
