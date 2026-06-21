const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y381-y390", "y381-y390-destructive-write-blocker-report.json");

function fail(msg) {
  console.error("[Y381-Y390 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing blocker report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y381-Y390") fail("Wrong phase");
if (r.status !== "PASS_ALL_DESTRUCTIVE_WRITES_BLOCKED") fail("Bad status");
if (r.destructiveWritesBlocked !== true) fail("Destructive writes not blocked");

for (const k of [
  "appJsxModified",
  "writerImplementation",
  "realStyOutput",
  "realKeyboardOutput",
  "productionParser",
  "fixtureModification",
  "fixtureCopy",
  "destructiveWrites",
  "deploy"
]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y381-y390", "y381-y390-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y381-Y390",
    status: "PASS",
    confirmed: [
      "DESTRUCTIVE_WRITES_BLOCKED",
      "FIXTURE_WRITES_BLOCKED",
      "REAL_OUTPUTS_BLOCKED",
      "WRITER_BLOCKED",
      "DEPLOY_BLOCKED"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y381-Y390 FINAL SAFETY PASS]");
