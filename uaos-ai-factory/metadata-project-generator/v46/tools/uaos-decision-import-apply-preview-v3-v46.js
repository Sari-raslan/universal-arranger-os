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
  v43DecisionTemplate: path.join(base, "v43", "generated", "UAOS_V43_OWNER_DECISION_TEMPLATE.json"),
  v44ApplyPreview: path.join(base, "v44", "generated", "UAOS_V44_DECISION_APPLY_PREVIEW_V2.json"),
  v44DryrunProject: path.join(base, "v44", "generated", "UAOS_V44_DRYRUN_PROJECT_AFTER_DECISION_PREVIEW.uaosproject.json"),
  v45ImportTemplate: path.join(base, "v45", "generated", "UAOS_V45_MANUAL_DECISION_IMPORT_TEMPLATE.json"),
  v45DryrunSummary: path.join(base, "v45", "generated", "UAOS_V45_IMPORTED_DECISION_DRYRUN_SUMMARY.json")
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
    sourceProjectModified: false,
    autoApplyEnabled: false,
    realApplyAllowed: false,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false,
    exportApprovalImpact: false
  };
}

function countByDecision(decisions, value) {
  return decisions.filter((item) => item.selectedDecision === value).length;
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const generatedAt = new Date().toISOString();
const sourceProject = readJson(paths.v37Project);
const v43DecisionTemplate = readJson(paths.v43DecisionTemplate);
const v44ApplyPreview = readJson(paths.v44ApplyPreview);
const v45ImportTemplate = readJson(paths.v45ImportTemplate);
const v45DryrunSummary = readJson(paths.v45DryrunSummary);
const decisions = v45ImportTemplate.decisions || [];
const allPending = decisions.length > 0 && decisions.every((item) => item.selectedDecision === "pending");

const sourceHashes = {
  v37ProjectSha256Before: sha256(paths.v37Project),
  v42DryrunProjectSha256Before: sha256(paths.v42DryrunProject),
  v44DryrunProjectSha256Before: sha256(paths.v44DryrunProject)
};

const skippedPendingChanges = decisions
  .filter((item) => item.selectedDecision === "pending")
  .map((item) => ({
    decisionId: item.decisionId,
    sourceReviewItemId: item.sourceReviewItemId,
    sourceSuggestionId: item.sourceSuggestionId,
    category: item.category,
    title: item.title,
    proposedMetadataChange: item.proposedMetadataChange,
    selectedDecision: item.selectedDecision,
    skippedReason: "owner_decision_pending"
  }));

const preview = {
  schemaVersion: "uaos.v46.decision.import.apply.preview.v3",
  generatedAt,
  previewId: `uaos-v46-preview-v3-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  sourceProjectPath: "../v37/generated/UAOS_EXAMPLE_PROJECT_V37.uaosproject.json",
  importedDecisionTemplatePath: "../v45/generated/UAOS_V45_MANUAL_DECISION_IMPORT_TEMPLATE.json",
  v43DecisionTemplatePath: "../v43/generated/UAOS_V43_OWNER_DECISION_TEMPLATE.json",
  v44ApplyPreviewPath: "../v44/generated/UAOS_V44_DECISION_APPLY_PREVIEW_V2.json",
  v45DryrunSummaryPath: "../v45/generated/UAOS_V45_IMPORTED_DECISION_DRYRUN_SUMMARY.json",
  acceptedDecisionCount: countByDecision(decisions, "accept_for_future_metadata_plan_only"),
  pendingDecisionCount: countByDecision(decisions, "pending"),
  rejectedDecisionCount: countByDecision(decisions, "reject"),
  deferredDecisionCount: countByDecision(decisions, "defer"),
  needsMoreReviewCount: countByDecision(decisions, "needs_more_review"),
  appliedPreviewChanges: [],
  skippedPendingChanges,
  ownerDecisionStatus: allPending ? "owner_decisions_pending" : "owner_decisions_mixed",
  ownerDecisionNote: allPending
    ? "All imported/manual decisions are still pending; no metadata changes are applied in this preview."
    : "Only accepted decisions would be previewed; this run still performs no real apply.",
  beforeSummary: {
    projectId: sourceProject.projectId,
    projectName: sourceProject.projectName,
    trackCount: Array.isArray(sourceProject.tracks) ? sourceProject.tracks.length : 0,
    targetKeyboard: sourceProject.targetKeyboard,
    sourceMode: sourceProject.sourceMode,
    sourceHashes,
    v43DecisionCount: Array.isArray(v43DecisionTemplate.decisions) ? v43DecisionTemplate.decisions.length : 0,
    v44AcceptedDecisionCount: v44ApplyPreview.acceptedDecisionCount,
    v45PendingCount: v45DryrunSummary.pendingCount
  },
  afterPreviewSummary: {
    previewArtifact: true,
    acceptedChangeCount: 0,
    skippedPendingCount: skippedPendingChanges.length,
    sourceProjectModified: false,
    dryRunOnly: true,
    metadataOnly: true,
    approvedForKorgExport: false,
    approvedForUsb: false,
    approvedForKeyboardLoad: false
  },
  dryRunOnly: true,
  metadataOnly: true,
  sourceProjectModified: false,
  autoApplyEnabled: false,
  realApplyAllowed: false,
  humanReviewRequired: true,
  exportApprovalImpact: false,
  korgOutputAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  safety: safetyBlock()
};

const diffSummary = {
  schemaVersion: "uaos.v46.preview.v3.diff.summary.v1",
  generatedAt,
  previewId: preview.previewId,
  changedFieldsPreview: [],
  unchangedFields: [
    "schemaVersion",
    "projectId",
    "projectName",
    "createdAt",
    "sourceMode",
    "targetKeyboard",
    "musicalIntent",
    "tracks",
    "links",
    "safety"
  ],
  pendingOwnerDecisions: skippedPendingChanges.map((item) => item.decisionId),
  acceptedChanges: [],
  rejectedChanges: [],
  deferredChanges: [],
  needsMoreReviewChanges: [],
  blockedActions: [
    "real apply",
    "source project mutation",
    "auto-apply",
    "KORG output",
    "SET modification",
    "USB write",
    "keyboard load",
    "export approval",
    "deploy"
  ],
  dryRunOnly: true,
  metadataOnly: true,
  sourceProjectModified: false,
  autoApplyEnabled: false,
  realApplyAllowed: false,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  safety: safetyBlock()
};

const dryrunProject = {
  ...sourceProject,
  previewArtifact: true,
  previewSource: "UAOS V46 decision import apply preview v3",
  previewCreatedAt: generatedAt,
  sourceProjectModified: false,
  dryRunOnly: true,
  metadataOnly: true,
  decisionsAppliedInPreviewOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  compatibilityClaim: false,
  pa3xReadyClaim: false,
  appliedPreviewChanges: [],
  skippedPendingChanges,
  sourceHashes,
  safety: {
    ...sourceProject.safety,
    metadataOnly: true,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false
  }
};

const nextMatrix = {
  schemaVersion: "uaos.v46.next.recommendation.matrix.v1",
  generatedAt,
  metadataOnly: true,
  dryRunOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V47 Review Pack Reader / Inspector", safety: "metadata-only", recommended: true },
    { id: "B", action: "V47 Owner Decision Filled Example", safety: "sample and dry-run only", recommended: false },
    { id: "C", action: "V47 Local Archive Index V37-V46", safety: "no App.jsx, no deploy", recommended: true },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["A", "C"],
  safety: safetyBlock()
};

const previewMd = [
  "# UAOS V46 Decision Import Apply Preview V3",
  "",
  "Status: DRY-RUN ONLY",
  "",
  `Preview ID: ${preview.previewId}`,
  `Accepted decisions: ${preview.acceptedDecisionCount}`,
  `Pending decisions: ${preview.pendingDecisionCount}`,
  `Rejected decisions: ${preview.rejectedDecisionCount}`,
  `Deferred decisions: ${preview.deferredDecisionCount}`,
  `Needs more review: ${preview.needsMoreReviewCount}`,
  "",
  "All imported/manual decisions are still pending, so zero metadata changes are accepted for this preview.",
  "",
  "Safety: metadata-only, no real apply, no source project mutation, no auto-apply, no KORG output, no USB write, no keyboard load."
].join("\n");

const diffMd = [
  "# UAOS V46 Preview V3 Diff Summary",
  "",
  "Changed fields: 0",
  `Skipped pending changes: ${skippedPendingChanges.length}`,
  "",
  "The dry-run project is a separate preview artifact. The V37 source project, V42 dry-run project, and V44 dry-run project are not replaced or modified.",
  "",
  "Blocked actions: real apply, source mutation, auto-apply, export approval, USB write, keyboard load, deploy."
].join("\n");

const reportMd = [
  "# UAOS V46 Decision Import Apply Preview V3 Report",
  "",
  "Status: GENERATED",
  "",
  `Preview: generated/UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.json`,
  `Diff summary: generated/UAOS_V46_PREVIEW_V3_DIFF_SUMMARY.json`,
  `Dry-run preview project: generated/UAOS_V46_DRYRUN_PROJECT_AFTER_IMPORT_PREVIEW_V3.uaosproject.json`,
  "",
  "Accepted changes: 0",
  `Pending decisions: ${preview.pendingDecisionCount}`,
  "",
  "Safety: dry-run only, metadata-only, source project not modified, no export approval."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.json"), JSON.stringify(preview, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.md"), previewMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V46_PREVIEW_V3_DIFF_SUMMARY.json"), JSON.stringify(diffSummary, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V46_PREVIEW_V3_DIFF_SUMMARY.md"), diffMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V46_DRYRUN_PROJECT_AFTER_IMPORT_PREVIEW_V3.uaosproject.json"), JSON.stringify(dryrunProject, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V46_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(nextMatrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3_REPORT.md"), reportMd + "\n", "utf8");

if (sha256(paths.v37Project) !== sourceHashes.v37ProjectSha256Before) throw new Error("V37 source project changed.");
if (sha256(paths.v42DryrunProject) !== sourceHashes.v42DryrunProjectSha256Before) throw new Error("V42 dry-run project changed.");
if (sha256(paths.v44DryrunProject) !== sourceHashes.v44DryrunProjectSha256Before) throw new Error("V44 dry-run project changed.");

console.log(JSON.stringify({ status: "GENERATED", preview: "generated/UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.json" }, null, 2));
