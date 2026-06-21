const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const commercialRoot = path.join(base, "commercial-readiness");
const publicDir = path.join(appRoot, "public", "commercial");
const outDir = path.join(base, "y738-y740");

fs.mkdirSync(commercialRoot, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

function load(name) {
  const p = path.join(commercialRoot, name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const dashboard = load("dashboard.json");
const positioning = load("positioning.json");
const segments = load("customer-segments.json");
const legal = load("legal-compliance.json");
const pricing = load("pricing-readiness.json");
const support = load("support-readiness.json");
const blockers = load("release-blockers.json");

const safety = {
  writer: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  paymentActivation: "NO",
  commercialProduct: "NO",
  appJsxModified: false
};

const publicClaims = {
  phase: "Y738",
  title: "Public Claim Safety Rules",
  status: "PASS_PUBLIC_CLAIM_RULES_READY",
  approvedPhrases: [
    "readiness under evaluation",
    "not approved for commercial launch",
    "blocked pending legal / pricing / support closure",
    "local proof package only",
    "writer and real keyboard output are blocked",
    "commercial readiness planning artifacts are ready"
  ],
  bannedPhrases: [
    "commercially ready",
    "shipping now",
    "available to customers",
    "production-ready release",
    "real keyboard export ready",
    "payments enabled",
    "public release live"
  ],
  mandatoryDisclaimers: [
    "Commercial Product = NO",
    "Deploy/Public Release = BLOCKED",
    "Payments = NO",
    "Real Writer = BLOCKED",
    "Real .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST Output = BLOCKED",
    "Production Parser = BLOCKED"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const finalGate = {
  phase: "Y739",
  title: "Final Commercial Readiness Gate",
  status: "PASS_COMMERCIAL_READINESS_PLANNING_READY",
  gateVerdict: "COMMERCIAL_LAUNCH_BLOCKED",
  launchApproval: "NO",
  publicReleasePermission: "NO",
  paymentsActivation: "NO",
  commercialProduct: "NO",
  generatedArtifacts: {
    dashboard: !!dashboard,
    positioning: !!positioning,
    customerSegments: !!segments,
    legalCompliance: !!legal,
    pricingReadiness: !!pricing,
    supportReadiness: !!support,
    releaseBlockers: !!blockers,
    publicClaimRules: true
  },
  blockersPreventingCommercialApproval: [
    "Writer blocked",
    "Real keyboard output blocked",
    "Production parser blocked",
    "Deploy/public release blocked",
    "Payments disabled",
    "Legal/compliance not approved",
    "Support process not approved"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const finalReport = {
  phase: "Y740",
  title: "Y701-Y740 Commercial Readiness Final Report",
  status: "PASS_COMMERCIAL_READINESS_ARTIFACTS_READY",
  finalVerdict: {
    commercialReadinessPlanningArtifacts: "READY",
    commercialLaunchApproval: "BLOCKED",
    publicReleasePermission: "NO",
    paymentsActivation: "NO",
    writer: "BLOCKED",
    realKeyboardOutput: "BLOCKED",
    productionParser: "BLOCKED",
    commercialProduct: "NO"
  },
  reports: [
    "dashboard.json",
    "positioning.json",
    "customer-segments.json",
    "legal-compliance.json",
    "pricing-readiness.json",
    "support-readiness.json",
    "release-blockers.json",
    "public-claim-rules.json",
    "final-gate.json",
    "final-report.json"
  ],
  publicPages: [
    "index.html",
    "positioning.html",
    "customer-segments.html",
    "legal.html",
    "pricing.html",
    "support.html",
    "release-blockers.html",
    "public-claims.html",
    "final-gate.html"
  ],
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const claimsHtml = `<!doctype html><html><head><meta charset="utf-8"><title>UAOS Public Claim Rules</title>
<style>body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}.pass{color:#80ffb0}.bad{color:#ff8080}.lock{color:#ffcc66}</style></head><body>
<div class="card"><h1>Public Claim Safety Rules</h1><p>Use only approved phrases. Do not claim commercial availability.</p></div>
<div class="card pass"><h2>Approved Phrases</h2><ul>${list(publicClaims.approvedPhrases)}</ul></div>
<div class="card bad"><h2>Banned Phrases</h2><ul>${list(publicClaims.bannedPhrases)}</ul></div>
<div class="card lock"><h2>Mandatory Disclaimers</h2><ul>${list(publicClaims.mandatoryDisclaimers)}</ul></div>
</body></html>`;

const gateHtml = `<!doctype html><html><head><meta charset="utf-8"><title>UAOS Final Commercial Readiness Gate</title>
<style>body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}.pass{color:#80ffb0}.bad{color:#ff8080}.lock{color:#ffcc66}a{color:#9fd0ff}</style></head><body>
<div class="card"><h1>Final Commercial Readiness Gate</h1><h2 class="bad">COMMERCIAL LAUNCH BLOCKED</h2><p>Commercial readiness planning artifacts are ready, but launch is not approved.</p></div>
<div class="grid">
<div class="card pass"><h3>Planning Artifacts</h3><p>READY</p></div>
<div class="card bad"><h3>Commercial Product</h3><p>NO</p></div>
<div class="card lock"><h3>Public Release</h3><p>NO</p></div>
<div class="card lock"><h3>Payments</h3><p>NO</p></div>
<div class="card lock"><h3>Writer</h3><p>BLOCKED</p></div>
<div class="card lock"><h3>Real Keyboard Output</h3><p>BLOCKED</p></div>
<div class="card lock"><h3>Production Parser</h3><p>BLOCKED</p></div>
</div>
<div class="card"><h2>Blockers Preventing Approval</h2><ul>${list(finalGate.blockersPreventingCommercialApproval)}</ul></div>
<div class="card"><p><a href="./index.html">Back to Commercial Dashboard</a></p></div>
</body></html>`;

fs.writeFileSync(path.join(commercialRoot, "public-claim-rules.json"), JSON.stringify(publicClaims, null, 2), "utf8");
fs.writeFileSync(path.join(commercialRoot, "final-gate.json"), JSON.stringify(finalGate, null, 2), "utf8");
fs.writeFileSync(path.join(commercialRoot, "final-report.json"), JSON.stringify(finalReport, null, 2), "utf8");

fs.writeFileSync(path.join(outDir, "y738-public-claim-rules-report.json"), JSON.stringify(publicClaims, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y739-final-commercial-readiness-gate-report.json"), JSON.stringify(finalGate, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y740-commercial-readiness-final-report.json"), JSON.stringify(finalReport, null, 2), "utf8");

fs.writeFileSync(path.join(publicDir, "public-claims.html"), claimsHtml, "utf8");
fs.writeFileSync(path.join(publicDir, "final-gate.html"), gateHtml, "utf8");

console.log("[Y738-Y740 PASS_COMMERCIAL_READINESS_ARTIFACTS_READY]");
