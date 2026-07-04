import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

const paths = {
  v37Project: path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
  v42DryrunProject: path.join(base, "v42", "generated", "UAOS_V42_DRYRUN_PROJECT_AFTER_PREVIEW.uaosproject.json"),
  v44DryrunProject: path.join(base, "v44", "generated", "UAOS_V44_DRYRUN_PROJECT_AFTER_DECISION_PREVIEW.uaosproject.json"),
  v43DecisionTemplate: path.join(base, "v43", "generated", "UAOS_V43_OWNER_DECISION_TEMPLATE.json"),
  v44ApplyPreview: path.join(base, "v44", "generated", "UAOS_V44_DECISION_APPLY_PREVIEW_V2.json"),
  v44FormData: path.join(base, "v44", "generated", "UAOS_V44_OWNER_REVIEW_FORM_DATA.json")
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function safetyBlock() {
  return {
    metadataOnly: true,
    dryRunOnly: true,
    manualDecisionImportOnly: true,
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

const decisionTemplate = readJson(paths.v43DecisionTemplate);
const preview = readJson(paths.v44ApplyPreview);
const formData = fs.existsSync(paths.v44FormData) ? readJson(paths.v44FormData) : null;
const createdAt = new Date().toISOString();
const sourceHashes = {
  v37ProjectSha256: sha256(paths.v37Project),
  v42DryrunProjectSha256: sha256(paths.v42DryrunProject),
  v44DryrunProjectSha256: sha256(paths.v44DryrunProject)
};

const decisions = decisionTemplate.decisions.map((item) => ({
  decisionId: item.decisionId,
  sourceReviewItemId: item.sourceReviewItemId,
  sourceSuggestionId: item.sourceSuggestionId,
  category: item.category,
  title: item.title,
  proposedMetadataChange: item.proposedMetadataChange,
  selectedDecision: "pending",
  allowedDecisions: [
    "accept_for_future_metadata_plan_only",
    "reject",
    "needs_more_review",
    "defer"
  ],
  ownerNote: "",
  signatureRequired: false,
  canAutoApply: false,
  metadataOnly: true,
  dryRunOnly: true,
  realApplyAllowed: false,
  exportApprovalImpact: false,
  korgOutputAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false
}));

const importTemplate = {
  schemaVersion: "uaos.manual.decision.import.v1",
  importTemplateId: `uaos-v45-manual-import-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  createdAt,
  metadataOnly: true,
  dryRunOnly: true,
  sourceDecisionTemplatePath: "../v43/generated/UAOS_V43_OWNER_DECISION_TEMPLATE.json",
  sourcePreviewPath: "../v44/generated/UAOS_V44_DECISION_APPLY_PREVIEW_V2.json",
  sourceFormDataAvailable: Boolean(formData),
  sourceHashes,
  manualDecisionInstructions: [
    "Edit selectedDecision manually using one allowed value.",
    "Keep canAutoApply false.",
    "This template does not apply metadata.",
    "This template does not approve export, USB, or keyboard load."
  ],
  decisions,
  safety: safetyBlock()
};

const dryrunSummary = {
  schemaVersion: "uaos.v45.imported.decision.dryrun.summary.v1",
  createdAt,
  metadataOnly: true,
  dryRunOnly: true,
  totalDecisions: decisions.length,
  pendingCount: decisions.length,
  acceptedForFutureMetadataPlanOnlyCount: 0,
  rejectedCount: 0,
  needsMoreReviewCount: 0,
  deferredCount: 0,
  allDecisionsRemainPending: true,
  changesImported: false,
  previewChangesApplied: false,
  readyForDryRunApply: false,
  readyForRealApply: false,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  v44AcceptedDecisionCount: preview.acceptedDecisionCount,
  sourceHashes,
  safety: safetyBlock()
};

const nextMatrix = {
  schemaVersion: "uaos.v45.next.recommendation.matrix.v1",
  createdAt,
  metadataOnly: true,
  dryRunOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V46 Owner Decision Filled Example", safety: "dry-run sample only", recommended: false },
    { id: "B", action: "V46 Decision Import Apply Preview v3", safety: "dry-run only", recommended: true },
    { id: "C", action: "V46 Local Review Pack ZIP Builder", safety: "no source mutation, no deploy", recommended: true },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["B", "C"],
  safety: safetyBlock()
};

const importTemplateMd = [
  "# UAOS V45 Manual Decision Import Template",
  "",
  "Manual decision import only. This does not apply metadata, does not approve export, and does not save automatically.",
  "",
  "Allowed decisions:",
  "",
  "- accept_for_future_metadata_plan_only",
  "- reject",
  "- needs_more_review",
  "- defer",
  "",
  ...decisions.map((item) => [
    `## ${item.decisionId} ${item.title}`,
    "",
    `- Source suggestion: ${item.sourceSuggestionId}`,
    `- Category: ${item.category}`,
    `- Selected decision: ${item.selectedDecision}`,
    `- Owner note: ${item.ownerNote}`,
    `- Proposed metadata change: ${item.proposedMetadataChange}`,
    "- Safety: metadata-only, dry-run only, canAutoApply false"
  ].join("\n"))
].join("\n\n");

const dryrunSummaryMd = [
  "# UAOS V45 Imported Decision Dry-run Summary",
  "",
  "All decisions remain pending.",
  "No changes imported.",
  "No preview changes applied.",
  "",
  `Total decisions: ${dryrunSummary.totalDecisions}`,
  `Pending decisions: ${dryrunSummary.pendingCount}`,
  "Ready for dry-run apply: NO",
  "Ready for real apply: NO",
  "Ready for KORG export: NO",
  "Ready for USB: NO",
  "Ready for keyboard load: NO"
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V45_MANUAL_DECISION_IMPORT_TEMPLATE.json"), JSON.stringify(importTemplate, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V45_MANUAL_DECISION_IMPORT_TEMPLATE.md"), importTemplateMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V45_IMPORTED_DECISION_DRYRUN_SUMMARY.json"), JSON.stringify(dryrunSummary, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V45_IMPORTED_DECISION_DRYRUN_SUMMARY.md"), dryrunSummaryMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V45_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(nextMatrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V45_MANUAL_DECISION_IMPORTER_REPORT.md"), [
  "# UAOS V45 Manual Decision Importer Report",
  "",
  "Status: GENERATED",
  "",
  `Decision items: ${decisions.length}`,
  "Imported changes: 0",
  "Preview changes applied: 0",
  "",
  "Safety: manual import template only, dry-run only, no real apply, no auto-apply, no export approval."
].join("\n") + "\n", "utf8");

if (sha256(paths.v37Project) !== sourceHashes.v37ProjectSha256) throw new Error("V37 source project changed.");
if (sha256(paths.v42DryrunProject) !== sourceHashes.v42DryrunProjectSha256) throw new Error("V42 dry-run project changed.");
if (sha256(paths.v44DryrunProject) !== sourceHashes.v44DryrunProjectSha256) throw new Error("V44 dry-run project changed.");

console.log(JSON.stringify({ status: "GENERATED", decisions: decisions.length, output: "generated/UAOS_V45_MANUAL_DECISION_IMPORT_TEMPLATE.json" }, null, 2));
