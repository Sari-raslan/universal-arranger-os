const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation", "y1241-y1280");
const report = path.join(base, "y1241-y1280-final-official-docs-ui-path-lock-report.json");

function fail(msg){ console.error("[Y1271-Y1280 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing final path lock report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1241-Y1280") fail("Wrong phase");
if (r.status !== "PASS_OFFICIAL_DOCS_UI_PATH_LOCKED") fail("Bad status");

const st = r.finalPack.finalState || {};
if (st.selectedPath !== "PATH-DOCS-UI") fail("Selected path must be PATH-DOCS-UI");
if (st.pathLocked !== true) fail("Path must be locked");
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

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(appRoot, "reports", "official-path-selection"),
  path.join(appRoot, "public", "governance", "y1241-y1280")
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
  "public/governance/y1241-y1280/official-docs-ui-selection.html",
  "public/governance/y1241-y1280/docs-ui-working-rules.html",
  "public/governance/y1241-y1280/official-path-dashboard.html",
  "public/governance/y1241-y1280/official-docs-ui-path-lock.html",
  "public/governance/official-docs-ui-path-lock.html"
]) {
  if (!fs.existsSync(path.join(appRoot, file))) fail("Missing page: " + file);
}

fs.writeFileSync(
  path.join(base, "y1271-y1280-final-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1271-Y1280",
    status: "PASS",
    confirmed: [
      "OFFICIAL_DOCS_UI_PATH_LOCKED",
      "PATH_DOCS_UI_SELECTED",
      "PATH_LOCKED",
      "NO_FURTHER_CODE_GATE_ACTIVE",
      "NO_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES",
      "NO_APP_JSX",
      "NO_OPERATIONAL_CODE",
      "COMMERCIAL_PRODUCT_NO"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1271-Y1280 FINAL SAFETY PASS]");
