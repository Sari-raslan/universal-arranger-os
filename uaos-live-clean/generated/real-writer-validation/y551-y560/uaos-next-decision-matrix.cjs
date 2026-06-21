const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const publicDir = path.join(appRoot, "public");
const outDir = path.join(base, "y551-y560");
fs.mkdirSync(outDir, { recursive: true });

const options = [
  {
    id: "UI_POLISH",
    name: "UI polish / product demo refinement",
    safety: "HIGH",
    risk: "LOW",
    speed: "FAST",
    value: "HIGH",
    recommendedNow: true,
    allowedNow: true,
    reason: "Improves product clarity without opening writer or real output."
  },
  {
    id: "DRYRUN_IMPROVEMENTS",
    name: "Dry-run improvements",
    safety: "HIGH",
    risk: "LOW_MEDIUM",
    speed: "MEDIUM",
    value: "MEDIUM_HIGH",
    recommendedNow: true,
    allowedNow: true,
    reason: "Improves evidence quality while staying JSON-only."
  },
  {
    id: "WRITER_SPEC",
    name: "Writer specification only",
    safety: "MEDIUM_HIGH",
    risk: "MEDIUM",
    speed: "MEDIUM",
    value: "HIGH_LATER",
    recommendedNow: false,
    allowedNow: true,
    reason: "Useful, but should stay specification-only until stronger conformance plan exists."
  },
  {
    id: "REAL_WRITER",
    name: "Real writer implementation",
    safety: "LOW",
    risk: "HIGH",
    speed: "SLOW",
    value: "HIGH_LATER",
    recommendedNow: false,
    allowedNow: false,
    reason: "Blocked until separate approval, real spec, conformance tests, and hardware/software validation."
  },
  {
    id: "PUBLIC_DEPLOY",
    name: "Public deploy",
    safety: "MEDIUM",
    risk: "MEDIUM_HIGH",
    speed: "FAST",
    value: "HIGH_LATER",
    recommendedNow: false,
    allowedNow: false,
    reason: "Blocked because product must not imply production writer/parser readiness."
  }
];

const report = {
  phase: "Y551-Y560",
  title: "Next Decision Matrix",
  status: "PASS_DECISION_MATRIX_READY",
  recommendedPath: ["UI_POLISH", "DRYRUN_IMPROVEMENTS"],
  blockedPath: ["REAL_WRITER", "PUBLIC_DEPLOY"],
  options,
  hardLimits: {
    appJsxModified: false,
    writerImplementation: false,
    realKeyboardOutput: false,
    productionParser: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

const rows = options.map(o => `
<tr>
  <td>${o.id}</td>
  <td>${o.name}</td>
  <td>${o.safety}</td>
  <td>${o.risk}</td>
  <td>${o.value}</td>
  <td>${o.allowedNow ? "YES" : "NO"}</td>
  <td>${o.recommendedNow ? "YES" : "NO"}</td>
  <td>${o.reason}</td>
</tr>`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Next Decision Matrix</title>
  <style>
    body{font-family:Arial;background:#101010;color:#eee;padding:28px;line-height:1.5}
    .hero{padding:24px;border-radius:16px;background:#181818;border:1px solid #444;margin-bottom:18px}
    table{width:100%;border-collapse:collapse;background:#1b1b1b}
    th,td{border:1px solid #444;padding:10px;text-align:left;vertical-align:top}
    th{background:#222}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS Next Decision Matrix</h1>
    <h2>Y551-Y560</h2>
    <p>Recommended now: UI polish and dry-run improvements. Blocked now: real writer and public deploy.</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Path</th>
        <th>Safety</th>
        <th>Risk</th>
        <th>Value</th>
        <th>Allowed Now</th>
        <th>Recommended Now</th>
        <th>Reason</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <p class="lock">Real writer: BLOCKED | Real keyboard output: BLOCKED | Production parser: BLOCKED | Deploy: BLOCKED</p>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-next-decision-matrix.html"), html, "utf8");
fs.writeFileSync(path.join(outDir, "y551-y560-next-decision-matrix-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log("[Y551-Y560 PASS_DECISION_MATRIX_READY]");
