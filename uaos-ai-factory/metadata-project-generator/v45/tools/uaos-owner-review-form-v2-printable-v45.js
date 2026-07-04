import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const templatePath = path.join(generatedDir, "UAOS_V45_MANUAL_DECISION_IMPORT_TEMPLATE.json");
const summaryPath = path.join(generatedDir, "UAOS_V45_IMPORTED_DECISION_DRYRUN_SUMMARY.json");

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
    manualReviewOnly: true,
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

const template = readJson(templatePath);
const summary = readJson(summaryPath);
const generatedAt = new Date().toISOString();
const grouped = {};
for (const decision of template.decisions) {
  grouped[decision.category] ||= [];
  grouped[decision.category].push({
    decisionId: decision.decisionId,
    sourceSuggestionId: decision.sourceSuggestionId,
    title: decision.title,
    proposedMetadataChange: decision.proposedMetadataChange,
    selectedDecision: "",
    ownerNote: "",
    allowedDecisions: decision.allowedDecisions,
    safety: {
      metadataOnly: true,
      dryRunOnly: true,
      canAutoApply: false,
      exportApprovalImpact: false
    }
  });
}

const sheet = {
  schemaVersion: "uaos.v45.printable.decision.sheet.v1",
  generatedAt,
  metadataOnly: true,
  dryRunOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  groupedDecisions: grouped,
  safetyConfirmation: {
    notExportApproval: true,
    noKorgOutput: true,
    noUsbApproval: true,
    noKeyboardLoadApproval: true,
    noAutoApply: true
  },
  ownerSignature: "",
  ownerDate: "",
  safety: safetyBlock()
};

const options = ["accept_for_future_metadata_plan_only", "reject", "needs_more_review", "defer"];
const rows = template.decisions.map((decision) => `<tr><td>${esc(decision.decisionId)}</td><td>${esc(decision.category)}</td><td>${esc(decision.title)}</td><td>${esc(decision.proposedMetadataChange)}</td><td>${options.map(esc).join("<br>")}</td><td class="blank"></td><td class="blank"></td></tr>`).join("");
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>UAOS V45 Owner Review Form v2 Printable</title>
  <style>
    :root{--bg:#030712;--panel:#111827;--line:#2b3649;--text:#f8fafc;--cyan:#22d3ee;--amber:#f59e0b}
    *{box-sizing:border-box}body{margin:0;background:#030712;color:var(--text);font-family:Arial,Tahoma,sans-serif;line-height:1.45}
    header{padding:22px;background:#050914;border-bottom:1px solid var(--line)}h1{margin:4px 0 0}header p{margin:0;color:var(--cyan);font-weight:800}
    main{padding:16px}section{background:linear-gradient(180deg,rgba(17,24,39,.98),rgba(8,13,24,.98));border:1px solid var(--line);border-radius:8px;padding:14px;margin-bottom:14px}
    .badge{display:inline-block;border:1px solid rgba(34,211,238,.45);border-radius:999px;padding:6px 9px;margin:3px;color:var(--cyan);font-weight:800}
    table{width:100%;border-collapse:collapse;font-size:13px}td,th{border:1px solid var(--line);padding:8px;vertical-align:top}.blank{min-width:130px;height:54px;background:rgba(255,255,255,.04)}
    code{color:var(--amber)}@media print{body{background:#fff;color:#000}header,section{background:#fff;color:#000;border-color:#999}.badge{color:#000;border-color:#999}}
  </style>
</head>
<body>
  <header>
    <p>UAOS Metadata Project Generator</p>
    <h1>V45 Owner Review Form v2 Printable</h1>
    <span class="badge">LOCAL PRINTABLE FORM ONLY</span>
    <span class="badge">DOES NOT SAVE AUTOMATICALLY</span>
    <span class="badge">MANUAL REVIEW ONLY</span>
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
      <h2>Owner Instructions</h2>
      <p>This printable form does not save automatically. Use it for manual review, then edit <code>generated/UAOS_V45_MANUAL_DECISION_IMPORT_TEMPLATE.json</code> if you want to record decisions later.</p>
      <p>V43 template path: <code>../v43/generated/UAOS_V43_OWNER_DECISION_TEMPLATE.json</code></p>
      <p>V44 preview path: <code>../v44/generated/UAOS_V44_DECISION_APPLY_PREVIEW_V2.json</code></p>
      <p>V45 template path: <code>generated/UAOS_V45_MANUAL_DECISION_IMPORT_TEMPLATE.json</code></p>
    </section>
    <section>
      <h2>Decision Table</h2>
      <table><thead><tr><th>ID</th><th>Category</th><th>Title</th><th>Proposed metadata change</th><th>Allowed decisions</th><th>Selected decision</th><th>Owner note</th></tr></thead><tbody>${rows}</tbody></table>
    </section>
    <section>
      <h2>Safety Confirmation</h2>
      <p>This is not an export approval. It does not approve KORG output, USB, or keyboard load.</p>
      <p>Owner signature: ________________________________ Date: __________________</p>
    </section>
  </main>
</body>
</html>`;

const sheetMd = [
  "# UAOS V45 Printable Decision Sheet",
  "",
  "This is not an export approval.",
  "",
  "Safety confirmation:",
  "",
  "- No KORG output approval",
  "- No USB approval",
  "- No keyboard load approval",
  "- No auto-apply",
  "",
  ...Object.entries(grouped).map(([category, decisions]) => [
    `## ${category}`,
    "",
    ...decisions.map((decision) => [
      `### ${decision.decisionId} ${decision.title}`,
      "",
      `Source suggestion: ${decision.sourceSuggestionId}`,
      `Proposed metadata change: ${decision.proposedMetadataChange}`,
      `Allowed decisions: ${decision.allowedDecisions.join(", ")}`,
      "Selected decision: ",
      "Owner note: "
    ].join("\n"))
  ].join("\n\n")),
  "",
  "Owner signature: ________________________________",
  "Date: __________________"
].join("\n\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V45_OWNER_REVIEW_PRINTABLE_DECISION_SHEET.json"), JSON.stringify(sheet, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V45_OWNER_REVIEW_PRINTABLE_DECISION_SHEET.md"), sheetMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V45_OWNER_REVIEW_FORM_V2_PRINTABLE.html"), html, "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V45_OWNER_REVIEW_FORM_V2_REPORT.md"), [
  "# UAOS V45 Owner Review Form v2 Report",
  "",
  "Status: GENERATED",
  "",
  "Printable form: generated/UAOS_V45_OWNER_REVIEW_FORM_V2_PRINTABLE.html",
  "Printable decision sheet: generated/UAOS_V45_OWNER_REVIEW_PRINTABLE_DECISION_SHEET.md",
  `Pending decisions: ${summary.pendingCount}`,
  "",
  "Safety: local printable form only, manual review only, dry-run only, no export approval."
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", printableForm: "generated/UAOS_V45_OWNER_REVIEW_FORM_V2_PRINTABLE.html", decisions: template.decisions.length }, null, 2));
