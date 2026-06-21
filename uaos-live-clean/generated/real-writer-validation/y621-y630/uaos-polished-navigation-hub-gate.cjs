const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y621-y630", "y621-y630-polished-navigation-hub-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-polished-navigation-hub.html");

function fail(msg) {
  console.error("[Y621-Y630 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing navigation report");
if (!fs.existsSync(htmlPath)) fail("Missing navigation HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y621-Y630") fail("Wrong phase");
if (!String(r.status).startsWith("PASS_NAVIGATION_HUB_READY")) fail("Bad status");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

const html = fs.readFileSync(htmlPath, "utf8");
for (const phrase of ["Writer: BLOCKED", "Real keyboard output: BLOCKED", "Production parser: BLOCKED", "Deploy: BLOCKED"]) {
  if (!html.includes(phrase)) fail("Missing safety phrase: " + phrase);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y621-y630", "y621-y630-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y621-Y630",
    status: "PASS",
    confirmed: [
      "POLISHED_NAVIGATION_HUB_READY",
      "PUBLIC_HTML_ONLY",
      "NO_APP_JSX",
      "NO_WRITER",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y621-Y630 SAFETY PASS]");
