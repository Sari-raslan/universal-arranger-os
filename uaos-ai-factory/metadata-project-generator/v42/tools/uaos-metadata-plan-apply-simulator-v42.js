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
  suggestions: path.join(base, "v40", "generated", "UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.json"),
  reviewPack: path.join(base, "v41", "generated", "UAOS_V41_SUGGESTION_REVIEW_PACK.json"),
  scorecard: path.join(base, "v41", "generated", "UAOS_V41_PROJECT_COMPARISON_SCORECARD.json")
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

const project = readJson(paths.sourceProject);
const suggestions = readJson(paths.suggestions);
const reviewPack = readJson(paths.reviewPack);
const scorecard = readJson(paths.scorecard);
const generatedAt = new Date().toISOString();
const sourceProjectSha256Before = sha256(paths.sourceProject);
const pendingSuggestions = reviewPack.reviewItems.map((item) => ({
  reviewItemId: item.reviewItemId,
  sourceSuggestionId: item.sourceSuggestionId,
  title: item.title,
  ownerDecision: item.ownerDecision,
  proposedMetadataChange: item.proposedMetadataChange,
  metadataField: item.metadataField,
  canAutoApply: false
}));

const simulationPlan = {
  schemaVersion: "uaos.v42.metadata.apply.simulation.plan.v1",
  generatedAt,
  simulationId: `uaos-v42-dryrun-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  sourceProjectPath: "../v37/generated/UAOS_EXAMPLE_PROJECT_V37.uaosproject.json",
  sourceProjectSha256Before,
  selectedSuggestionsMode: "safe_metadata_preview_only",
  acceptedSuggestions: [],
  pendingSuggestions,
  rejectedSuggestions: [],
  previewOnly: true,
  sourceProjectModified: false,
  autoApplyEnabled: false,
  humanReviewRequired: true,
  exportApprovalImpact: false,
  korgOutputAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  metadataOnly: true,
  dryRunOnly: true,
  safety: safetyBlock()
};

const changedFieldsPreview = pendingSuggestions.map((item) => ({
  field: item.metadataField,
  sourceSuggestionId: item.sourceSuggestionId,
  previewChange: item.proposedMetadataChange,
  status: "pending_owner_decision",
  applied: false
}));

const preview = {
  schemaVersion: "uaos.v42.metadata.apply.simulation.preview.v1",
  generatedAt,
  simulationId: simulationPlan.simulationId,
  beforeSummary: {
    projectId: project.projectId,
    projectName: project.projectName,
    trackCount: project.tracks.length,
    sourceProjectSha256Before
  },
  afterPreviewSummary: {
    previewArtifact: true,
    pendingChangeCount: changedFieldsPreview.length,
    acceptedChangeCount: 0,
    sourceProjectModified: false,
    dryRunOnly: true,
    metadataOnly: true
  },
  changedFieldsPreview,
  unchangedFields: [
    "schemaVersion",
    "projectId",
    "projectName",
    "sourceMode",
    "targetKeyboard",
    "tracks",
    "links",
    "safety"
  ],
  pendingOwnerDecisions: pendingSuggestions.map((item) => item.reviewItemId),
  riskNotes: [
    "Dry-run preview only.",
    "No original project mutation.",
    "No auto-apply.",
    "No export approval.",
    "No USB or keyboard load approval."
  ],
  metadataOnly: true,
  dryRunOnly: true,
  sourceProjectModified: false,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  safety: safetyBlock()
};

const previewProject = {
  ...project,
  previewArtifact: true,
  previewSource: "UAOS V42 dry-run simulation",
  previewCreatedAt: generatedAt,
  sourceProjectModified: false,
  dryRunOnly: true,
  metadataOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  pendingMetadataPreview: changedFieldsPreview,
  sourceProjectSha256Before,
  safety: {
    ...project.safety,
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
  schemaVersion: "uaos.v42.next.recommendation.matrix.v1",
  generatedAt,
  metadataOnly: true,
  dryRunOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V43 Owner Decision Collector", safety: "metadata-only", recommended: true },
    { id: "B", action: "V43 Batch Metadata Project Generator", safety: "metadata-only", recommended: false },
    { id: "C", action: "V43 Local Dashboard Index V37-V42", safety: "no App.jsx, no deploy", recommended: true },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["A", "C"],
  safety: safetyBlock()
};

const previewMd = [
  "# UAOS V42 Metadata Apply Simulation Preview",
  "",
  "Status: DRY-RUN ONLY",
  "",
  "No source project mutation occurred.",
  "No suggestions were auto-applied.",
  "No KORG output, USB approval, or keyboard load approval was created.",
  "",
  `Pending owner decisions: ${pendingSuggestions.length}`,
  `Accepted suggestions: 0`,
  `Rejected suggestions: 0`,
  "",
  "## Pending Preview Changes",
  "",
  ...changedFieldsPreview.map((item) => `- ${item.sourceSuggestionId}: ${item.field} -> ${item.previewChange}`)
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V42_METADATA_APPLY_SIMULATION_PLAN.json"), JSON.stringify(simulationPlan, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V42_METADATA_APPLY_SIMULATION_PREVIEW.json"), JSON.stringify(preview, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V42_METADATA_APPLY_SIMULATION_PREVIEW.md"), previewMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V42_DRYRUN_PROJECT_AFTER_PREVIEW.uaosproject.json"), JSON.stringify(previewProject, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V42_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(nextMatrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V42_APPLY_SIMULATOR_REPORT.md"), [
  "# UAOS V42 Apply Simulator Report",
  "",
  "Status: GENERATED",
  "",
  `Simulation id: ${simulationPlan.simulationId}`,
  `Pending suggestions: ${pendingSuggestions.length}`,
  `Source project SHA256 before: ${sourceProjectSha256Before}`,
  "",
  "Safety: dry-run only, no source mutation, no auto-apply, no export approval."
].join("\n") + "\n", "utf8");

const sourceProjectSha256After = sha256(paths.sourceProject);
if (sourceProjectSha256After !== sourceProjectSha256Before) {
  throw new Error("Source project changed during dry-run simulation.");
}

console.log(JSON.stringify({
  status: "GENERATED",
  pendingSuggestions: pendingSuggestions.length,
  sourceProjectModified: false,
  scorecard: scorecard.overallMetadataMaturityScore
}, null, 2));
