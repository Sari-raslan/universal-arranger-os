const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const commercialRoot = path.join(base, "commercial-readiness");

function fail(msg){ console.error("[Y701-Y710 GATE FAIL]", msg); process.exit(1); }
function load(name){ const p=path.join(commercialRoot,name); if(!fs.existsSync(p)) fail("Missing " + name); return JSON.parse(fs.readFileSync(p,"utf8")); }

const files = [
  path.join(appRoot, "public", "commercial", "index.html"),
  path.join(appRoot, "public", "commercial", "positioning.html")
];
for (const f of files) if (!fs.existsSync(f)) fail("Missing HTML " + f);

const dashboard = load("dashboard.json");
const positioning = load("positioning.json");

if (dashboard.verdict !== "COMMERCIAL_LAUNCH_BLOCKED") fail("Commercial launch not blocked");
if (dashboard.safety.writer !== "BLOCKED") fail("Writer not blocked");
if (dashboard.safety.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (dashboard.safety.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (dashboard.safety.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (dashboard.safety.paymentActivation !== "NO") fail("Payment not disabled");
if (dashboard.safety.appJsxModified !== false) fail("App.jsx flag failed");

const banned = positioning.bannedClaims.join(" ").toLowerCase();
for (const phrase of ["commercially ready","shipping now","available to customers","production-ready release"]) {
  if (!banned.includes(phrase)) fail("Missing banned claim: " + phrase);
}

fs.writeFileSync(
  path.join(base, "y701-y710", "y701-y710-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y701-Y710",
    status: "PASS",
    confirmed: [
      "COMMERCIAL_DASHBOARD_READY",
      "POSITIONING_READY",
      "COMMERCIAL_LAUNCH_BLOCKED",
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

console.log("[Y701-Y710 SAFETY PASS]");
