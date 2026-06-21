const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y331-y340", "y331-y340-cto-evidence-report.json");

function fail(msg) {
  console.error("[Y331-Y340 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing CTO report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y331-Y340") fail("Wrong phase");
if (r.status !== "PASS") fail("Report not PASS");
if (r.ctoVerdict !== "LOCAL_PROOF_OF_TECHNOLOGY_READY") fail("Bad CTO verdict");
if (h.writerImplementation !== false) fail("Writer not blocked");
if (h.realStyOutput !== false) fail("Real STY output not blocked");
if (h.productionParser !== false) fail("Production parser not blocked");
if (h.deploy !== false) fail("Deploy not blocked");
if (h.appJsxModified !== false) fail("App.jsx not blocked");

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y331-y340", "y331-y340-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y331-Y340",
    status: "PASS",
    confirmed: [
      "CTO_EVIDENCE_READY",
      "NO_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y331-Y340 SAFETY PASS]");
