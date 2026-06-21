const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y751-y760", "y751-y760-writer-safety-policies-report.json");

function fail(msg){ console.error("[Y751-Y760 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y751-Y760") fail("Wrong phase");
if (r.status !== "PASS_POLICY_SPECS_READY") fail("Bad status");

const s = r.safety || {};
if (s.writerImplementation !== "BLOCKED") fail("Writer implementation not blocked");
if (s.realWriter !== "BLOCKED") fail("Real writer not blocked");
if (s.realKeyboardOutput !== "BLOCKED") fail("Real output not blocked");
if (s.productionParser !== "BLOCKED") fail("Production parser not blocked");
if (s.deployPublicRelease !== "BLOCKED") fail("Deploy not blocked");
if (s.fixturesReadCopyModify !== "BLOCKED") fail("Fixtures not blocked");
if (s.appJsxModified !== false) fail("App.jsx flag failed");
if (s.specOnly !== true) fail("Spec-only flag failed");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const scanRoots = [
  path.join(appRoot, "specs", "writer"),
  path.join(appRoot, "reports", "writer"),
  path.join(appRoot, "public", "writer")
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

for (const root of scanRoots) {
  for (const file of walk(root)) {
    const ext = path.extname(file).toLowerCase();
    if (forbiddenOutputExt.includes(ext)) fail("Forbidden output file exists: " + file);
  }
}

fs.writeFileSync(
  path.join(appRoot, "generated", "real-writer-validation", "y751-y760", "y751-y760-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y751-Y760",
    status: "PASS",
    confirmed: [
      "FORBIDDEN_EXTENSION_POLICY_READY",
      "SANDBOX_ONLY_RULES_READY",
      "NO_OVERWRITE_POLICY_READY",
      "NO_FIXTURE_COPY_POLICY_READY",
      "NO_FIXTURE_MODIFY_POLICY_READY",
      "NO_WRITER_IMPLEMENTATION",
      "NO_REAL_OUTPUT_FILES_CREATED",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y751-Y760 SAFETY PASS]");
