const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y351-y360", "y351-y360-final-local-demo-gate-report.json");

function fail(msg) {
  console.error("[Y351-Y360 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing final local demo report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};
const f = r.finalState || {};

if (r.phase !== "Y351-Y360") fail("Wrong phase");
if (r.status !== "PASS_LOCAL_DEMO_READY") fail("Bad final status");
if (f.localDemo !== "READY") fail("Local demo not ready");
if (f.writer !== "HARD_LOCKED") fail("Writer not hard locked");
if (f.realStyOutput !== "HARD_LOCKED") fail("Real STY not hard locked");
if (f.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (f.deploy !== "BLOCKED") fail("Deploy not blocked");
if (h.appJsxModified !== false) fail("App.jsx flag failed");
if (h.writerImplementation !== false) fail("Writer flag failed");
if (h.realStyOutput !== false) fail("Real STY flag failed");
if (h.productionParser !== false) fail("Production parser flag failed");
if (h.deploy !== false) fail("Deploy flag failed");

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y351-y360", "y351-y360-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y351-Y360",
    status: "PASS",
    confirmed: [
      "LOCAL_DEMO_READY",
      "CTO_EVIDENCE_READY",
      "WRITER_ROADMAP_ONLY",
      "NO_APP_JSX",
      "NO_WRITER",
      "NO_REAL_STY_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y351-Y360 FINAL SAFETY PASS]");
