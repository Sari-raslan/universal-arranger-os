const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const commercialRoot = path.join(base, "commercial-readiness");
const publicDir = path.join(appRoot, "public", "commercial");
const outDir = path.join(base, "y729-y737");

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

const support = {
  phase: "Y729-Y733",
  title: "Support / Readiness Checklist",
  status: "PASS_SUPPORT_READINESS_DRAFT_READY",
  verdict: "SUPPORT_NOT_APPROVED_FOR_LAUNCH",
  checklist: [
    { item: "FAQ readiness", status: "DRAFT_REQUIRED" },
    { item: "Known limitations page", status: "DRAFT_REQUIRED" },
    { item: "Issue escalation path", status: "NOT_APPROVED" },
    { item: "Refund/support ownership", status: "UNKNOWN" },
    { item: "Demo-vs-production disclaimers", status: "REQUIRED" },
    { item: "Customer onboarding guide", status: "NOT_READY" }
  ],
  safety,
  generatedAt: new Date().toISOString()
};

const blockers = {
  phase: "Y734-Y737",
  title: "Release Blocker Matrix",
  status: "PASS_RELEASE_BLOCKER_MATRIX_READY",
  verdict: "PUBLIC_RELEASE_BLOCKED",
  blockers: [
    { blocker: "Real writer blocked", severity: "CRITICAL", owner: "CTO", impact: "No real keyboard exports", unblockCondition: "Approved writer spec + conformance + sandbox", publicClaimEffect: "Cannot claim real arranger output" },
    { blocker: "Production parser blocked", severity: "CRITICAL", owner: "CTO", impact: "No production format parsing", unblockCondition: "Parser validation and approval", publicClaimEffect: "Cannot claim production parser" },
    { blocker: "Legal/compliance blocked", severity: "CRITICAL", owner: "Founder/Legal", impact: "No commercial launch", unblockCondition: "Legal review complete", publicClaimEffect: "Cannot claim commercial availability" },
    { blocker: "Payments disabled", severity: "HIGH", owner: "Founder/Ops", impact: "No paid subscriptions", unblockCondition: "Payment/tax/refund setup approved", publicClaimEffect: "Cannot claim pricing live" },
    { blocker: "Support not approved", severity: "HIGH", owner: "Founder/Ops", impact: "No customer launch support", unblockCondition: "Support process approved", publicClaimEffect: "Cannot accept customers" },
    { blocker: "Deploy blocked", severity: "CRITICAL", owner: "CTO", impact: "No public release", unblockCondition: "Release gate approval", publicClaimEffect: "Cannot publish" }
  ],
  safety,
  generatedAt: new Date().toISOString()
};

function esc(x){return String(x).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));}
function supportRows(items){return items.map(x=>`<tr><td>${esc(x.item)}</td><td>${esc(x.status)}</td></tr>`).join("\n");}
function blockerRows(items){return items.map(x=>`<tr><td>${esc(x.blocker)}</td><td>${esc(x.severity)}</td><td>${esc(x.owner)}</td><td>${esc(x.impact)}</td><td>${esc(x.unblockCondition)}</td><td>${esc(x.publicClaimEffect)}</td></tr>`).join("\n");}

const supportHtml = `<!doctype html><html><head><meta charset="utf-8"><title>UAOS Support Readiness</title>
<style>body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}.lock{color:#ffcc66}</style></head><body>
<div class="card"><h1>Support / Readiness Checklist</h1><h2>SUPPORT NOT APPROVED FOR LAUNCH</h2></div>
<div class="card"><table><tr><th>Item</th><th>Status</th></tr>${supportRows(support.checklist)}</table></div>
<div class="card lock"><p>Writer: BLOCKED | Real keyboard output: BLOCKED | Production parser: BLOCKED | Deploy/Public release: BLOCKED | Payments: NO</p></div>
</body></html>`;

const blockersHtml = `<!doctype html><html><head><meta charset="utf-8"><title>UAOS Release Blockers</title>
<style>body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}table{width:100%;border-collapse:collapse}td,th{border:1px solid #444;padding:10px}.lock{color:#ffcc66}</style></head><body>
<div class="card"><h1>Release Blocker Matrix</h1><h2>PUBLIC RELEASE BLOCKED</h2></div>
<div class="card"><table><tr><th>Blocker</th><th>Severity</th><th>Owner</th><th>Impact</th><th>Unblock Condition</th><th>Public Claim Effect</th></tr>${blockerRows(blockers.blockers)}</table></div>
<div class="card lock"><p>Writer: BLOCKED | Real keyboard output: BLOCKED | Production parser: BLOCKED | Deploy/Public release: BLOCKED | Payments: NO</p></div>
</body></html>`;

fs.writeFileSync(path.join(commercialRoot, "support-readiness.json"), JSON.stringify(support, null, 2), "utf8");
fs.writeFileSync(path.join(commercialRoot, "release-blockers.json"), JSON.stringify(blockers, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y729-y733-support-readiness-report.json"), JSON.stringify(support, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y734-y737-release-blocker-matrix-report.json"), JSON.stringify(blockers, null, 2), "utf8");
fs.writeFileSync(path.join(publicDir, "support.html"), supportHtml, "utf8");
fs.writeFileSync(path.join(publicDir, "release-blockers.html"), blockersHtml, "utf8");

console.log("[Y729-Y737 PASS SUPPORT_RELEASE_BLOCKERS_READY]");
