const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const commercialRoot = path.join(base, "commercial-readiness");

function fail(msg){ console.error("[Y729-Y737 GATE FAIL]", msg); process.exit(1); }
function load(name){ const p=path.join(commercialRoot,name); if(!fs.existsSync(p)) fail("Missing " + name); return JSON.parse(fs.readFileSync(p,"utf8")); }

const support = load("support-readiness.json");
const blockers = load("release-blockers.json");

if (support.verdict !== "SUPPORT_NOT_APPROVED_FOR_LAUNCH") fail("Support not blocked");
if (blockers.verdict !== "PUBLIC_RELEASE_BLOCKED") fail("Release not blocked");
if (!Array.isArray(blockers.blockers) || blockers.blockers.length < 5) fail("Blocker matrix too short");

for (const r of [support, blockers]) {
  const s = r.safety || {};
  if (s.writer !== "BLOCKED") fail("Writer not blocked");
  if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
  if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
  if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
  if (s.paymentActivation !== "NO") fail("Payment not disabled");
  if (s.appJsxModified !== false) fail("App.jsx flag failed");
}

for (const file of ["support.html", "release-blockers.html"]) {
  if (!fs.existsSync(path.join(appRoot, "public", "commercial", file))) fail("Missing HTML " + file);
}

fs.writeFileSync(
  path.join(base, "y729-y737", "y729-y737-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y729-Y737",
    status: "PASS",
    confirmed: [
      "SUPPORT_READINESS_DRAFT_READY",
      "RELEASE_BLOCKER_MATRIX_READY",
      "PUBLIC_RELEASE_BLOCKED",
      "NO_WRITER",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_PAYMENT",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y729-Y737 SAFETY PASS]");
