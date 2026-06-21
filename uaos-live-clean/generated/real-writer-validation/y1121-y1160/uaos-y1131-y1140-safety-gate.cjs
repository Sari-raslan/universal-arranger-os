const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y1121-y1160", "y1131-y1140-ready-blocked-report.json");

function fail(msg){ console.error("[Y1131-Y1140 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing ready/blocked report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1131-Y1140") fail("Wrong phase");
if (r.status !== "PASS_READY_BLOCKED_DOC_READY") fail("Bad status");

const blocked = r.readyBlocked.blocked.map(x => x.item);
for (const required of ["Writer implementation","Real writer","Real keyboard output","Production parser","Deploy/public release","Fixtures read/copy/modify","App.jsx modification"]) {
  if (!blocked.includes(required)) fail("Missing blocked item: " + required);
}

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.outputAllowed !== false) fail("Output flag failed");

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y1121-y1160", "y1131-y1140-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1131-Y1140",
    status: "PASS",
    confirmed: ["READY_BLOCKED_DOC_READY","BLOCKED_SCOPE_CONFIRMED","NO_WRITER","NO_OUTPUT","NO_PARSER","NO_DEPLOY","NO_FIXTURES","NO_APP_JSX"],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1131-Y1140 SAFETY PASS]");
