const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const specRoot = path.join(appRoot, "specs", "writer");
const reportsRoot = path.join(appRoot, "reports", "writer");
const publicRoot = path.join(appRoot, "public", "writer");
const outDir = path.join(appRoot, "generated", "real-writer-validation", "y751-y760");

fs.mkdirSync(specRoot, { recursive: true });
fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(publicRoot, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const forbiddenExtensions = [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"];

const safety = {
  writerImplementation: "BLOCKED",
  realWriter: "BLOCKED",
  realKeyboardOutput: "BLOCKED",
  productionParser: "BLOCKED",
  deployPublicRelease: "BLOCKED",
  fixturesReadCopyModify: "BLOCKED",
  appJsxModified: false,
  specOnly: true
};

const policies = {
  phase: "Y751-Y760",
  title: "Forbidden Extension + Sandbox + Fixture Isolation Policies",
  status: "PASS_POLICY_SPECS_READY",
  forbiddenExtensionPolicy: {
    phase: "Y753-Y756",
    forbiddenExtensions,
    rule: "These extensions may be mentioned only as forbidden output formats. No file with these extensions may be created by this package."
  },
  sandboxOnlyRules: {
    phase: "Y754",
    rule: "Future writer work must run only in an approved sandbox path after separate approval. This package does not create a writer sandbox."
  },
  noOverwritePolicy: {
    phase: "Y755",
    rule: "Future writer must never overwrite existing assets. Any future output must be new, isolated, and approval-gated."
  },
  noFixtureCopyPolicy: {
    phase: "Y757",
    rule: "Fixtures must not be read, copied, modified, renamed, moved, or used by this package."
  },
  noFixtureModifyPolicy: {
    phase: "Y758",
    rule: "Fixtures remain untouched. Any fixture interaction requires a separate read-only approval phase."
  },
  accessIsolation: {
    phase: "Y759-Y760",
    rule: "Writer specification is separated from parser, deploy, fixture, and production paths."
  },
  safety,
  generatedAt: new Date().toISOString()
};

function md(title, body) {
  return `# ${title}\n\n${body}\n\n## Hard Stops\n\n- No writer implementation.\n- No binary serialization.\n- No real keyboard output.\n- No production parser.\n- No deploy/public release.\n- No fixtures read/copy/modify.\n- No App.jsx modification.\n`;
}

fs.writeFileSync(path.join(specRoot, "Y753-forbidden-extension-policy.md"), md("Y753 Forbidden Extension Policy", JSON.stringify(policies.forbiddenExtensionPolicy, null, 2)), "utf8");
fs.writeFileSync(path.join(specRoot, "Y754-sandbox-only-rules.md"), md("Y754 Sandbox Only Rules", JSON.stringify(policies.sandboxOnlyRules, null, 2)), "utf8");
fs.writeFileSync(path.join(specRoot, "Y755-no-overwrite-policy.md"), md("Y755 No Overwrite Policy", JSON.stringify(policies.noOverwritePolicy, null, 2)), "utf8");
fs.writeFileSync(path.join(specRoot, "Y757-no-fixture-copy-policy.md"), md("Y757 No Fixture Copy Policy", JSON.stringify(policies.noFixtureCopyPolicy, null, 2)), "utf8");
fs.writeFileSync(path.join(specRoot, "Y758-no-fixture-modify-policy.md"), md("Y758 No Fixture Modify Policy", JSON.stringify(policies.noFixtureModifyPolicy, null, 2)), "utf8");

fs.writeFileSync(path.join(reportsRoot, "y751-y760-safety-policies.json"), JSON.stringify(policies, null, 2), "utf8");
fs.writeFileSync(path.join(outDir, "y751-y760-writer-safety-policies-report.json"), JSON.stringify(policies, null, 2), "utf8");

const extList = forbiddenExtensions.map(x => `<li>${x}</li>`).join("\n");
const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>UAOS Writer Safety Gates</title>
<style>
body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
.card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:20px;margin:14px 0}
.pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}a{color:#9fd0ff}
</style></head><body>
<div class="card"><h1>UAOS Writer Safety Gates</h1><h2>Y751-Y760 Policy Specs Ready</h2></div>
<div class="card bad"><h2>Forbidden Output Extensions</h2><ul>${extList}</ul><p>These are forbidden output formats in this package. No real keyboard files are generated.</p></div>
<div class="card lock"><h2>Hard Stops</h2><p>Writer implementation: BLOCKED<br>Real writer: BLOCKED<br>Real keyboard output: BLOCKED<br>Production parser: BLOCKED<br>Deploy: BLOCKED<br>Fixtures touch: BLOCKED</p></div>
<p><a href="./index.html">Back to Writer Spec Index</a></p>
</body></html>`;

fs.writeFileSync(path.join(publicRoot, "safety-gates.html"), html, "utf8");

console.log("[Y751-Y760 PASS_POLICY_SPECS_READY]");
