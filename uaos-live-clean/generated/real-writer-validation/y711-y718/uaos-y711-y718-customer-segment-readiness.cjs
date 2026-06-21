const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const commercialRoot = path.join(base, "commercial-readiness");
const publicDir = path.join(appRoot, "public", "commercial");
const outDir = path.join(base, "y711-y718");

fs.mkdirSync(commercialRoot, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const safety = {
  writer: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  paymentActivation: "NO",
  commercialProduct: "NO",
  appJsxModified: false
};

const segments = [
  {
    id: "casual_singer_creator",
    name: "Casual singer / content creator",
    valueFit: "HIGH for simplified singing-to-arrangement demos and content workflows.",
    onboardingFit: "MEDIUM; needs very simple UI and clear limitations.",
    riskLevel: "MEDIUM",
    blockers: ["No production app release", "No payment flow", "No support/FAQ approval"],
    verdict: "READY_FOR_DEMO_REVIEW_ONLY"
  },
  {
    id: "home_musician_semi_pro",
    name: "Home musician / semi-pro",
    valueFit: "MEDIUM-HIGH for guided arrangement and local proof demos.",
    onboardingFit: "MEDIUM; needs project workflow clarity and export expectations.",
    riskLevel: "MEDIUM-HIGH",
    blockers: ["Real export blocked", "Production parser blocked", "No release support"],
    verdict: "CONDITIONAL_REVIEW_ONLY"
  },
  {
    id: "professional_arranger_keyboard_user",
    name: "Professional arranger keyboard user",
    valueFit: "HIGH future potential, but highest risk because real keyboard output is blocked.",
    onboardingFit: "LOW until real writer/conformance validation exists.",
    riskLevel: "HIGH",
    blockers: ["Real .STY/.SET/.PRS output blocked", "Hardware validation missing", "Writer implementation blocked"],
    verdict: "BLOCKED_FOR_COMMERCIAL_USE"
  }
];

const report = {
  phase: "Y711-Y718",
  title: "Customer Segment Readiness",
  status: "PASS_SEGMENT_READINESS_REVIEW_READY",
  segments,
  overallVerdict: "COMMERCIAL_USE_BLOCKED",
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const cards = segments.map(s => `
<div class="card">
  <h2>${esc(s.name)}</h2>
  <p><strong>Value fit:</strong> ${esc(s.valueFit)}</p>
  <p><strong>Onboarding fit:</strong> ${esc(s.onboardingFit)}</p>
  <p><strong>Risk:</strong> ${esc(s.riskLevel)}</p>
  <p><strong>Verdict:</strong> ${esc(s.verdict)}</p>
  <h3>Blockers</h3><ul>${list(s.blockers)}</ul>
</div>`).join("\n");

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>UAOS Customer Segment Readiness</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.lock{color:#ffcc66}a{color:#9fd0ff}
</style></head><body>
<div class="card"><h1>UAOS Customer Segment Readiness</h1><p>Commercial use remains blocked. This page is for readiness review only.</p></div>
${cards}
<div class="card lock"><h2>Safety</h2><p>Writer: BLOCKED | Real keyboard output: BLOCKED | Production parser: BLOCKED | Deploy/Public release: BLOCKED | Payments: NO</p></div>
</body></html>`;

fs.writeFileSync(path.join(commercialRoot, "customer-segments.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y711-y718-customer-segment-readiness-report.json"), JSON.stringify(report, null, 2), "utf8");
fs.writeFileSync(path.join(publicDir, "customer-segments.html"), html, "utf8");

console.log("[Y711-Y718 PASS_SEGMENT_READINESS_REVIEW_READY]");
