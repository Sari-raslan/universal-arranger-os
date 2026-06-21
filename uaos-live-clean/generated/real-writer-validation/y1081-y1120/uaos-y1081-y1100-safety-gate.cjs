const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const report = path.join(base, "y1081-y1120", "y1081-y1100-final-master-index-report.json");

function fail(msg){ console.error("[Y1081-Y1100 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing final master index report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1081-Y1100") fail("Wrong phase");
if (r.status !== "PASS_FINAL_MASTER_INDEX_READY") fail("Bad status");

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
  path.join(appRoot, "reports", "final-handover"),
  path.join(appRoot, "public", "governance", "y1081-y1120")
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
  path.join(base, "y1081-y1120", "y1081-y1100-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1081-Y1100",
    status: "PASS",
    confirmed: [
      "FINAL_MASTER_INDEX_READY",
      "NO_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1081-Y1100 SAFETY PASS]");
