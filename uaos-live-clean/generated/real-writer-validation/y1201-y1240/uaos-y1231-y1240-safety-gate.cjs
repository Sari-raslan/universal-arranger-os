const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation", "y1201-y1240");
const report = path.join(base, "y1201-y1240-final-explicit-next-phase-approval-pack-report.json");

function fail(msg){ console.error("[Y1231-Y1240 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing final approval pack report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1201-Y1240") fail("Wrong phase");
if (r.status !== "PASS_EXPLICIT_NEXT_PHASE_APPROVAL_PACK_READY") fail("Bad status");

const st = r.finalPack.finalState || {};
if (st.approvalDecisionPages !== "READY") fail("Approval decision pages not ready");
if (st.approvalTextTemplates !== "READY") fail("Approval templates not ready");
if (st.riskAcceptanceChecklist !== "READY") fail("Risk checklist not ready");
if (st.allowedNextPathSelector !== "READY") fail("Path selector not ready");
if (st.selectedPathNow !== "NONE") fail("Path must not be selected");
if (st.riskAcceptanceNow !== "NOT_ACCEPTED") fail("Risk must not be accepted");
if (st.noFurtherCodeGate !== "ACTIVE") fail("No-further-code gate must be active");
if (st.outputAllowed !== "NO") fail("Output must be NO");
if (st.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (st.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (st.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (st.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (st.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (st.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (st.appJsxModified !== false) fail("App.jsx flag failed");
if (st.operationalCode !== "NO") fail("Operational code must be NO");
if (st.commercialProduct !== "NO") fail("Commercial product must be NO");

const s = r.safety || {};
if (s.noFurtherCodeGate !== "ACTIVE") fail("Safety no-further-code gate failed");
if (s.outputAllowed !== false) fail("Safety output flag failed");
if (s.operationalCode !== "NO") fail("Safety operational code failed");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(appRoot, "reports", "next-phase-approval"),
  path.join(appRoot, "public", "governance", "y1201-y1240")
];

function walk(dir, files=[]) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const stt = fs.statSync(p);
    if (stt.isDirectory()) walk(p, files);
    else files.push(p);
  }
  return files;
}

for (const root of roots) {
  for (const file of walk(root)) {
    const ext = path.extname(file).toLowerCase();
    if (forbiddenOutputExt.includes(ext)) fail("Forbidden output file exists: " + file);
  }
}

for (const file of [
  "public/governance/y1201-y1240/approval-decision-pages.html",
  "public/governance/y1201-y1240/approval-text-templates.html",
  "public/governance/y1201-y1240/risk-acceptance-checklist.html",
  "public/governance/y1201-y1240/allowed-next-path-selector.html",
  "public/governance/y1201-y1240/explicit-next-phase-approval-pack.html",
  "public/governance/explicit-next-phase-approval-pack.html"
]) {
  if (!fs.existsSync(path.join(appRoot, file))) fail("Missing page: " + file);
}

fs.writeFileSync(
  path.join(base, "y1231-y1240-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1231-Y1240",
    status: "PASS",
    confirmed: [
      "ALLOWED_NEXT_PATH_SELECTOR_READY",
      "EXPLICIT_NEXT_PHASE_APPROVAL_PACK_READY",
      "NO_PATH_SELECTED",
      "RISK_NOT_ACCEPTED",
      "NO_FURTHER_CODE_GATE_ACTIVE",
      "NO_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES",
      "NO_APP_JSX",
      "NO_OPERATIONAL_CODE"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1231-Y1240 FINAL SAFETY PASS]");
