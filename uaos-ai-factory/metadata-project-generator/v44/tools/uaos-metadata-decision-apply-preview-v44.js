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
  sourceProject: path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
  reviewPack: path.join(base, "v41", "generated", "UAOS_V41_SUGGESTION_REVIEW_PACK.json"),
  v42Preview: path.join(base, "v42", "generated", "UAOS_V42_METADATA_APPLY_SIMULATION_PREVIEW.json"),
  v42DryrunProject: path.join(base, "v42", "generated", "UAOS_V42_DRYRUN_PROJECT_AFTER_PREVIEW.uaosproject.json"),
  decisionTemplate: path.join(base, "v43", "generated", "UAOS_V43_OWNER_DECISION_TEMPLATE.json"),
  decisionSummary: path.join(base, "v43", "generated", "UAOS_V43_OWNER_DECISION_VALIDATION_SUMMARY.json")
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
    exportApproval: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const sourceProject = readJson(paths.sourceProject);
const reviewPack = readJson(paths.reviewPack);
const v42Preview = readJson(paths.v42Preview);
const decisionTemplate = readJson(paths.decisionTemplate);
const decisionSummary = readJson(paths.decisionSummary);
const generatedAt = new Date().toISOString();
const sourceProjectSha256Before = sha256(paths.sourceProject);
const v42DryrunSha256Before = sha256(paths.v42DryrunProject);

const decisions = decisionTemplate.decisions;
const accepted = decisions.filter((item) => item.selectedDecision === "accept_for_future_metadata_plan_only");
const rejected = decisions.filter((item) => item.selectedDecision === "reject");
const deferred = decisions.filter((item) => item.selectedDecision === "defer");
const needsMoreReview = decisions.filter((item) => item.selectedDecision === "needs_more_review");
const pending = decisions.filter((item) => item.selectedDecision === "pending");
const pendingNote = "All owner decisions are pending; no metadata changes are applied in this preview.";

const skippedPendingChanges = pending.map((item) => ({
  decisionId: item.decisionId,
  sourceReviewItemId: item.sourceReviewItemId,
  sourceSuggestionId: item.sourceSuggestionId,
  category: item.category,
  title: item.title,
  proposedMetadataChange: item.proposedMetadataChange,
  selectedDecision: item.selectedDecision,
  skippedReason: "pending_owner_decision"
}));

