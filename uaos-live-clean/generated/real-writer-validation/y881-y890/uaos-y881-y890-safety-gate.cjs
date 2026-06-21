const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y881-y890", "y881-y890-do-not-implement-gate-report.json");

function fail(msg){ console.error("[Y881-Y890 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing do-not-implement gate report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y881-Y890") fail("Wrong phase");
if (r.status !== "PASS_DO_NOT_IMPLEMENT_GATE_READY") fail("Bad status");

const g = r.doNotImplementGate || {};
if (g.gateState !== "ACTIVE") fail("Gate must be ACTIVE");
if (g.implementationAllowed !== "NO") fail("Implementation must be NO");
if (g.requiredInstruction !== "DO NOT IMPLEMENT UNTIL APPROVED") fail("Required instruction missing");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(appRoot, "specs", "pre-writer-governance"),
  path.join(appRoot, "reports", "pre-writer-governance"),
  path.join(appRoot, "public", "governance", "y861-y900")
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
  path.join(appRoot, "generated", "real-writer-validation", "y881-y890", "y881-y890-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y881-Y890",
    status: "PASS",
    confirmed: [
      "DO_NOT_IMPLEMENT_GATE_READY",
      "GATE_ACTIVE",
      "IMPLEMENTATION_ALLOWED_NO",
      "NO_WRITER_IMPLEMENTATION",
      "NO_REAL_WRITER",
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

console.log("[Y881-Y890 SAFETY PASS]");
