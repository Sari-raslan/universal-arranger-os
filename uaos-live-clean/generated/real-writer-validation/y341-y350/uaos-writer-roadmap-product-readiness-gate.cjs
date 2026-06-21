const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y341-y350", "y341-y350-writer-roadmap-product-readiness-report.json");

function fail(msg) {
  console.error("[Y341-Y350 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing roadmap report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y341-Y350") fail("Wrong phase");
if (r.status !== "PASS") fail("Report not PASS");
if (h.roadmapOnly !== true) fail("Not roadmap-only");
if (h.writerImplementation !== false) fail("Writer not blocked");
if (h.realStyOutput !== false) fail("Real STY output not blocked");
if (h.productionParser !== false) fail("Production parser not blocked");
if (h.deploy !== false) fail("Deploy not blocked");
if (h.appJsxModified !== false) fail("App.jsx not blocked");

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y341-y350", "y341-y350-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y341-Y350",
    status: "PASS",
    confirmed: [
      "ROADMAP_ONLY",
      "LOCAL_DEMO_READY",
      "COMMERCIAL_NOT_READY",
      "NO_WRITER",
      "NO_REAL_STY_OUTPUT",
      "NO_DEPLOY"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y341-Y350 SAFETY PASS]");
