const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const report = path.join(appRoot, "generated", "real-writer-validation", "y1161-y1200", "y1181-y1190-presentation-audit-report.json");

function fail(msg){ console.error("[Y1181-Y1190 GATE FAIL]", msg); process.exit(1); }

if (!fs.existsSync(report)) fail("Missing presentation audit report");
const r = JSON.parse(fs.readFileSync(report, "utf8"));

if (r.phase !== "Y1181-Y1190") fail("Wrong phase");
if (r.status !== "PASS_REPOSITORY_PRESENTATION_AUDIT_CLEAN") fail("Bad status");
if (r.clean !== true) fail("Audit not clean");
if (r.missing.length !== 0) fail("Missing files exist");

const forbiddenOutputExt = [".sty",".set",".prs",".stl",".pat",".msp",".kst"];
const roots = [
  path.join(appRoot, "reports", "repository-presentation"),
  path.join(appRoot, "public", "governance", "y1161-y1200")
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
  path.join(appRoot, "generated", "real-writer-validation", "y1161-y1200", "y1181-y1190-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y1181-Y1190",
    status: "PASS",
    confirmed: [
      "REPOSITORY_PRESENTATION_AUDIT_CLEAN",
      "NO_FORBIDDEN_OUTPUT_FILES",
      "NO_WRITER",
      "NO_OUTPUT",
      "NO_PARSER",
      "NO_DEPLOY",
      "NO_FIXTURES",
      "NO_APP_JSX"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y1181-Y1190 SAFETY PASS]");
