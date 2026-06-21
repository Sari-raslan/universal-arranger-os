const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y801-y810", "y801-y810-pass-fail-no-output-qa-report.json");

function fail(msg){ console.error("[Y801-Y810 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y801-Y810") fail("Wrong phase");
if (r.status !== "PASS_PASS_FAIL_NO_OUTPUT_QA_READY") fail("Bad status");

const s = r.safety || {};
if (s.writer !== "BLOCKED") fail("Writer not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.noOutputQa !== true) fail("No-output QA flag failed");

if (!Array.isArray(r.passFailCriteria.passCriteria) || r.passFailCriteria.passCriteria.length < 7) fail("Pass criteria too short");
if (!Array.isArray(r.passFailCriteria.failCriteria) || r.passFailCriteria.failCriteria.length < 8) fail("Fail criteria too short");
if (!Array.isArray(r.noOutputQaRules.noOutputRules) || r.noOutputQaRules.noOutputRules.length < 7) fail("No-output QA rules too short");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(appRoot, "specs", "conformance"),
  path.join(appRoot, "reports", "conformance"),
  path.join(appRoot, "public", "governance", "y781-y820")
];

function walk(dir, files=[]) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
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

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y801-y810", "y801-y810-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y801-Y810",
    status: "PASS",
    confirmed: [
      "PASS_FAIL_CRITERIA_DESIGN_READY",
      "NO_OUTPUT_QA_RULES_READY",
      "NO_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES_TOUCH",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y801-Y810 SAFETY PASS]");
