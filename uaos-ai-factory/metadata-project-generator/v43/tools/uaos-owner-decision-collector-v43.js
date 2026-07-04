import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

const inputs = {
  reviewPack: path.join(base, "v41", "generated", "UAOS_V41_SUGGESTION_REVIEW_PACK.json"),
  decisionForm: path.join(base, "v41", "generated", "UAOS_V41_SUGGESTION_OWNER_DECISION_FORM.md"),
  simulationPlan: path.join(base, "v42", "generated", "UAOS_V42_METADATA_APPLY_SIMULATION_PLAN.json"),
  simulationPreview: path.join(base, "v42", "generated", "UAOS_V42_METADATA_APPLY_SIMULATION_PREVIEW.json")
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safetyBlock() {
  return {
    sourceProjectModified: false,
    autoApplyEnabled: false,
    realApplyAllowed: false,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false,
    metadataOnly: true,
    dryRunOnly: true,
    exportApproval: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const reviewPack = readJson(inputs.reviewPack);
const simulationPlan = readJson(inputs.simulationPlan);
const simulationPreview = readJson(inputs.simulationPreview);
const createdAt = new Date().toISOString();

const decisions = reviewPack.reviewItems.map((item, index) => ({
  decisionId: `V43-DEC-${String(index + 1).padStart(3, "0")}`,
  sourceReviewItemId: item.reviewItemId,
  sourceSuggestionId: item.sourceSuggestionId,
  category: item.category,
  title: item.title,
  proposedMetadataChange: item.proposedMetadataChange,
  allowedDecisions: [
    "accept_for_future_metadata_plan_only",
    "reject",
    "needs_more_review",
    "defer"
  ],
  selectedDecision: "pending",
  ownerNote: "",
  canAutoApply: false,
  metadataOnly: true,
  dryRunOnly: true,
  exportApprovalImpact: false,
  korgOutputAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false
}));

const template = {
  schemaVersion: "uaos.owner.decisions.v1",
  decisionPackId: `uaos-v43-owner-decisions-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  createdAt,
  sourceReviewPackPath: "../v41/generated/UAOS_V41_SUGGESTION_REVIEW_PACK.json",
  sourceSimulationPreviewPath: "../v42/generated/UAOS_V42_METADATA_APPLY_SIMULATION_PREVIEW.json",
  sourceSimulationId: simulationPlan.simulationId,
  sourcePendingOwnerDecisions: simulationPreview.pendingOwnerDecisions,
  decisions,
  safety: safetyBlock()
};

const summary = {
  schemaVersion: "uaos.v43.owner.decision.validation.summary.v1",
  createdAt,
  metadataOnly: true,
  dryRunOnly: true,
  totalDecisions: decisions.length,
  pendingCount: decisions.length,
  acceptedForFutureMetadataPlanOnlyCount: 0,
  rejectedCount: 0,
  needsMoreReviewCount: 0,
  deferredCount: 0,
  allSafeForMetadataOnly: true,
  readyForRealApply: false,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safety: safetyBlock()
};

const nextMatrix = {
  schemaVersion: "uaos.v43.next.recommendation.matrix.v1",
  createdAt,
  metadataOnly: true,
  decisionCollectionOnly: true,
  dryRunOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V44 Metadata Decision Apply Preview v2, dry-run only", safety: "metadata-only dry-run", recommended: true },
    { id: "B", action: "V44 Owner Review HTML Form", safety: "local-only, no App.jsx, no deploy", recommended: true },
    { id: "C", action: "V44 Batch Metadata Project Generator", safety: "metadata-only", recommended: false },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["A", "B"],
  safety: safetyBlock()
};

const templateMd = [
  "# UAOS V43 Owner Decision Template",
  "",
  "Decision collection only. This does not apply metadata, does not generate KORG files, does not approve USB, and does not approve PA3X load.",
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
    `- Source review item: ${item.sourceReviewItemId}`,
    `- Source suggestion: ${item.sourceSuggestionId}`,
    `- Category: ${item.category}`,
    `- Selected decision: ${item.selectedDecision}`,
    `- Proposed metadata change: ${item.proposedMetadataChange}`,
    "- Owner note: "
  ].join("\n"))
].join("\n\n");

const summaryMd = [
  "# UAOS V43 Owner Decision Validation Summary",
  "",
  `Total decisions: ${summary.totalDecisions}`,
  `Pending: ${summary.pendingCount}`,
  `Accepted for future metadata plan only: ${summary.acceptedForFutureMetadataPlanOnlyCount}`,
  `Rejected: ${summary.rejectedCount}`,
  `Needs more review: ${summary.needsMoreReviewCount}`,
  `Deferred: ${summary.deferredCount}`,
  "",
  "Ready for real apply: NO",
  "Ready for KORG export: NO",
  "Ready for USB: NO",
  "Ready for keyboard load: NO"
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V43_OWNER_DECISION_TEMPLATE.json"), JSON.stringify(template, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V43_OWNER_DECISION_TEMPLATE.md"), templateMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V43_OWNER_DECISION_VALIDATION_SUMMARY.json"), JSON.stringify(summary, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V43_OWNER_DECISION_VALIDATION_SUMMARY.md"), summaryMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V43_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(nextMatrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V43_OWNER_DECISION_COLLECTOR_REPORT.md"), [
  "# UAOS V43 Owner Decision Collector Report",
  "",
  "Status: GENERATED",
  "",
  `Decision items: ${decisions.length}`,
  `Pending decisions: ${decisions.length}`,
  "",
  "Safety: metadata-only, decision collection only, no real apply, no auto-apply, no export approval."
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", decisions: decisions.length, output: "generated/UAOS_V43_OWNER_DECISION_TEMPLATE.json" }, null, 2));
