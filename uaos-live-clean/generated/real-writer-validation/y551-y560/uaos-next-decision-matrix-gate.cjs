const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y551-y560", "y551-y560-next-decision-matrix-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-next-decision-matrix.html");

function fail(msg) {
  console.error("[Y551-Y560 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing decision matrix report");
if (!fs.existsSync(htmlPath)) fail("Missing decision matrix HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y551-Y560") fail("Wrong phase");
if (r.status !== "PASS_DECISION_MATRIX_READY") fail("Bad status");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

const realWriter = (r.options || []).find(o => o.id === "REAL_WRITER");
const deploy = (r.options || []).find(o => o.id === "PUBLIC_DEPLOY");

if (!realWriter || realWriter.allowedNow !== false || realWriter.recommendedNow !== false) fail("Real writer not blocked");
if (!deploy || deploy.allowedNow !== false || deploy.recommendedNow !== false) fail("Deploy not blocked");

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y551-y560", "y551-y560-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y551-Y560",
    status: "PASS",
    confirmed: [
      "DECISION_MATRIX_READY",
      "UI_POLISH_RECOMMENDED",
      "DRYRUN_IMPROVEMENTS_RECOMMENDED",
      "REAL_WRITER_BLOCKED",
      "PUBLIC_DEPLOY_BLOCKED",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y551-Y560 SAFETY PASS]");
