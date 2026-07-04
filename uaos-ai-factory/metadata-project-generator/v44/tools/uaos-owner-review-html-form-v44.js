import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

const paths = {
  decisionTemplate: path.join(base, "v43", "generated", "UAOS_V43_OWNER_DECISION_TEMPLATE.json"),
  preview: path.join(generatedDir, "UAOS_V44_DECISION_APPLY_PREVIEW_V2.json"),
  diff: path.join(generatedDir, "UAOS_V44_PREVIEW_DIFF_SUMMARY.json")
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
}

function safetyBlock() {
  return {
    metadataOnly: true,
    dryRunOnly: true,
    sourceProjectModified: false,
    autoApplyEnabled: false,
    realApplyAllowed: false,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false,
    exportApproval: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const template = readJson(paths.decisionTemplate);
const preview = readJson(paths.preview);
const diff = readJson(paths.diff);
const generatedAt = new Date().toISOString();
const options = ["accept_for_future_metadata_plan_only", "reject", "needs_more_review", "defer"];

const formData = {
  schemaVersion: "uaos.v44.owner.review.form.data.v1",
  generatedAt,
  metadataOnly: true,
  dryRunOnly: true,
  sourceProjectModified: false,
  autoApplyEnabled: false,
  realApplyAllowed: false,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  decisionTemplatePath: "../v43/generated/UAOS_V43_OWNER_DECISION_TEMPLATE.json",
  previewPath: "generated/UAOS_V44_DECISION_APPLY_PREVIEW_V2.json",
  decisions: template.decisions,
  previewSummary: {
    acceptedDecisionCount: preview.acceptedDecisionCount,
    pendingDecisionCount: preview.pendingDecisionCount,
    changedFieldsPreview: diff.changedFieldsPreview.length
  },
  safety: safetyBlock()
};

const cards = template.decisions.map((item) => `
  <article class="decision">
    <h3>${esc(item.decisionId)} ${esc(item.title)}</h3>
    <p><strong>Category:</strong> ${esc(item.category)}</p>
    <p><strong>Reason/change:</strong> ${esc(item.proposedMetadataChange)}</p>
    <p><strong>Source suggestion:</strong> ${esc(item.sourceSuggestionId)}</p>
    <div class="options">${options.map((option) => `<span>${esc(option)}</span>`).join("")}</div>
  </article>`).join("");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>UAOS V44 Owner Review Form</title>
  <style>
    :root{--bg:#030712;--panel:#111827;--line:#2b3649;--text:#f8fafc;--cyan:#22d3ee;--green:#22c55e;--amber:#f59e0b}
    *{box-sizing:border-box}body{margin:0;background:#030712;color:var(--text);font-family:Arial,Tahoma,sans-serif;line-height:1.5}
    header{padding:22px;background:#050914;border-bottom:1px solid var(--line)}h1{margin:4px 0 0}header p{margin:0;color:var(--cyan);font-weight:800}
    main{padding:16px;display:grid;gap:14px}section,.decision{background:linear-gradient(180deg,rgba(17,24,39,.98),rgba(8,13,24,.98));border:1px solid var(--line);border-radius:8px;padding:14px}
    .badge{display:inline-block;border:1px solid rgba(34,211,238,.45);border-radius:999px;padding:6px 9px;margin:3px;color:var(--cyan);font-weight:800}
    .decision{margin-bottom:10px}.options{display:flex;gap:8px;flex-wrap:wrap}.options span{border:1px solid var(--line);border-radius:8px;padding:8px;color:var(--amber)}code{color:var(--green)}
  </style>
</head>
<body>
  <header>
    <p>UAOS Metadata Project Generator</p>
    <h1>V44 Owner Review HTML Form</h1>
    <span class="badge">LOCAL FORM ONLY</span>
    <span class="badge">DOES NOT SAVE AUTOMATICALLY</span>
    <span class="badge">DRY-RUN ONLY</span>
    <span class="badge">METADATA ONLY</span>
    <span class="badge">SOURCE PROJECT NOT MODIFIED</span>
    <span class="badge">NOT DEPLOYED</span>
    <span class="badge">NOT KORG OUTPUT</span>
    <span class="badge">NOT PA3X READY</span>
    <span class="badge">NO USB APPROVAL</span>
    <span class="badge">NO KEYBOARD LOAD APPROVAL</span>
    <span class="badge">NO EXPORT APPROVAL</span>
  </header>
  <main>
    <section>
      <h2>Safety Banner</h2>
      <p>This HTML does not save decisions automatically. Edit the JSON template manually or use a future decision collector. It does not apply changes, does not generate KORG files, does not approve USB, and does not approve keyboard load.</p>
      <p>V43 decision template: <code>../v43/generated/UAOS_V43_OWNER_DECISION_TEMPLATE.json</code></p>
      <p>V44 preview: <code>generated/UAOS_V44_DECISION_APPLY_PREVIEW_V2.json</code></p>
    </section>
    <section>
      <h2>Owner Decision List</h2>
      ${cards}
    </section>
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(generatedDir, "UAOS_V44_OWNER_REVIEW_FORM_DATA.json"), JSON.stringify(formData, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V44_OWNER_REVIEW_FORM.html"), html, "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V44_OWNER_REVIEW_FORM_REPORT.md"), [
  "# UAOS V44 Owner Review Form Report",
  "",
  "Status: GENERATED",
  "",
  "Owner review form: generated/UAOS_V44_OWNER_REVIEW_FORM.html",
  "Owner review form data: generated/UAOS_V44_OWNER_REVIEW_FORM_DATA.json",
  "",
  "Safety: local form only, does not save automatically, dry-run only, no export approval."
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", form: "generated/UAOS_V44_OWNER_REVIEW_FORM.html", decisions: template.decisions.length }, null, 2));
