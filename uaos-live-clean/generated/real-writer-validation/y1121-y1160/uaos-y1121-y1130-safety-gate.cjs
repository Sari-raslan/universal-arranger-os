const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y1121-y1160", "y1121-y1130-executive-overview-report.json");

function fail(msg){ console.error("[Y1121-Y1130 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing executive overview report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1121-Y1130") fail("Wrong phase");
if (r.status !== "PASS_EXECUTIVE_OVERVIEW_READY") fail("Bad status");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.outputAllowed !== false) fail("Output flag failed");
if (s.docsOnly !== true) fail("Docs-only flag failed");
if (s.commercialProduct !== "NO") fail("Commercial product must be NO");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(appRoot, "reports", "public-review-docs"),
  path.join(appRoot, "public", "governance", "y1121-y1160")
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
  path.join(appRoot, "generated", "real-writer-validation", "y1121-y1160", "y1121-y1130-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1121-Y1130",
    status: "PASS",
    confirmed: ["EXECUTIVE_OVERVIEW_READY","NO_WRITER","NO_REAL_OUTPUT","NO_PARSER","NO_DEPLOY","NO_FIXTURES","NO_APP_JSX"],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1121-Y1130 SAFETY PASS]");
