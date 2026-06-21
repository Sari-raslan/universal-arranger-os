const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const commercialRoot = path.join(base, "commercial-readiness");
const publicDir = path.join(appRoot, "public", "commercial");
const outDir = path.join(base, "y719-y728");

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

const legal = {
  phase: "Y719-Y723",
  title: "Legal / Compliance Blocker Checklist",
  status: "PASS_LEGAL_BLOCKERS_LIST_READY",
  verdict: "LEGAL_APPROVAL_BLOCKED",
  checklist: [
    { item: "Brand/trademark review", status: "BLOCKED_PENDING_REVIEW" },
    { item: "Licensing assumptions for music/content/AI", status: "BLOCKED_PENDING_REVIEW" },
    { item: "AI/content usage disclosures", status: "BLOCKED_PENDING_REVIEW" },
    { item: "Privacy/data handling policy", status: "BLOCKED_PENDING_REVIEW" },
    { item: "Third-party dependency notices", status: "BLOCKED_PENDING_REVIEW" },
    { item: "Export/control and regional availability assumptions", status: "UNKNOWN_REVIEW_REQUIRED" },
    { item: "Commercial terms and refund policy", status: "BLOCKED_PENDING_REVIEW" }
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const pricing = {
  phase: "Y724-Y728",
  title: "Pricing Readiness Checklist",
  status: "PASS_PRICING_READINESS_DRAFT_READY",
  verdict: "PAYMENTS_NOT_ENABLED",
  noPaymentsEnabled: true,
  packagingConcepts: [
    { sku: "UAOS Creator", hypothesis: "Entry tier for singers/content demos", readiness: "DRAFT_ONLY" },
    { sku: "UAOS Studio", hypothesis: "Home musician/semi-pro tier", readiness: "DRAFT_ONLY" },
    { sku: "UAOS Pro Arranger", hypothesis: "Professional arranger keyboard tier", readiness: "BLOCKED_UNTIL_REAL_OUTPUT" }
  ],
  blockers: [
    "No payment processor enabled.",
    "No tax/invoice review.",
    "No refund policy.",
    "No commercial launch approval.",
    "Real output blocked for professional arranger SKU."
  ],
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function rows(items){return items.map(x=>`<tr><td>${esc(x.item||x.sku)}</td><td>${esc(x.status||x.hypothesis)}</td><td>${esc(x.readiness||"")}</td></tr>`).join("\n");}
function list(items){return items.map(x=>`<li>${esc(x)}</li>`).join("\n");}

const legalHtml = `<!doctype html><html><head><meta charset="utf-8"><title>UAOS Legal Checklist</title>
<style>body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}.lock{color:#ffcc66}</style></head><body>
<div class="card"><h1>Legal / Compliance Blocker Checklist</h1><h2>LEGAL APPROVAL: BLOCKED</h2><p>Planning only. No commercial launch approval.</p></div>
<div class="card"><table><tr><th>Item</th><th>Status</th><th></th></tr>${rows(legal.checklist)}</table></div>
<div class="card lock"><p>Writer: BLOCKED | Real keyboard output: BLOCKED | Production parser: BLOCKED | Deploy/Public release: BLOCKED | Payments: NO</p></div>
</body></html>`;

const pricingHtml = `<!doctype html><html><head><meta charset="utf-8"><title>UAOS Pricing Readiness</title>
<style>body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}.lock{color:#ffcc66}.bad{color:#ff8080}</style></head><body>
<div class="card"><h1>Pricing Readiness Checklist</h1><h2 class="bad">PAYMENTS NOT ENABLED</h2><p>Pricing is hypothesis only. No payment activation.</p></div>
<div class="card"><table><tr><th>SKU</th><th>Hypothesis</th><th>Readiness</th></tr>${rows(pricing.packagingConcepts)}</table></div>
<div class="card"><h2>Blockers</h2><ul>${list(pricing.blockers)}</ul></div>
<div class="card lock"><p>Writer: BLOCKED | Real keyboard output: BLOCKED | Production parser: BLOCKED | Deploy/Public release: BLOCKED | Payments: NO</p></div>
</body></html>`;

fs.writeFileSync(path.join(commercialRoot, "legal-compliance.json"), JSON.stringify(legal, null, 2), "utf8");
fs.writeFileSync(path.join(commercialRoot, "pricing-readiness.json"), JSON.stringify(pricing, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y719-y723-legal-compliance-report.json"), JSON.stringify(legal, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y724-y728-pricing-readiness-report.json"), JSON.stringify(pricing, null, 2), "utf8");
fs.writeFileSync(path.join(publicDir, "legal.html"), legalHtml, "utf8");
fs.writeFileSync(path.join(publicDir, "pricing.html"), pricingHtml, "utf8");

console.log("[Y719-Y728 PASS LEGAL_PRICING_READINESS_READY]");
