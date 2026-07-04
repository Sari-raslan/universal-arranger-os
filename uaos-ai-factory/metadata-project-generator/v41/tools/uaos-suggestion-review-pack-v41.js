import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

const paths = {
  suggestions: path.join(base, "v40", "generated", "UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.json"),
  summary: path.join(base, "v40", "generated", "UAOS_V40_SUGGESTION_SCORE_SUMMARY.json"),
  rules: path.join(base, "v39", "generated", "UAOS_V39_STYLE_REVIEW_RULES_EXPANDED.json"),
  score: path.join(base, "v38", "generated", "UAOS_V38_STYLE_REVIEW_SCORE.json"),
  project: path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json")
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safetyBlock() {
  return {
    metadataOnly: true,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false,
    exportApproval: false,
    autoApply: false
  };
}

function reviewItem(item, index) {
  return {
    reviewItemId: `V41-REV-${String(index + 1).padStart(3, "0")}`,
    sourceSuggestionId: item.suggestionId,
    category: item.category,
    title: item.title,
    reason: item.reason,
    proposedMetadataChange: item.suggestedMetadataChange,
    ownerDecision: "pending",
    allowedDecisions: [
      "accept_for_metadata_plan_only",
      "reject",
      "needs_more_review",
      "defer"
    ],
    canAutoApply: false,
    metadataOnly: true,
    exportApprovalImpact: false,
    korgOutputAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    priority: item.priority,
    humanReviewRequired: item.humanReviewRequired,
    metadataField: item.metadataField
  };
}

function groupBy(items, predicate) {
  return items.filter(predicate).map((item) => item.reviewItemId);
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const suggestionsDoc = readJson(paths.suggestions);
const summary = readJson(paths.summary);
const rules = readJson(paths.rules);
const score = readJson(paths.score);
const project = readJson(paths.project);
const generatedAt = new Date().toISOString();
const reviewItems = suggestionsDoc.suggestions.map(reviewItem);

const groups = {
  highPriority: groupBy(reviewItems, (item) => item.priority === "high"),
  mediumPriority: groupBy(reviewItems, (item) => item.priority === "medium"),
  lowPriority: groupBy(reviewItems, (item) => item.priority === "low"),
  humanReviewRequired: groupBy(reviewItems, (item) => item.humanReviewRequired),
  safetyGateRelated: groupBy(reviewItems, (item) => item.category === "safetyGate"),
  arrangerMusicalImprovement: groupBy(reviewItems, (item) => ["sectionStructure", "rhythmDensity", "bassMovement", "chordRhythm", "orientalFeel", "melodySpace", "humanReview"].includes(item.category)),
  dspMetadataImprovement: groupBy(reviewItems, (item) => item.category === "dspIntent")
};

const pack = {
  schemaVersion: "uaos.v41.suggestion.review.pack.v1",
  generatedAt,
  metadataOnly: true,
  sourceProjectId: project.projectId,
  sourceSuggestionCount: summary.totalSuggestions,
  sourceRuleCount: rules.categories ? Object.values(rules.categories).flat().length : 0,
  sourceScores: score.scores,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  autoApplyAllowed: false,
  groups,
  reviewItems,
  safety: safetyBlock()
};

const packMd = [
  "# UAOS V41 Suggestion Review Pack",
  "",
  "Status: GENERATED",
  "",
  "This review pack does not apply changes automatically.",
  "This review pack does not generate KORG files.",
  "This review pack does not approve USB.",
  "This review pack does not approve PA3X load.",
  "This is review only.",
  "",
  `Total review items: ${reviewItems.length}`,
  "",
  ...reviewItems.map((item) => [
    `## ${item.reviewItemId} ${item.title}`,
    "",
    `- Source: ${item.sourceSuggestionId}`,
    `- Category: ${item.category}`,
    `- Priority: ${item.priority}`,
    `- Owner decision: ${item.ownerDecision}`,
    `- Proposed metadata change: ${item.proposedMetadataChange}`,
    "- Safety: metadata-only, canAutoApply false, no export approval"
  ].join("\n"))
].join("\n\n");

const formMd = [
  "# UAOS V41 Owner Decision Form",
  "",
  "This does not apply changes automatically.",
  "This does not generate KORG files.",
  "This does not approve USB.",
  "This does not approve PA3X load.",
  "This is review only.",
  "",
  "Allowed decisions:",
  "",
  "- accept_for_metadata_plan_only",
  "- reject",
  "- needs_more_review",
  "- defer",
  "",
  ...reviewItems.map((item) => [
    `## ${item.reviewItemId} ${item.title}`,
    "",
    `Source suggestion: ${item.sourceSuggestionId}`,
    "",
    "Owner decision: pending",
    "",
    "Owner note:",
    ""
  ].join("\n"))
].join("\n\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V41_SUGGESTION_REVIEW_PACK.json"), JSON.stringify(pack, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V41_SUGGESTION_REVIEW_PACK.md"), packMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V41_SUGGESTION_OWNER_DECISION_FORM.md"), formMd + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V41_SUGGESTION_REVIEW_PACK_REPORT.md"), [
  "# UAOS V41 Suggestion Review Pack Report",
  "",
  "Status: GENERATED",
  "",
  `Review items: ${reviewItems.length}`,
  `High priority: ${groups.highPriority.length}`,
  `Medium priority: ${groups.mediumPriority.length}`,
  `Low priority: ${groups.lowPriority.length}`,
  `Human review required: ${groups.humanReviewRequired.length}`,
  "",
  "Safety: metadata-only, review only, no auto-apply, no export approval."
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", reviewItems: reviewItems.length, output: "generated/UAOS_V41_SUGGESTION_REVIEW_PACK.json" }, null, 2));
