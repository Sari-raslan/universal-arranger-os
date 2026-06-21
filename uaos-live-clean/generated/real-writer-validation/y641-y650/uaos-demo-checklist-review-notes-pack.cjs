const fs = require("fs");
const path = require("path");

const appRoot = process.cwd();
const base = path.join(appRoot, "generated", "real-writer-validation");
const publicDir = path.join(appRoot, "public");
const outDir = path.join(base, "y641-y650");
fs.mkdirSync(outDir, { recursive: true });

const checklist = [
  { id: "DEMO_001", text: "Open the polished navigation hub.", required: true },
  { id: "DEMO_002", text: "Show executive presentation.", required: true },
  { id: "DEMO_003", text: "Show founder demo script.", required: true },
  { id: "DEMO_004", text: "Show investor/partner summary.", required: true },
  { id: "DEMO_005", text: "Show evidence index.", required: true },
  { id: "DEMO_006", text: "Show final safe decision gate.", required: true },
  { id: "SAFETY_001", text: "State that real writer is blocked.", required: true },
  { id: "SAFETY_002", text: "State that real keyboard output is blocked.", required: true },
  { id: "SAFETY_003", text: "State that production parser is blocked.", required: true },
  { id: "SAFETY_004", text: "State that deploy is blocked.", required: true }
];

const report = {
  phase: "Y641-Y650",
  title: "Demo Checklist + Review Notes Page",
  status: "PASS_DEMO_CHECKLIST_READY",
  checklist,
  reviewNotesTemplate: [
    "Reviewer name:",
    "Review date:",
    "Strongest proof page:",
    "Weakest proof page:",
    "Questions:",
    "Next recommended step:"
  ],
  hardLimits: {
    appJsxModified: false,
    writerImplementation: false,
    realKeyboardOutput: false,
    productionParser: false,
    deploy: false
  },
  generatedAt: new Date().toISOString()
};

const checklistHtml = checklist.map(c => `
<label class="item">
  <input type="checkbox">
  <span><strong>${c.id}</strong> — ${c.text}</span>
</label>`).join("\n");

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>UAOS Demo Checklist + Review Notes</title>
  <style>
    body{font-family:Arial;background:#0f0f10;color:#eee;padding:28px;line-height:1.55}
    .hero{padding:30px;border-radius:20px;background:#181818;border:1px solid #444;margin-bottom:18px}
    .card{background:#1b1b1d;border:1px solid #444;border-radius:16px;padding:18px;margin:16px 0}
    .item{display:block;background:#242427;border:1px solid #444;border-radius:12px;padding:12px;margin:8px 0}
    textarea{width:100%;height:160px;background:#151515;color:#eee;border:1px solid #444;border-radius:12px;padding:12px}
    .lock{color:#ffcc66}a{color:#9fd0ff}
  </style>
</head>
<body>
  <div class="hero">
    <h1>UAOS Demo Checklist + Review Notes</h1>
    <p>Use this during local review. This page saves nothing and publishes nothing.</p>
    <p class="lock">No writer, no real keyboard output, no production parser, no deploy.</p>
  </div>

  <div class="card">
    <h2>Checklist</h2>
    ${checklistHtml}
  </div>

  <div class="card">
    <h2>Review Notes</h2>
    <textarea placeholder="Write temporary notes here during the local review. This does not save automatically."></textarea>
  </div>

  <div class="card">
    <h2>Open Flow</h2>
    <p><a href="./uaos-guided-review-flow.html">Guided Review Flow</a></p>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "uaos-demo-checklist-review-notes.html"), html, "utf8");
fs.writeFileSync(path.join(outDir, "y641-y650-demo-checklist-review-notes-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log("[Y641-Y650 PASS_DEMO_CHECKLIST_READY]");
