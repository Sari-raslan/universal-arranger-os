const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y321-y330", "y321-y330-local-product-demo-dashboard-report.json");

function fail(msg) {
  console.error("[Y321-Y330 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing demo dashboard report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y321-Y330") fail("Wrong phase");
if (r.status !== "PASS") fail("Report not PASS");
if (r.localDemoOnly !== true) fail("Not local-demo-only");
if (h.appJsxModified !== false) fail("App.jsx modification not blocked");
if (h.writerImplementation !== false) fail("Writer not blocked");
if (h.realStyOutput !== false) fail("Real STY output not blocked");
if (h.productionParser !== false) fail("Production parser not blocked");
if (h.deploy !== false) fail("Deploy not blocked");

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y321-y330", "y321-y330-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y321-Y330",
    status: "PASS",
    confirmed: [
      "LOCAL_DEMO_ONLY",
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

console.log("[Y321-Y330 SAFETY PASS]");
