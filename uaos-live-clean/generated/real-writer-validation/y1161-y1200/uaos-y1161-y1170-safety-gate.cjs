const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y1161-y1200", "y1161-y1170-repository-readme-report.json");

function fail(msg){ console.error("[Y1161-Y1170 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing repository README report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1161-Y1170") fail("Wrong phase");
if (r.status !== "PASS_REPOSITORY_README_PRESENTATION_READY") fail("Bad status");

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

if (!fs.existsSync(path.join(appRoot, "README_SAFE_REVIEW.md"))) fail("README_SAFE_REVIEW.md missing");

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y1161-y1200", "y1161-y1170-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1161-Y1170",
    status: "PASS",
    confirmed: [
      "REPOSITORY_README_PRESENTATION_READY",
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

console.log("[Y1161-Y1170 SAFETY PASS]");
