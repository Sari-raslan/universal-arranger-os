const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const reportPath = path.join(base, "commercial-readiness", "customer-segments.json");
const htmlPath = path.join(appRoot, "public", "commercial", "customer-segments.html");

function fail(msg){ console.error("[Y711-Y718 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(reportPath)) fail("Missing customer segments report");
if (!fs.existsSync(htmlPath)) fail("Missing customer segments HTML");

const r = JSON.parse(fs.readFileSync(reportPath,"utf8"));
if (r.phase !== "Y711-Y718") fail("Wrong phase");
if (r.status !== "PASS_SEGMENT_READINESS_REVIEW_READY") fail("Bad status");
if (r.overallVerdict !== "COMMERCIAL_USE_BLOCKED") fail("Commercial use not blocked");
if (!Array.isArray(r.segments) || r.segments.length !== 3) fail("Expected 3 segments");

const safety = r.safety || {};
for (const [k,v] of Object.entries({
  writer: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  paymentActivation: "NO",
  commercialProduct: "NO"
})) {
  if (safety[k] !== v) fail("Safety failed: " + k);
}
if (safety.appJsxModified !== false) fail("App.jsx flag failed");

fs.writeFileSync(
  path.join(base, "y711-y718", "y711-y718-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y711-Y718",
    status: "PASS",
    confirmed: [
      "CUSTOMER_SEGMENTS_READY",
      "COMMERCIAL_USE_BLOCKED",
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

console.log("[Y711-Y718 SAFETY PASS]");
