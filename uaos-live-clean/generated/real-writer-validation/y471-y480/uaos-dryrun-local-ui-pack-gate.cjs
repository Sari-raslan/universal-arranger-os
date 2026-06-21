const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y471-y480", "y471-y480-dryrun-local-ui-pack-report.json");

function fail(msg) {
  console.error("[Y471-Y480 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing UI pack report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y471-Y480") fail("Wrong phase");
if (r.status !== "PASS_LOCAL_UI_READY") fail("Bad status");
if (r.localUiOnly !== true) fail("Not local UI only");

for (const k of ["appJsxModified","fixtureCopy","fixtureModify","productionParser","realWriterImplementation","realKeyboardOutput","deploy"]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

for (const card of r.uiCards || []) {
  if (!card.badges.includes("DRY_RUN")) fail("Missing DRY_RUN badge");
  if (!card.badges.includes("NO_KEYBOARD_BINARY")) fail("Missing NO_KEYBOARD_BINARY badge");
  if (!card.badges.includes("NO_REAL_WRITER")) fail("Missing NO_REAL_WRITER badge");
}

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y471-y480", "y471-y480-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y471-Y480",
    status: "PASS",
    confirmed: [
      "LOCAL_UI_ONLY",
      "NO_APP_JSX",
      "NO_REAL_WRITER",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y471-Y480 SAFETY PASS]");
