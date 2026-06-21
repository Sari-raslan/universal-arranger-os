const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y581-y590", "y581-y590-executive-presentation-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-executive-presentation.html");

function fail(msg) {
  console.error("[Y581-Y590 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing executive report");
if (!fs.existsSync(htmlPath)) fail("Missing executive HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y581-Y590") fail("Wrong phase");
if (r.status !== "PASS_EXECUTIVE_PRESENTATION_READY") fail("Bad status");
if (r.presentationOnly !== true) fail("Not presentation only");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

const html = fs.readFileSync(htmlPath, "utf8");
for (const phrase of ["Real writer", "real keyboard output", "production parser", "deploy"]) {
  if (!html.toLowerCase().includes(phrase.toLowerCase())) fail("Missing safety phrase: " + phrase);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y581-y590", "y581-y590-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y581-Y590",
    status: "PASS",
    confirmed: [
      "EXECUTIVE_PRESENTATION_READY",
      "PRESENTATION_ONLY",
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

console.log("[Y581-Y590 SAFETY PASS]");
