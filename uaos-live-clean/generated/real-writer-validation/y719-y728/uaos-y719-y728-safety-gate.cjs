const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const commercialRoot = path.join(base, "commercial-readiness");

function fail(msg){ console.error("[Y719-Y728 GATE FAIL]", msg); process.exit(1); }
function load(name){ const p=path.join(commercialRoot,name); if(!fs.existsSync(p)) fail("Missing " + name); return JSON.parse(fs.readFileSync(p,"utf8")); }

const legal = load("legal-compliance.json");
const pricing = load("pricing-readiness.json");

if (legal.verdict !== "LEGAL_APPROVAL_BLOCKED") fail("Legal not blocked");
if (pricing.verdict !== "PAYMENTS_NOT_ENABLED") fail("Payments not blocked");
if (pricing.noPaymentsEnabled !== true) fail("Payments flag not true");

for (const r of [legal, pricing]) {
  const s = r.safety || {};
  if (s.writer !== "BLOCKED") fail("Writer not blocked");
  if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
  if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
  if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
  if (s.paymentActivation !== "NO") fail("Payment not disabled");
  if (s.appJsxModified !== false) fail("App.jsx flag failed");
}

for (const file of ["legal.html", "pricing.html"]) {
  if (!fs.existsSync(path.join(appRoot, "public", "commercial", file))) fail("Missing HTML " + file);
}

fs.writeFileSync(
  path.join(base, "y719-y728", "y719-y728-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y719-Y728",
    status: "PASS",
    confirmed: [
      "LEGAL_BLOCKERS_READY",
      "PRICING_DRAFT_READY",
      "LEGAL_APPROVAL_BLOCKED",
      "PAYMENTS_NOT_ENABLED",
      "NO_WRITER",
      "NO_REAL_KEYBOARD_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y719-Y728 SAFETY PASS]");
