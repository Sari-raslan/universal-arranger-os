const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y1161-y1200", "y1171-y1180-review-navigation-index-report.json");

function fail(msg){ console.error("[Y1171-Y1180 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing navigation index report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1171-Y1180") fail("Wrong phase");
if (r.status !== "PASS_REVIEW_NAVIGATION_INDEX_READY") fail("Bad status");
if (!Array.isArray(r.links) || r.links.length < 8) fail("Too few navigation links");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.outputAllowed !== false) fail("Output flag failed");

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y1161-y1200", "y1171-y1180-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1171-Y1180",
    status: "PASS",
    confirmed: [
      "REVIEW_NAVIGATION_INDEX_READY",
      "NO_WRITER",
      "NO_OUTPUT",
      "NO_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1171-Y1180 SAFETY PASS]");
