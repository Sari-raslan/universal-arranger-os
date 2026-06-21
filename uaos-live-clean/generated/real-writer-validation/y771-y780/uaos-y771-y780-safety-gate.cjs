const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y771-y780", "y777-y780-final-writer-spec-report.json");

function fail(msg){ console.error("[Y771-Y780 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing final report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y777-Y780") fail("Wrong phase");
if (r.status !== "PASS_WRITER_SPEC_READY_IMPLEMENTATION_BLOCKED") fail("Bad status");

const v = r.finalVerdict || {};
if (v.implementation !== "BLOCKED") fail("Implementation not blocked");
if (v.realWriterStatus !== "BLOCKED") fail("Real writer not blocked");
if (v.realKeyboardOutputStatus !== "BLOCKED") fail("Real output not blocked");
if (v.productionParserStatus !== "BLOCKED") fail("Production parser not blocked");
if (v.deployPublicReleaseStatus !== "BLOCKED") fail("Deploy not blocked");
if (v.writerImplementationBlockerGate !== "ACTIVE") fail("Blocker gate not active");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation safety failed");
if (s.realWriter !== "BLOCKED") fail("Real writer safety failed");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output safety failed");
if (s.productionParser !== "BLOCKED") fail("Production parser safety failed");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy safety failed");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures safety failed");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.specOnly !== true) fail("Spec only failed");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(appRoot, "specs", "writer"),
  path.join(appRoot, "reports", "writer"),
  path.join(appRoot, "public", "writer")
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
  path.join(appRoot, "generated", "real-writer-validation", "y771-y780", "y771-y780-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y771-Y780",
    status: "PASS",
    confirmed: [
      "WRITER_SPEC_READY",
      "IMPLEMENTATION_BLOCKED",
      "REAL_WRITER_BLOCKED",
      "REAL_KEYBOARD_OUTPUT_BLOCKED",
      "PRODUCTION_PARSER_BLOCKED",
      "DEPLOY_BLOCKED",
      "FIXTURES_TOUCH_BLOCKED",
      "NO_APP_JSX",
      "NO_FORBIDDEN_OUTPUT_FILES_CREATED"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y771-Y780 FINAL SAFETY PASS]");
