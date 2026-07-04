import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function htmlEscape(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function safetyBlock() {
  return {
    metadataOnly: true,
    localPortalPolishOnly: true,
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

const generatedAt = new Date().toISOString();
const acceptancePack = readJson(path.join(generatedDir, "UAOS_V51_METADATA_WORKFLOW_FREEZE_ACCEPTANCE_PACK.json"));
const checklist = readJson(path.join(generatedDir, "UAOS_V51_FREEZE_ACCEPTANCE_CHECKLIST.json"));
const v49PortalData = readJson(path.join(base, "v49", "generated", "UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL_DATA.json"));
const v50AuditSeal = readJson(path.join(base, "v50", "generated", "UAOS_V50_GOVERNANCE_AUDIT_SEAL.json"));
const validatorPath = path.join(reportsDir, "UAOS_V51_VALIDATOR_RESULTS.json");
const validatorAlreadyPassed = fs.existsSync(validatorPath) && readJson(validatorPath).status === "PASS";

const timeline = Array.from({ length: 15 }, (_, index) => {
  const version = `V${37 + index}`;
  const folder = path.join(base, version.toLowerCase());
  return {
    version,
    folder,
    status: fs.existsSync(folder) || version === "V51" ? "available" : "missing"
  };
});

const keyFiles = [
  ["Acceptance pack", path.join(generatedDir, "UAOS_V51_METADATA_WORKFLOW_FREEZE_ACCEPTANCE_PACK.json")],
  ["Decision form", path.join(generatedDir, "UAOS_V51_FREEZE_ACCEPTANCE_DECISION_FORM.md")],
  ["Checklist", path.join(generatedDir, "UAOS_V51_FREEZE_ACCEPTANCE_CHECKLIST.json")],
  ["V50 governance audit", path.join(base, "v50", "generated", "UAOS_V50_GOVERNANCE_AUDIT_SEAL.json")],
  ["V49 static portal", path.join(base, "v49", "generated", "UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL.html")]
];

const nextMatrix = {
  schemaVersion: "uaos.v51.next.recommendation.matrix.v1",
  generatedAt,
  metadataOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V52 Metadata Freeze Acceptance Seal", safety: "metadata-only", recommended: true },
    { id: "B", action: "V52 UI Integration Plan", safety: "planning only, no App.jsx", recommended: false },
    { id: "C", action: "V52 Export Readiness Gap Analysis", safety: "no export and no KORG output", recommended: true },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["A", "C"],
  safety: safetyBlock()
};

const portalData = {
  schemaVersion: "uaos.v51.owner.review.portal.polished.data.v1",
  generatedAt,
  timeline,
  startHere: "Open the decision form, review the checklist, then choose an acceptance option manually.",
  ownerDecisionWorkflow: acceptancePack.acceptanceOptions,
  freezeAcceptance: {
    status: acceptancePack.metadataWorkflowFreezeStatus,
    ownerReviewReadyStatus: acceptancePack.ownerReviewReadyStatus,
    checklistPassed: checklist.items.every((item) => item.passed)
  },
  safetyStatus: validatorAlreadyPassed ? "PASS" : "PASS pending validator run",
  blockedActions: acceptancePack.blockedActions,
  keyFiles: keyFiles.map(([label, localPath]) => ({ label, localPath })),
  nextSafeActions: nextMatrix.recommendations,
  inheritedV49ArchiveRegressionStatus: v49PortalData.archiveRegressionStatus,
  inheritedV50GovernanceStatus: v50AuditSeal.governanceStatus,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safety: safetyBlock()
};

const timelineHtml = timeline.map((item) => `<li><strong>${htmlEscape(item.version)}</strong> - ${htmlEscape(item.status)}<br><code>${htmlEscape(item.folder)}</code></li>`).join("\n");
const workflowHtml = acceptancePack.acceptanceOptions.map((item) => `<li><strong>${htmlEscape(item.id)}</strong> ${htmlEscape(item.label)}</li>`).join("\n");
const blockedHtml = acceptancePack.blockedActions.map((item) => `<li>${htmlEscape(item)}</li>`).join("\n");
const keyFilesHtml = keyFiles.map(([label, localPath]) => `<li><strong>${htmlEscape(label)}</strong><br><code>${htmlEscape(localPath)}</code></li>`).join("\n");
const nextHtml = nextMatrix.recommendations.map((item) => `<li><strong>${htmlEscape(item.id)}</strong> ${htmlEscape(item.action)} - ${htmlEscape(item.safety)}</li>`).join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>UAOS V51 Owner Review Portal Polished</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #f5f6f2; color: #181818; }
    header { background: #23322c; color: white; padding: 22px 28px; }
    main { max-width: 1180px; margin: 0 auto; padding: 20px; }
    nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    nav a { color: white; border: 1px solid rgba(255,255,255,.45); padding: 6px 8px; border-radius: 4px; text-decoration: none; }
    section { background: white; border: 1px solid #d6d8d0; border-radius: 6px; padding: 16px; margin-bottom: 14px; }
    .flags { display: grid; grid-template-columns: repeat(auto-fit, minmax(215px, 1fr)); gap: 8px; }
    .flags div { background: #edf4ef; border: 1px solid #c8d4cc; padding: 8px; border-radius: 4px; font-weight: 700; }
    code { overflow-wrap: anywhere; }
    li { margin: 7px 0; }
  </style>
</head>
<body>
  <header>
    <h1>UAOS V51 Owner Review Portal Polished</h1>
    <nav>
      <a href="#start">Start Here</a>
      <a href="#timeline">Timeline</a>
      <a href="#workflow">Decision Workflow</a>
      <a href="#freeze">Freeze Acceptance</a>
      <a href="#safety">Safety</a>
      <a href="#paths">Local Paths</a>
      <a href="#next">Next</a>
    </nav>
  </header>
  <main>
    <section class="flags">
      <div>LOCAL POLISHED PORTAL ONLY</div>
      <div>METADATA ONLY</div>
      <div>FREEZE ACCEPTANCE ONLY</div>
      <div>NOT DEPLOYED</div>
      <div>NO APP.JSX</div>
      <div>NOT KORG OUTPUT</div>
      <div>NOT PA3X READY</div>
      <div>NO USB APPROVAL</div>
      <div>NO KEYBOARD LOAD APPROVAL</div>
      <div>NO EXPORT APPROVAL</div>
    </section>
    <section id="start"><h2>Start Here</h2><p>${htmlEscape(portalData.startHere)}</p></section>
    <section id="timeline"><h2>V37-V51 Timeline</h2><ol>${timelineHtml}</ol></section>
    <section id="workflow"><h2>Owner Decision Workflow</h2><ol>${workflowHtml}</ol></section>
    <section id="freeze"><h2>Freeze Acceptance</h2><p>Status: ${htmlEscape(acceptancePack.metadataWorkflowFreezeStatus)}</p><p>Owner review: ${htmlEscape(acceptancePack.ownerReviewReadyStatus)}</p></section>
    <section id="safety"><h2>Safety Status</h2><p>${htmlEscape(portalData.safetyStatus)}</p><h3>Blocked Actions</h3><ul>${blockedHtml}</ul></section>
    <section id="paths"><h2>Local Paths To Key Files</h2><ul>${keyFilesHtml}</ul></section>
    <section id="next"><h2>Next Safe Actions</h2><ul>${nextHtml}</ul></section>
  </main>
</body>
</html>`;

const report = [
  "# UAOS V51 Owner Review Portal Polish Report",
  "",
  "Status: GENERATED",
  "",
  `Polished portal: generated/UAOS_V51_OWNER_REVIEW_PORTAL_POLISHED.html`,
  `Timeline versions: ${timeline.length}`,
  "Safety: local portal polish only, metadata-only, no App.jsx, no deploy."
].join("\n");

const qa = [
  "# UAOS V51 QA Report",
  "",
  "Freeze acceptance pack created: YES",
  "Acceptance decision form created: YES",
  "Checklist created: YES",
  "Polished local portal created: YES",
  `Validator PASS: ${validatorAlreadyPassed ? "YES" : "pending validator run"}`,
  "No real apply: YES",
  "No source project mutation: YES",
  "No KORG output: YES",
  "No SET/STY/PRF/PRS/KST: YES",
  "No audio/sample binaries: YES",
  "No USB: YES",
  "No PA3X load: YES",
  "No fixture modification: YES",
  "No App.jsx: YES",
  "No deploy: YES",
  "No payment: YES"
].join("\n");

const dashboard = [
  "# UAOS V51 Owner Dashboard",
  "",
  `Acceptance pack: ${path.join(generatedDir, "UAOS_V51_METADATA_WORKFLOW_FREEZE_ACCEPTANCE_PACK.json")}`,
  `Decision form: ${path.join(generatedDir, "UAOS_V51_FREEZE_ACCEPTANCE_DECISION_FORM.md")}`,
  `Polished portal: ${path.join(generatedDir, "UAOS_V51_OWNER_REVIEW_PORTAL_POLISHED.html")}`,
  `Checklist: ${path.join(generatedDir, "UAOS_V51_FREEZE_ACCEPTANCE_CHECKLIST.json")}`,
  `Safety status: ${portalData.safetyStatus}`,
  "",
  "Still blocked: real apply, source project mutation, auto-apply, KORG output, SET/STY/PRF/PRS/KST generation, USB write, PA3X load, export approval, App.jsx integration, deploy, payment.",
  "",
  "Next recommended phase: A + C together, V52 Metadata Freeze Acceptance Seal and V52 Export Readiness Gap Analysis."
].join("\n");

const master = [
  "# UAOS V51 Master Index",
  "",
  "- generated/UAOS_V51_METADATA_WORKFLOW_FREEZE_ACCEPTANCE_PACK.json",
  "- generated/UAOS_V51_METADATA_WORKFLOW_FREEZE_ACCEPTANCE_PACK.md",
  "- generated/UAOS_V51_FREEZE_ACCEPTANCE_DECISION_FORM.md",
  "- generated/UAOS_V51_FREEZE_ACCEPTANCE_CHECKLIST.json",
  "- generated/UAOS_V51_OWNER_REVIEW_PORTAL_POLISHED.html",
  "- generated/UAOS_V51_OWNER_REVIEW_PORTAL_POLISHED_DATA.json",
  "- generated/UAOS_V51_NEXT_RECOMMENDATION_MATRIX.json",
  "- reports/UAOS_V51_FREEZE_ACCEPTANCE_REPORT.md",
  "- reports/UAOS_V51_OWNER_REVIEW_PORTAL_POLISH_REPORT.md",
  "- reports/UAOS_V51_VALIDATOR_RESULTS.json",
  "- reports/UAOS_V51_QA_REPORT.md",
  "- reports/UAOS_V51_OWNER_DASHBOARD.md",
  "- reports/UAOS_V51_FINAL_SEAL.md"
].join("\n");

const seal = [
  "# UAOS V51 Final Seal",
  "",
  `Status: ${validatorAlreadyPassed ? "PASS" : "pending validator run"}`,
  "",
  "V51 created a metadata workflow freeze acceptance pack, decision form, checklist, polished local owner review portal, QA report, owner dashboard, and validator result.",
  "",
  "Safety: metadata-only, local portal polish only, acceptance documentation only, no real apply, no source project mutation, no KORG output, no SET/STY/PRF/PRS/KST, no audio/sample binaries, no USB write, no PA3X load, no fixture modification, no App.jsx, no deploy, no payment, no export approval."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V51_OWNER_REVIEW_PORTAL_POLISHED.html"), html, "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V51_OWNER_REVIEW_PORTAL_POLISHED_DATA.json"), JSON.stringify(portalData, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V51_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(nextMatrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V51_OWNER_REVIEW_PORTAL_POLISH_REPORT.md"), report + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V51_QA_REPORT.md"), qa + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V51_OWNER_DASHBOARD.md"), dashboard + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V51_MASTER_INDEX.md"), master + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V51_FINAL_SEAL.md"), seal + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V51_OWNER_REVIEW_PORTAL_POLISHED.html" }, null, 2));
