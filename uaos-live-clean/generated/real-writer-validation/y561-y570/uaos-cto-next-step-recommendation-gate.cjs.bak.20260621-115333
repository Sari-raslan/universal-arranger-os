const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y561-y570", "y561-y570-cto-next-step-recommendation-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-cto-next-step-recommendation.html");

function fail(msg) {
  console.error("[Y561-Y570 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing CTO recommendation report");
if (!fs.existsSync(htmlPath)) fail("Missing CTO recommendation HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y561-Y570") fail("Wrong phase");
if (r.status !== "PASS_CTO_RECOMMENDATION_READY") fail("Bad status");
if (r.primaryRecommendation !== "UI_POLISH") fail("Bad primary recommendation");
if (!r.doNotDoNow.includes("REAL_WRITER")) fail("REAL_WRITER not blocked in recommendation");
if (!r.doNotDoNow.includes("PUBLIC_DEPLOY")) fail("PUBLIC_DEPLOY not blocked in recommendation");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y561-y570", "y561-y570-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y561-Y570",
    status: "PASS",
    confirmed: [
      "CTO_RECOMMENDATION_READY",
      "UI_POLISH_NEXT",
      "DRYRUN_IMPROVEMENTS_SECOND",
      "REAL_WRITER_BLOCKED",
      "PUBLIC_DEPLOY_BLOCKED",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y561-Y570 SAFETY PASS]");
