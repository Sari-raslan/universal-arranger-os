const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const report = path.join(base, "y901-y910", "y901-y910-sandbox-folder-manifest-report.json");

function fail(msg){ console.error("[Y901-Y910 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing sandbox manifest report");

const r = JSON.parse(fs.readFileSync(report, "utf8"));
if (r.phase !== "Y901-Y910") fail("Wrong phase");
if (r.status !== "PASS_SANDBOX_FOLDER_MANIFEST_READY") fail("Bad status");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.forbiddenKeyboardExtensions !== "BLOCKED") fail("Forbidden extensions not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.sandboxIsolated !== true) fail("Sandbox isolation flag failed");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(base, "writer-sandbox-phase0-no-output"),
  path.join(appRoot, "reports", "writer-sandbox-phase0"),
  path.join(appRoot, "public", "governance", "y901-y940")
];

function walk(dir, files=[]) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, files);
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

fs.writeFileSync(
  path.join(base, "y901-y910", "y901-y910-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y901-Y910",
    status: "PASS",
    confirmed: [
      "SANDBOX_FOLDER_CREATED",
      "SANDBOX_ISOLATED",
      "NO_WRITER_IMPLEMENTATION",
      "NO_REAL_WRITER",
      "NO_REAL_OUTPUT",
      "NO_PRODUCTION_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES_TOUCH",
      "NO_APP_JSX",
      "NO_FORBIDDEN_OUTPUT_FILES_CREATED"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y901-Y910 SAFETY PASS]");