const preview = {
  schemaVersion: "uaos.v44.decision.apply.preview.v2",
  generatedAt,
  previewId: `uaos-v44-preview-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  sourceProjectPath: "../v37/generated/UAOS_EXAMPLE_PROJECT_V37.uaosproject.json",
  ownerDecisionTemplatePath: "../v43/generated/UAOS_V43_OWNER_DECISION_TEMPLATE.json",
  acceptedDecisionCount: accepted.length,
  pendingDecisionCount: pending.length,
  rejectedDecisionCount: rejected.length,
  deferredDecisionCount: deferred.length,
  needsMoreReviewCount: needsMoreReview.length,
  appliedPreviewChanges: [],
  skippedPendingChanges,
  note: pending.length === decisions.length ? pendingNote : "Only accepted decisions would appear in preview changes; none are applied to source.",
  beforeSummary: {
    projectId: sourceProject.projectId,
    projectName: sourceProject.projectName,
    trackCount: sourceProject.tracks.length,
    sourceProjectSha256Before,
    v42DryrunSha256Before
  },
  afterPreviewSummary: {
    previewArtifact: true,
    acceptedChangeCount: accepted.length,
    skippedPendingCount: pending.length,
    sourceProjectModified: false,
    dryRunOnly: true,
    metadataOnly: true
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

const diff = {
  schemaVersion: "uaos.v44.preview.diff.summary.v1",
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
  pendingOwnerDecisions: pending.map((item) => item.decisionId),
  blockedActions: [
    "real apply",
    "source project mutation",
    "auto-apply",
    "KORG output",
    "SET modification",
    "USB approval",
    "keyboard load approval",
    "deploy"
  ],
  riskNotes: [
    pendingNote,
    "Preview v2 is separate from the source project.",
    "No V42 dry-run project mutation occurred.",
    "No export approval is created."
  ],
  nextSafeActions: [
    "Collect manual owner decisions in V45.",
    "Create a printable owner review form v2.",
    "Keep all hardware and export gates closed."
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
  previewSource: "UAOS V44 decision apply preview v2",
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
  v41ReviewItemCount: reviewPack.reviewItems.length,
  v42PendingOwnerDecisions: v42Preview.pendingOwnerDecisions,
  v43DecisionSummary: {
    totalDecisions: decisionSummary.totalDecisions,
    pendingCount: decisionSummary.pendingCount
  },
  sourceProjectSha256Before,
  v42DryrunSha256Before,
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
  schemaVersion: "uaos.v44.next.recommendation.matrix.v1",
  generatedAt,
  metadataOnly: true,
  dryRunOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V45 Manual Decision Importer", safety: "metadata-only dry-run", recommended: true },
    { id: "B", action: "V45 Owner Review Form v2 with printable decision sheet", safety: "local-only, no App.jsx, no deploy", recommended: true },
    { id: "C", action: "V45 Batch Metadata Project Generator", safety: "metadata-only", recommended: false },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["A", "B"],
  safety: safetyBlock()
};

const previewMd = [
  "# UAOS V44 Decision Apply Preview v2",
  "",
  "Status: DRY-RUN ONLY",
  "",
  pending.length === decisions.length ? pendingNote : "Some decisions are not pending; accepted changes remain preview-only.",
  "",
  `Accepted decisions: ${accepted.length}`,
  `Pending decisions: ${pending.length}`,
  `Rejected decisions: ${rejected.length}`,
  `Deferred decisions: ${deferred.length}`,
  `Needs more review: ${needsMoreReview.length}`,
  "",
  "Applied preview changes: none",
  "",
  "Safety: no real apply, no source project mutation, no auto-apply, no export approval."
].join("\n");

const diffMd = [
  "# UAOS V44 Preview Diff Summary",
  "",
  "Changed fields preview: none",
  "",
  `Pending owner decisions: ${pending.map((item) => item.decisionId).join(", ")}`,
  "",
  "Blocked actions:",
  ...diff.blockedActions.map((item) => `- ${item}`),
  "",
  "Risk notes:",
  ...diff.riskNotes.map((item) => `- ${item}`)
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V44_DECISION_APPLY_PREVIEW_V2.json"), JSON.stringify(preview, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V44_DECISION_APPLY_PREVIEW_V2.md"), previewMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V44_PREVIEW_DIFF_SUMMARY.json"), JSON.stringify(diff, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V44_PREVIEW_DIFF_SUMMARY.md"), diffMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V44_DRYRUN_PROJECT_AFTER_DECISION_PREVIEW.uaosproject.json"), JSON.stringify(dryrunProject, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V44_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(nextMatrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V44_DECISION_APPLY_PREVIEW_REPORT.md"), [
  "# UAOS V44 Decision Apply Preview Report",
  "",
  "Status: GENERATED",
  "",
  `Preview id: ${preview.previewId}`,
  `Accepted decisions: ${accepted.length}`,
  `Pending decisions: ${pending.length}`,
  "",
  "Safety: dry-run only, no source mutation, no auto-apply, no export approval."
].join("\n") + "\n", "utf8");

if (sha256(paths.sourceProject) !== sourceProjectSha256Before) throw new Error("Source V37 project changed.");
if (sha256(paths.v42DryrunProject) !== v42DryrunSha256Before) throw new Error("V42 dry-run project changed.");

console.log(JSON.stringify({ status: "GENERATED", acceptedDecisionCount: accepted.length, pendingDecisionCount: pending.length, preview: "generated/UAOS_V44_DECISION_APPLY_PREVIEW_V2.json" }, null, 2));
