const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const report = path.join(base, "y1001-y1020", "y1001-y1020-readonly-simulator-core-report.json");

function fail(msg){ console.error("[Y1001-Y1020 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing simulator report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1001-Y1020") fail("Wrong phase");
if (r.status !== "PASS_READONLY_SIMULATOR_CORE_READY") fail("Bad status");
if (r.allRejectedCorrectly !== true) fail("Rejection matrix failed");
if (!Array.isArray(r.mismatches) || r.mismatches.length !== 0) fail("Mismatches found");

for (const item of r.results) {
  if (item.outputCreated !== false) fail("Output created by simulator");
  if (item.writerTouched !== false) fail("Writer touched by simulator");
  if (item.parserTouched !== false) fail("Parser touched by simulator");
  if (item.fixturesTouched !== false) fail("Fixtures touched by simulator");
  if (item.appJsxTouched !== false) fail("App.jsx touched by simulator");
}

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.outputAllowed !== false) fail("Output flag failed");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(base, "writer-sandbox-phase0-no-output"),
  path.join(appRoot, "reports", "writer-sandbox-phase0"),
  path.join(appRoot, "public", "governance", "y1001-y1080")
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
  path.join(base, "y1001-y1020", "y1001-y1020-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1001-Y1020",
    status: "PASS",
    confirmed: [
      "READONLY_SIMULATOR_CORE_READY",
      "FORBIDDEN_REQUESTS_REJECTED",
      "NO_OUTPUT_CREATED",
      "NO_WRITER_TOUCHED",
      "NO_PARSER_TOUCHED",
      "NO_FIXTURES_TOUCHED",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1001-Y1020 SAFETY PASS]");
