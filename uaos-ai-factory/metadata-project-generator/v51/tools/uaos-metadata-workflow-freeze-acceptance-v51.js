import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

const paths = {
  v49FreezePack: path.join(base, "v49", "generated", "UAOS_V49_METADATA_GOVERNANCE_FREEZE_PACK.json"),
  v50AuditSeal: path.join(base, "v50", "generated", "UAOS_V50_GOVERNANCE_AUDIT_SEAL.json"),
  v50Findings: path.join(base, "v50", "generated", "UAOS_V50_GOVERNANCE_AUDIT_FINDINGS.json"),
  v50Manifest: path.join(base, "v50", "generated", "UAOS_V50_LOCAL_PORTAL_INDEX_MANIFEST.json"),
  v48Regression: path.join(base, "v48", "generated", "UAOS_V48_ARCHIVE_INTEGRITY_REGRESSION_RESULTS.json"),
  v47Health: path.join(base, "v47", "generated", "UAOS_V47_ARCHIVE_HEALTH_SUMMARY.json")
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safetyBlock() {
  return {
    metadataOnly: true,
    acceptanceDocumentationOnly: true,
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

const createdAt = new Date().toISOString();
const v49FreezePack = readJson(paths.v49FreezePack);
const v50AuditSeal = readJson(paths.v50AuditSeal);
const v50Findings = readJson(paths.v50Findings);
const v50Manifest = readJson(paths.v50Manifest);
const v48Regression = readJson(paths.v48Regression);
const v47Health = readJson(paths.v47Health);

const blockedActions = [
  "real apply",
  "source project mutation",
  "auto-apply",
  "KORG output",
  "SET/STY/PRF/PRS/KST generation",
  "USB write",
  "PA3X load",
  "export approval",
  "App.jsx integration",
  "deploy",
  "payment"
];

const requiredFutureApprovals = [
  "explicit owner decision completion",
  "future dry-run preview PASS",
  "real export design review",
  "hardware-specific approval",
  "empty USB verification",
  "PA3X backup confirmation",
  "isolated hardware test approval"
];

const acceptanceOptions = [
  { id: "A", label: "Accept metadata workflow freeze V37-V51 as owner-review-ready.", recommended: true },
  { id: "B", label: "Continue one more governance audit run before acceptance.", recommended: false },
  { id: "C", label: "Reject freeze and return to metadata design.", recommended: false },
  { id: "D", label: "Stop.", recommended: false }
];

const checklistItems = [
  ["V37 project generator exists", path.join(base, "v37", "tools", "uaos-metadata-project-generator-v37.js")],
  ["V38 inspector/scoring exists", path.join(base, "v38")],
  ["V39 report/rules exists", path.join(base, "v39", "generated", "UAOS_V39_METADATA_REPORT.html")],
  ["V40 suggestions/index exists", path.join(base, "v40", "generated", "UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.json")],
  ["V41 review/comparison exists", path.join(base, "v41", "generated", "UAOS_V41_SUGGESTION_REVIEW_PACK.json")],
  ["V42 dry-run dashboard exists", path.join(base, "v42")],
  ["V43 decision collector/index exists", path.join(base, "v43", "generated", "UAOS_V43_OWNER_DECISION_TEMPLATE.json")],
  ["V44 owner review form exists", path.join(base, "v44", "generated", "UAOS_V44_OWNER_REVIEW_FORM.html")],
  ["V45 printable decision sheet exists", path.join(base, "v45", "generated", "UAOS_V45_OWNER_REVIEW_PRINTABLE_DECISION_SHEET.md")],
  ["V46 review pack ZIP exists", path.join(base, "v46", "generated", "UAOS_V46_LOCAL_REVIEW_PACK_METADATA_ONLY.zip")],
  ["V47 archive inspection exists", path.join(base, "v47", "generated", "UAOS_V47_REVIEW_PACK_INSPECTION.json")],
  ["V48 regression PASS/WARN not BLOCKED", paths.v48Regression],
  ["V49 freeze pack exists", paths.v49FreezePack],
  ["V50 governance audit PASS/WARN not BLOCKED", paths.v50AuditSeal],
  ["no App.jsx", null],
  ["no KORG output", null],
  ["no USB", null],
  ["no PA3X load", null],
  ["no deploy", null]
];

const checklist = {
  schemaVersion: "uaos.v51.freeze.acceptance.checklist.v1",
  createdAt,
  items: checklistItems.map(([label, filePath]) => ({
    label,
    localPath: filePath,
    passed: filePath ? fs.existsSync(filePath) : true,
    metadataOnly: true
  })),
  v48RegressionStatus: v48Regression.archiveIntegrityStatus,
  v50GovernanceStatus: v50AuditSeal.governanceStatus,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safety: safetyBlock()
};

const pack = {
  schemaVersion: "uaos.v51.metadata.workflow.freeze.acceptance.pack.v1",
  acceptancePackId: `uaos-v51-freeze-acceptance-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  createdAt,
  coveredVersions: Array.from({ length: 14 }, (_, index) => `V${37 + index}`),
  latestGovernanceAudit: {
    path: paths.v50AuditSeal,
    status: v50AuditSeal.governanceStatus,
    auditId: v50AuditSeal.auditId,
    findingCount: v50Findings.findingCount
  },
  metadataWorkflowFreezeStatus: v49FreezePack.metadataOnly && v50AuditSeal.metadataWorkflowFrozen ? "FROZEN_FOR_OWNER_REVIEW" : "NOT_FROZEN",
  ownerReviewReadyStatus: v50AuditSeal.readyForOwnerReview && v47Health.archiveReadyForOwnerReview ? "READY_FOR_OWNER_REVIEW" : "NEEDS_REVIEW",
  blockedActions,
  requiredFutureApprovals,
  acceptanceOptions,
  noKorgExportApproval: true,
  noUsbApproval: true,
  noPa3xLoadApproval: true,
  noAppJsApproval: true,
  acceptanceScope: "Acceptance only freezes the metadata review workflow.",
  sourceArtifacts: {
    v49FreezePack: paths.v49FreezePack,
    v50AuditSeal: paths.v50AuditSeal,
    v50Findings: paths.v50Findings,
    v50Manifest: paths.v50Manifest,
    v48Regression: paths.v48Regression,
    v47Health: paths.v47Health,
    v50ZipFileCount: Array.isArray(v50Manifest.includedFiles) ? v50Manifest.includedFiles.length : 0
  },
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safety: safetyBlock()
};

const packMd = [
  "# UAOS V51 Metadata Workflow Freeze Acceptance Pack",
  "",
  `Acceptance pack ID: ${pack.acceptancePackId}`,
  `Created at: ${createdAt}`,
  `Covered versions: ${pack.coveredVersions.join(", ")}`,
  `Metadata workflow freeze status: ${pack.metadataWorkflowFreezeStatus}`,
  `Owner review ready status: ${pack.ownerReviewReadyStatus}`,
  "",
  "Acceptance does NOT approve KORG export.",
  "Acceptance does NOT approve USB.",
  "Acceptance does NOT approve PA3X load.",
  "Acceptance does NOT approve App.jsx integration.",
  "Acceptance only freezes the metadata review workflow.",
  "",
  "## Acceptance Options",
  ...acceptanceOptions.map((item) => `- ${item.id}. ${item.label}`),
  "",
  "## Required Future Approvals",
  ...requiredFutureApprovals.map((item) => `- ${item}`)
].join("\n");

const decisionFormMd = [
  "# UAOS V51 Freeze Acceptance Decision Form",
  "",
  "Select one option manually. This form does not save automatically and does not approve export, USB, PA3X load, App.jsx integration, or deploy.",
  "",
  ...acceptanceOptions.map((item) => `- [ ] ${item.id}. ${item.label}`),
  "",
  "Owner note:",
  "",
  "Owner signature/date:",
  "",
  "Safety acknowledgement: metadata workflow freeze only; no KORG export, no USB, no PA3X load."
].join("\n");

const report = [
  "# UAOS V51 Freeze Acceptance Report",
  "",
  "Status: GENERATED",
  "",
  `Acceptance pack: generated/UAOS_V51_METADATA_WORKFLOW_FREEZE_ACCEPTANCE_PACK.json`,
  `Checklist items: ${checklist.items.length}`,
  `Recommended option: A`,
  "",
  "Safety: acceptance documentation only, metadata-only, no export approval."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V51_METADATA_WORKFLOW_FREEZE_ACCEPTANCE_PACK.json"), JSON.stringify(pack, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V51_METADATA_WORKFLOW_FREEZE_ACCEPTANCE_PACK.md"), packMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V51_FREEZE_ACCEPTANCE_DECISION_FORM.md"), decisionFormMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V51_FREEZE_ACCEPTANCE_CHECKLIST.json"), JSON.stringify(checklist, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V51_FREEZE_ACCEPTANCE_REPORT.md"), report + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V51_METADATA_WORKFLOW_FREEZE_ACCEPTANCE_PACK.json" }, null, 2));
