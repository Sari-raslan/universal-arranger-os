const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y811-y820", "y811-y820-final-conformance-test-design-report.json");

function fail(msg){ console.error("[Y811-Y820 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing final report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y811-Y820") fail("Wrong phase");
if (r.status !== "PASS_CONFORMANCE_TEST_DESIGN_READY_IMPLEMENTATION_BLOCKED") fail("Bad status");

const verdict = r.finalVerdict || {};
if (verdict.conformanceDesign !== "READY") fail("Conformance design not ready");
if (verdict.writer !== "BLOCKED") fail("Writer not blocked");
if (verdict.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (verdict.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (verdict.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (verdict.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (verdict.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (verdict.implementation !== "BLOCKED") fail("Implementation not blocked");

const s = r.safety || {};
if (s.writer !== "BLOCKED") fail("Safety writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Safety real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Safety production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Safety deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Safety fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.designOnly !== true) fail("Design only failed");

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

for (const file of [
  "public/governance/y781-y820/index.html",
  "public/governance/y781-y820/hw-sw-failure-modes.html",
  "public/governance/y781-y820/pass-fail-no-output-qa.html",
  "public/governance/y781-y820/final-conformance-report.html"
]) {
  if (!fs.existsSync(path.join(appRoot, file))) fail("Missing public page: " + file);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y811-y820", "y811-y820-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y811-Y820",
    status: "PASS",
    confirmed: [
      "CONFORMANCE_TEST_DESIGN_READY",
      "IMPLEMENTATION_BLOCKED",
      "NO_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES_TOUCH",
      "NO_APP_JSX",
      "NO_FORBIDDEN_OUTPUT_FILES_CREATED"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y811-Y820 FINAL SAFETY PASS]");
