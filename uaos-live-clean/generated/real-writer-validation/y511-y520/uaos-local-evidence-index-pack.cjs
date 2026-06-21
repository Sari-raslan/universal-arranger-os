const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const publicDir = path.join(appRoot, "public");
const base = path.join(appRoot, "generated", "real-writer-validation");
const outDir = path.join(base, "y511-y520");
fs.mkdirSync(outDir, { recursive: true });

function fail(msg) {
  console.error("[Y511-Y520 FAIL]", msg);
  process.exit(1);
}

const registryPath = path.join(base, "y501-y510", "y501-y510-local-evidence-link-registry-report.json");
if (!fs.existsSync(registryPath)) fail("Missing Y501-Y510 registry");

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

const groups = {};
for (const page of registry.pages || []) {
  groups[page.group] = groups[page.group] || [];
  groups[page.group].push(page);
}

const groupHtml = Object.entries(groups).map(([group, pages]) => `
  <section class="card">
    <h2>${group}</h2>
    <div class="links">
      ${pages.map(p => `
        <a class="link ${p.exists ? "ok" : "missing"}" href="./${p.file}">
          <strong>${p.phase}</strong><br>
          ${p.title}<br>
          <small>${p.exists ? "READY" : "MISSING"}</small>
        </a>
      `).join("\n")}
    </div>
  </section>
`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Local Evidence Index</title>
  <style>
    body{font-family:Arial;background:#101010;color:#eee;padding:28px;line-height:1.5}
    .hero{padding:24px;border-radius:16px;background:#181818;border:1px solid #444;margin-bottom:18px}
    .card{background:#1b1b1b;border:1px solid #444;border-radius:14px;padding:18px;margin:14px 0}
    .links{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
    .link{display:block;text-decoration:none;color:#eee;background:#222;border:1px solid #444;border-radius:12px;padding:14px}
    .link.ok{border-color:#437a55}
    .link.missing{border-color:#aa5555}
    .pass{color:#80ffb0}.lock{color:#ffcc66}.bad{color:#ff8080}code{color:#9fe870}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS Local Evidence Index</h1>
    <h2>Y501-Y540 Demo Navigation Hub</h2>
    <p>One local index for UAOS Yamaha parser validation, dry-run writer evidence, dashboards, and CTO reports.</p>
  </div>

  <section class="card">
    <h2>Final State</h2>
    <p class="pass">Local evidence package: READY</p>
    <p class="lock">Real writer: BLOCKED</p>
    <p class="lock">Real keyboard output: BLOCKED</p>
    <p class="lock">Production parser: BLOCKED</p>
    <p class="lock">Deploy: BLOCKED</p>
  </section>

  ${groupHtml}

  <section class="card">
    <h2>Important</h2>
    <p>This is a local proof package only. It does not enable writer, real keyboard files, production parser, or deployment.</p>
  </section>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-local-evidence-index.html"), html, "utf8");

const report = {
  phase: "Y511-Y520",
  title: "Public HTML Local Evidence Index",
  status: "PASS_INDEX_CREATED",
  page: "uaos-local-evidence-index.html",
  sourceRegistryStatus: registry.status,
  linkCount: (registry.pages || []).length,
  missingCount: registry.missingCount || 0,
  hardLimits: {
    appJsxModified: false,
    writerImplementation: false,
    realKeyboardOutput: false,
    productionParser: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(
  path.join(outDir, "y511-y520-local-evidence-index-report.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log("[Y511-Y520 PASS_INDEX_CREATED]");
