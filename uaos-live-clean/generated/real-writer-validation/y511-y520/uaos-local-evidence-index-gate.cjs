const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y511-y520", "y511-y520-local-evidence-index-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-local-evidence-index.html");

function fail(msg) {
  console.error("[Y511-Y520 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing index report");
if (!fs.existsSync(htmlPath)) fail("Missing public evidence index HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y511-Y520") fail("Wrong phase");
if (r.status !== "PASS_INDEX_CREATED") fail("Bad status");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

const html = fs.readFileSync(htmlPath, "utf8");
for (const phrase of ["Real writer: BLOCKED", "Real keyboard output: BLOCKED", "Production parser: BLOCKED", "Deploy: BLOCKED"]) {
  if (!html.includes(phrase)) fail("Missing safety phrase: " + phrase);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y511-y520", "y511-y520-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y511-Y520",
    status: "PASS",
    confirmed: [
      "PUBLIC_INDEX_CREATED",
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

console.log("[Y511-Y520 SAFETY PASS]");
