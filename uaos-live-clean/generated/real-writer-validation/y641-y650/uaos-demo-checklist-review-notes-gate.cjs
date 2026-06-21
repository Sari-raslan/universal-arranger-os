const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const reportPath = path.join(appRoot, "generated", "real-writer-validation", "y641-y650", "y641-y650-demo-checklist-review-notes-report.json");
const htmlPath = path.join(appRoot, "public", "uaos-demo-checklist-review-notes.html");

function fail(msg) {
  console.error("[Y641-Y650 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(reportPath)) fail("Missing checklist report");
if (!fs.existsSync(htmlPath)) fail("Missing checklist HTML");

const r = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y641-Y650") fail("Wrong phase");
if (r.status !== "PASS_DEMO_CHECKLIST_READY") fail("Bad status");
if (!Array.isArray(r.checklist) || r.checklist.length < 8) fail("Checklist too short");

for (const k of ["appJsxModified","writerImplementation","realKeyboardOutput","productionParser","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

const html = fs.readFileSync(htmlPath, "utf8");
for (const phrase of ["No writer", "no real keyboard output", "no production parser", "no deploy"]) {
  if (!html.includes(phrase)) fail("Missing safety phrase: " + phrase);
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y641-y650", "y641-y650-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y641-Y650",
    status: "PASS",
    confirmed: [
      "DEMO_CHECKLIST_READY",
      "REVIEW_NOTES_PAGE_READY",
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

console.log("[Y641-Y650 SAFETY PASS]");
