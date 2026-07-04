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
    sampleOnly: true,
    metadataOnly: true,
    dryRunOnly: true,
    realOwnerDecisionApplied: false,
    audioRenderAllowed: false,
    midiGenerationAllowed: false,
    korgOutputAllowed: false,
    nativeKeyboardFilesAllowed: false,
    exportAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    sourceProjectModified: false,
    autoApplyAllowed: false,
    compatibilityClaimAllowed: false,
    pa3xReadyClaimAllowed: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const createdAt = new Date().toISOString();
const v56Dryrun = readJson(path.join(base, "v56", "generated", "UAOS_V56_INTERNAL_STYLE_GENERATION_DRYRUN_V2.json"));
const v56Intent = readJson(path.join(base, "v56", "generated", "UAOS_V56_STYLE_INTENT_REFINED_PREVIEW.json"));
const v56Sections = readJson(path.join(base, "v56", "generated", "UAOS_V56_STYLE_SECTION_PLAN_REFINED_PREVIEW.json"));
const sampleReview = readJson(path.join(generatedDir, "UAOS_V57_HUMAN_REVIEW_FILLED_EXAMPLE.json"));

const revisionCategories = new Set(sampleReview.sampleItems.filter((item) => item.sampleDecision === "request_revision").map((item) => item.category));
const deferredItems = sampleReview.sampleItems.filter((item) => item.sampleDecision === "defer").map((item) => ({
  sourceItemId: item.sourceItemId,
  category: item.category,
  reason: item.sampleOwnerNote,
  blocksExport: true
}));
const revisionRequests = sampleReview.sampleItems.filter((item) => item.sampleDecision === "request_revision").map((item) => ({
  sourceItemId: item.sourceItemId,
  category: item.category,
  request: item.sampleOwnerNote,
  realOwnerDecisionRequired: true
}));

const ownerReviewedStyleIntentPreview = {
  schemaVersion: "uaos.v57.style.intent.owner.reviewed.preview.v1",
  createdAt,
  sourceV56DryRunId: v56Dryrun.dryRunId,
  sampleReviewInputUsed: true,
  realOwnerDecisionApplied: false,
  sampleOnly: true,
  metadataOnly: true,
  styleFamily: v56Intent.styleFamily,
  tempo: v56Intent.tempo,
  timeSignature: v56Intent.timeSignature,
  scaleMode: v56Intent.scaleMode,
  chordProgression: v56Intent.chordProgression,
  rhythmDensityIntent: revisionCategories.has("rhythmDensity") ? "sample_requests_density_clarification" : v56Intent.rhythmDensityIntent,
  bassMovementIntent: revisionCategories.has("bassMovement") ? "sample_requests_bass_movement_clarification" : v56Intent.bassMovementIntent,
  chordRhythmIntent: revisionCategories.has("chordRhythm") ? "sample_requests_chord_rhythm_clarification" : v56Intent.chordRhythmIntent,
  orientalFeelIntent: revisionCategories.has("orientalFeel") ? "sample_requests_oriental_feel_clarification" : v56Intent.orientalFeelIntent,
  melodySpaceIntent: v56Intent.melodySpaceIntent,
  dspIntent: v56Intent.dspIntent,
  humanReviewRequired: true,
  exportAllowed: false,
  safety: safetyBlock()
};

const ownerReviewedSectionPlanPreview = v56Sections.map((section) => {
  const revisionRequired = section.sectionId === "variation4" || revisionCategories.size > 0;
  return {
    sectionId: section.sectionId,
    intendedEnergy: section.intendedEnergy,
    arrangementPurpose: section.arrangementPurpose,
    drumDensityIntent: revisionCategories.has("rhythmDensity") ? `${section.drumDensityIntent}_sample_revision_requested` : section.drumDensityIntent,
    bassMovementIntent: ownerReviewedStyleIntentPreview.bassMovementIntent,
    chordRhythmIntent: ownerReviewedStyleIntentPreview.chordRhythmIntent,
    orientalFeelIntent: ownerReviewedStyleIntentPreview.orientalFeelIntent,
    melodySpaceIntent: section.melodySpaceIntent,
    dspIntent: section.dspIntent,
    sampleReviewDecisionSummary: {
      approveMetadataIntentCount: sampleReview.summary.approveMetadataIntentCount,
      requestRevisionCount: sampleReview.summary.requestRevisionCount,
      deferCount: sampleReview.summary.deferCount,
      sampleOnly: true,
      realOwnerDecisionApplied: false
    },
    revisionRequired,
    humanReviewRequired: true,
    generatedAudio: false,
    generatedMidi: false,
    generatedKorgFile: false
  };
});

const dryrun = {
  schemaVersion: "uaos.v57.internal.style.generation.dryrun.v3",
  dryRunId: `uaos-v57-style-dryrun-v3-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  createdAt,
  version: "v3",
  sampleReviewInputUsed: true,
  realOwnerDecisionApplied: false,
  sampleOnly: true,
  metadataOnly: true,
  dryRunOnly: true,
  audioRenderAllowed: false,
  midiGenerationAllowed: false,
  korgOutputAllowed: false,
  exportAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  sourceProjectModified: false,
  ownerReviewedStyleIntentPreview,
  ownerReviewedSectionPlanPreview,
  revisionRequests,
  deferredItems,
  humanReviewRequired: true,
  safety: safetyBlock()
};

const md = [
  "# UAOS V57 Internal Style Generation Dry-run V3",
  "",
  "Sample review input used: YES",
  "Real owner decision applied: NO",
  "Metadata-only dry-run: YES",
  "Audio render: NO",
  "MIDI generation: NO",
  "KORG output: NO",
  "Export allowed: NO",
  "",
  `Dry-run ID: ${dryrun.dryRunId}`,
  `Revision requests: ${revisionRequests.length}`,
  `Deferred items: ${deferredItems.length}`
].join("\n");

const report = [
  "# UAOS V57 Internal Style Generation Dry-run V3 Report",
  "",
  "Status: GENERATED",
  "Owner-reviewed preview created using sample only: YES",
  "Real owner decision applied: NO",
  "Audio render: NO",
  "MIDI generation: NO",
  "KORG output: NO"
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V57_INTERNAL_STYLE_GENERATION_DRYRUN_V3.json"), JSON.stringify(dryrun, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V57_INTERNAL_STYLE_GENERATION_DRYRUN_V3.md"), md + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V57_STYLE_INTENT_OWNER_REVIEWED_PREVIEW.json"), JSON.stringify(ownerReviewedStyleIntentPreview, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V57_STYLE_SECTION_PLAN_OWNER_REVIEWED_PREVIEW.json"), JSON.stringify(ownerReviewedSectionPlanPreview, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V57_INTERNAL_STYLE_GENERATION_DRYRUN_V3_REPORT.md"), report + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V57_INTERNAL_STYLE_GENERATION_DRYRUN_V3.json" }, null, 2));
