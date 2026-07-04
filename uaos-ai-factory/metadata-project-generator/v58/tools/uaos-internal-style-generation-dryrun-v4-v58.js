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

function safetyBlock() {
  return {
    metadataOnly: true,
    dryRunOnly: true,
    manualInputOnly: true,
    realOwnerDecisionsApplied: false,
    autoApplyAllowed: false,
    realApplyAllowed: false,
    audioRenderAllowed: false,
    midiGenerationAllowed: false,
    korgOutputAllowed: false,
    nativeKeyboardFilesAllowed: false,
    exportAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    sourceProjectModified: false,
    compatibilityClaimAllowed: false,
    pa3xReadyClaimAllowed: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const createdAt = new Date().toISOString();
const v57Dryrun = readJson(path.join(base, "v57", "generated", "UAOS_V57_INTERNAL_STYLE_GENERATION_DRYRUN_V3.json"));
const inputPack = readJson(path.join(generatedDir, "UAOS_V58_REAL_OWNER_DECISION_INPUT_PACK.json"));
const pendingCount = inputPack.decisionItems.filter((item) => item.realOwnerDecision === "pending").length;

const pendingOwnerStyleIntentPreview = {
  schemaVersion: "uaos.v58.style.intent.real.owner.pending.preview.v1",
  createdAt,
  inheritedFromV57: true,
  sourceV57DryRunId: v57Dryrun.dryRunId,
  realOwnerInputPackUsed: true,
  realOwnerDecisionsApplied: false,
  pendingRealOwnerDecisionCount: pendingCount,
  metadataOnly: true,
  dryRunOnly: true,
  styleFamily: v57Dryrun.ownerReviewedStyleIntentPreview.styleFamily,
  tempo: v57Dryrun.ownerReviewedStyleIntentPreview.tempo,
  timeSignature: v57Dryrun.ownerReviewedStyleIntentPreview.timeSignature,
  scaleMode: v57Dryrun.ownerReviewedStyleIntentPreview.scaleMode,
  chordProgression: v57Dryrun.ownerReviewedStyleIntentPreview.chordProgression,
  pendingDecisionNotice: "No real owner decisions have been applied. This is a pending-preview only.",
  humanReviewRequired: true,
  exportAllowed: false,
  safety: safetyBlock()
};

const pendingOwnerSectionPlanPreview = v57Dryrun.ownerReviewedSectionPlanPreview.map((section) => ({
  sectionId: section.sectionId,
  inheritedFromV57: true,
  pendingRealOwnerReview: true,
  revisionRequired: null,
  humanReviewRequired: true,
  generatedAudio: false,
  generatedMidi: false,
  generatedKorgFile: false
}));

const blockedUntilOwnerDecisions = inputPack.decisionItems.map((item) => ({
  decisionId: item.decisionId,
  sourceChecklistItemId: item.sourceChecklistItemId,
  category: item.category,
  realOwnerDecision: item.realOwnerDecision,
  blocksRealApply: true,
  blocksExport: true
}));

const dryrun = {
  schemaVersion: "uaos.v58.internal.style.generation.dryrun.v4",
  dryRunId: `uaos-v58-style-dryrun-v4-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  createdAt,
  version: "v4",
  realOwnerInputPackUsed: true,
  realOwnerDecisionsApplied: false,
  pendingRealOwnerDecisionCount: pendingCount,
  metadataOnly: true,
  dryRunOnly: true,
  audioRenderAllowed: false,
  midiGenerationAllowed: false,
  korgOutputAllowed: false,
  exportAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  sourceProjectModified: false,
  pendingOwnerStyleIntentPreview,
  pendingOwnerSectionPlanPreview,
  blockedUntilOwnerDecisions,
  humanReviewRequired: true,
  safety: safetyBlock()
};

const md = [
  "# UAOS V58 Internal Style Generation Dry-run V4",
  "",
  "Real owner input pack used: YES",
  "Real owner decisions applied: NO",
  `Pending real owner decision count: ${pendingCount}`,
  "Metadata-only dry-run: YES",
  "Audio render: NO",
  "MIDI generation: NO",
  "KORG output: NO",
  "Export allowed: NO",
  "",
  `Dry-run ID: ${dryrun.dryRunId}`
].join("\n");

const report = [
  "# UAOS V58 Internal Style Generation Dry-run V4 Report",
  "",
  "Status: GENERATED",
  "Pending owner previews created: YES",
  "Real owner decisions applied: NO",
  "No real apply: YES",
  "Audio render: NO",
  "MIDI generation: NO",
  "KORG output: NO"
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V58_INTERNAL_STYLE_GENERATION_DRYRUN_V4.json"), JSON.stringify(dryrun, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V58_INTERNAL_STYLE_GENERATION_DRYRUN_V4.md"), md + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V58_STYLE_INTENT_REAL_OWNER_PENDING_PREVIEW.json"), JSON.stringify(pendingOwnerStyleIntentPreview, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V58_STYLE_SECTION_PLAN_REAL_OWNER_PENDING_PREVIEW.json"), JSON.stringify(pendingOwnerSectionPlanPreview, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V58_INTERNAL_STYLE_GENERATION_DRYRUN_V4_REPORT.md"), report + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V58_INTERNAL_STYLE_GENERATION_DRYRUN_V4.json" }, null, 2));
