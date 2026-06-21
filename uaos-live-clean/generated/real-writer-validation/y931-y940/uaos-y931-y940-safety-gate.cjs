const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const report = path.join(base, "y931-y940", "y931-y940-final-sandbox-phase0-gate-report.json");

function fail(msg){ console.error("[Y931-Y940 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing final sandbox gate report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y931-Y940") fail("Wrong phase");
if (r.status !== "PASS_SANDBOX_PHASE0_NO_OUTPUT_READY") fail("Bad status");

const g = r.finalGate || {};
if (g.sandboxPhase0 !== "READY") fail("Sandbox phase0 not ready");
if (g.outputAllowed !== "NO") fail("Output must not be allowed");
if (g.writerAllowed !== "NO") fail("Writer must not be allowed");
if (g.realWriterAllowed !== "NO") fail("Real writer must not be allowed");
if (g.realKeyboardOutputAllowed !== "NO") fail("Real output must not be allowed");
if (g.productionParserAllowed !== "NO") fail("Production parser must not be allowed");
if (g.deployAllowed !== "NO") fail("Deploy must not be allowed");
if (g.fixturesTouchAllowed !== "NO") fail("Fixtures touch must not be allowed");
if (g.appJsxModified !== false) fail("App.jsx flag failed");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.forbiddenKeyboardExtensions !== "BLOCKED") fail("Forbidden extensions not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("Safety App.jsx failed");
if (s.sandboxIsolated !== true) fail("Sandbox isolation failed");
if (s.outputAllowed !== false) fail("Safety output flag failed");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(base, "writer-sandbox-phase0-no-output"),
  path.join(appRoot, "reports", "writer-sandbox-phase0"),
  path.join(appRoot, "public", "governance", "y901-y940")
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
  "public/governance/y901-y940/index.html",
  "public/governance/y901-y940/no-output-harness-scanner.html",
  "public/governance/y901-y940/permission-rollback-monitor.html",
  "public/governance/y901-y940/final-sandbox-phase0-gate.html"
]) {
  if (!fs.existsSync(path.join(appRoot, file))) fail("Missing public page: " + file);
}

fs.writeFileSync(
  path.join(base, "y931-y940", "y931-y940-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y931-Y940",
    status: "PASS",
    confirmed: [
      "SANDBOX_PHASE0_NO_OUTPUT_READY",
      "SANDBOX_ISOLATED",
      "OUTPUT_ALLOWED_NO",
      "WRITER_ALLOWED_NO",
      "REAL_WRITER_ALLOWED_NO",
      "REAL_OUTPUT_ALLOWED_NO",
      "PRODUCTION_PARSER_ALLOWED_NO",
      "DEPLOY_ALLOWED_NO",
      "FIXTURES_TOUCH_ALLOWED_NO",
      "NO_APP_JSX",
      "NO_FORBIDDEN_OUTPUT_FILES_CREATED"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y931-Y940 FINAL SAFETY PASS]");
