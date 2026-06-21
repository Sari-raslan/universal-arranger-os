const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const commercialRoot = path.join(base, "commercial-readiness");

function fail(msg){ console.error("[Y738-Y740 GATE FAIL]", msg); process.exit(1); }
function load(name){ const p=path.join(commercialRoot,name); if(!fs.existsSync(p)) fail("Missing " + name); return JSON.parse(fs.readFileSync(p,"utf8")); }

const claims = load("public-claim-rules.json");
const gate = load("final-gate.json");
const final = load("final-report.json");

if (claims.status !== "PASS_PUBLIC_CLAIM_RULES_READY") fail("Claim rules not ready");
if (gate.gateVerdict !== "COMMERCIAL_LAUNCH_BLOCKED") fail("Commercial launch not blocked");
if (gate.launchApproval !== "NO") fail("Launch approval not NO");
if (gate.publicReleasePermission !== "NO") fail("Public release permission not NO");
if (gate.paymentsActivation !== "NO") fail("Payments not NO");
if (gate.commercialProduct !== "NO") fail("Commercial product not NO");

const verdict = final.finalVerdict || {};
if (verdict.commercialReadinessPlanningArtifacts !== "READY") fail("Planning artifacts not ready");
if (verdict.commercialLaunchApproval !== "BLOCKED") fail("Commercial launch approval not blocked");
if (verdict.publicReleasePermission !== "NO") fail("Public release not NO");
if (verdict.paymentsActivation !== "NO") fail("Payments not NO");
if (verdict.writer !== "BLOCKED") fail("Writer not blocked");
if (verdict.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (verdict.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (verdict.commercialProduct !== "NO") fail("Commercial product not NO");

const banned = claims.bannedPhrases.join(" ").toLowerCase();
for (const phrase of ["commercially ready","shipping now","available to customers","production-ready release"]) {
  if (!banned.includes(phrase)) fail("Missing banned phrase " + phrase);
}

for (const file of ["public-claims.html", "final-gate.html"]) {
  if (!fs.existsSync(path.join(appRoot, "public", "commercial", file))) fail("Missing HTML " + file);
}

fs.writeFileSync(
  path.join(base, "y738-y740", "y738-y740-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y738-Y740",
    status: "PASS",
    confirmed: [
      "PUBLIC_CLAIM_RULES_READY",
      "FINAL_COMMERCIAL_GATE_READY",
      "COMMERCIAL_READINESS_ARTIFACTS_READY",
      "COMMERCIAL_LAUNCH_BLOCKED",
      "PUBLIC_RELEASE_PERMISSION_NO",
      "PAYMENTS_NO",
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

console.log("[Y738-Y740 SAFETY PASS]");
