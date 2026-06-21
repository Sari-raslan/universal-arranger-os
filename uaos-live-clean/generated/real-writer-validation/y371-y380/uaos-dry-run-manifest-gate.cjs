const fs = require("fs");
const path = require("path");

const p = path.join(process.cwd(), "generated", "real-writer-validation", "y371-y380", "y371-y380-dry-run-manifest-conformance-report.json");

function fail(msg) {
  console.error("[Y371-Y380 GATE FAIL]", msg);
  process.exit(1);
}

if (!fs.existsSync(p)) fail("Missing manifest/conformance report");

const r = JSON.parse(fs.readFileSync(p, "utf8"));
const h = r.hardLimits || {};

if (r.phase !== "Y371-Y380") fail("Wrong phase");
if (r.status !== "PASS_FORMAT_ONLY") fail("Bad status");
if (r.formatOnly !== true) fail("Not format-only");
if (r.realManifestWritten !== false) fail("Real manifest should not be written");
if (r.writerImplemented !== false) fail("Writer implementation detected");
if (r.realOutputProduced !== false) fail("Real output detected");

const forbidden = ((r.manifestFormat || {}).forbiddenExtensions || []);
for (const ext of [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"]) {
  if (!forbidden.includes(ext)) fail("Missing forbidden extension: " + ext);
}

for (const k of [
  "appJsxModified",
  "writerImplementation",
  "realStyOutput",
  "realKeyboardOutput",
  "productionParser",
  "fixtureModification",
  "fixtureCopy",
  "destructiveWrites",
  "deploy"
]) {
  if (h[k] !== false) fail("Hard limit failed: " + k);
}

fs.writeFileSync(
  path.join(process.cwd(), "generated", "real-writer-validation", "y371-y380", "y371-y380-safety-gate-report.json"),
  JSON.stringify({
    phase: "Y371-Y380",
    status: "PASS",
    confirmed: [
      "FORMAT_ONLY",
      "NO_REAL_MANIFEST_OUTPUT",
      "REAL_EXTENSIONS_FORBIDDEN",
      "NO_WRITER",
      "NO_REAL_OUTPUT",
      "NO_DEPLOY"
    ],
    generatedAt: new Date().toISOString()
  }, null, 2),
  "utf8"
);

console.log("[Y371-Y380 SAFETY PASS]");
