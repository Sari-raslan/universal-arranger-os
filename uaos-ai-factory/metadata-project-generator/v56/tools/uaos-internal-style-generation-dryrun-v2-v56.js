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

function safeBlock() {
  return {
    metadataOnly: true,
    dryRunOnly: true,
    humanReviewOnly: true,
    audioRenderAllowed: false,
    midiGenerationAllowed: false,
    korgOutputAllowed: false,
    nativeKeyboardFilesAllowed: false,
    setModificationAllowed: false,
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
const v55Dryrun = readJson(path.join(base, "v55", "generated", "UAOS_V55_INTERNAL_STYLE_GENERATION_DRYRUN.json"));
const v55Intent = readJson(path.join(base, "v55", "generated", "UAOS_V55_STYLE_INTENT_PREVIEW.json"));
const v55Sections = readJson(path.join(base, "v55", "generated", "UAOS_V55_STYLE_SECTION_PLAN_PREVIEW.json"));
const v55Score = readJson(path.join(base, "v55", "generated", "UAOS_V55_BRIDGE_QUALITY_SCORE.json"));
const v54Bridge = readJson(path.join(base, "v54", "generated", "UAOS_V54_STYLE_ENGINE_BRIDGE_DRYRUN_OUTPUT.json"));

const refinedStyleIntentPreview = {
  schemaVersion: "uaos.v56.style.intent.refined.preview.v1",
  createdAt,
  sourceInputs: {
    v55DryRunId: v55Dryrun.dryRunId,
    v55BridgeReadinessScore: v55Score.overallDryRunReadinessScore,
    v54BridgeStatus: v54Bridge.status || "DRY_RUN"
  },
  styleFamily: v55Intent.styleFamily || "oriental_style_metadata",
  tempo: v55Intent.tempo || 96,
  timeSignature: v55Intent.timeSignature || "4/4",
  scaleMode: v55Intent.scaleMode || "oriental_mode_unverified",
  chordProgression: v55Intent.chordProgression || [],
  rhythmDensityIntent: v55Intent.rhythmDensityIntent || "moderate_with_human_review",
  bassMovementIntent: v55Intent.bassMovementIntent || "supportive_with_phrase_review",
  chordRhythmIntent: v55Intent.chordRhythmIntent || "syncopation_review_required",
  orientalFeelIntent: v55Intent.orientalFeelIntent || "metadata_description_only",
  melodySpaceIntent: v55Intent.melodySpaceIntent || "leave room for lead phrases",
  dspIntent: {
    master: "controlled loudness preview only",
    drums: "tight transient presence metadata",
    bass: "stable low-mid definition metadata",
    chords: "clear rhythmic support metadata",
    pad: "wide but non-masking metadata",
    melodyGuide: "review-only guide placement"
  },
  humanReviewRequired: true,
  safety: safeBlock()
};

const sectionPurpose = {
  intro: ["setup", "announce style identity without claiming hardware readiness"],
  variation1: ["low", "establish groove and leave melodic space"],
  variation2: ["medium", "add rhythmic interest while preserving clarity"],
  variation3: ["medium_high", "increase arranger momentum with controlled density"],
  variation4: ["peak", "fullest metadata arrangement before ending or fill"],
  fill: ["transition", "short movement between variations"],
  ending: ["close", "resolve arrangement with clear final cadence"]
};

const refinedSectionPlanPreview = ["intro", "variation1", "variation2", "variation3", "variation4", "fill", "ending"].map((sectionId) => {
  const source = Array.isArray(v55Sections) ? v55Sections.find((item) => item.sectionId === sectionId) || {} : {};
  const [intendedEnergy, arrangementPurpose] = sectionPurpose[sectionId];
  return {
    sectionId,
    intendedEnergy,
    arrangementPurpose,
    drumDensityIntent: sectionId === "variation4" ? "full_metadata_density_review_required" : sectionId === "intro" ? "sparse_entry_metadata" : "balanced_metadata_density",
    bassMovementIntent: refinedStyleIntentPreview.bassMovementIntent,
    chordRhythmIntent: refinedStyleIntentPreview.chordRhythmIntent,
    orientalFeelIntent: refinedStyleIntentPreview.orientalFeelIntent,
    melodySpaceIntent: refinedStyleIntentPreview.melodySpaceIntent,
    dspIntent: sectionId === "fill" ? "short transition clarity metadata" : "section balance metadata only",
    sourceV55RoleSummary: {
      drumRole: source.drumRole || "metadata role only",
      bassRole: source.bassRole || "metadata role only",
      chordRole: source.chordRole || "metadata role only"
    },
    humanReviewRequired: true,
    generatedAudio: false,
    generatedMidi: false,
    generatedKorgFile: false
  };
});

const sectionRiskNotes = refinedSectionPlanPreview.map((section) => ({
  sectionId: section.sectionId,
  riskLevel: section.sectionId === "variation4" ? "medium_metadata_density_review" : "low_metadata_review",
  note: "Human owner review required before any future implementation or export consideration.",
  blocksExport: true
}));

const dryrun = {
  schemaVersion: "uaos.v56.internal.style.generation.dryrun.v2",
  dryRunId: `uaos-v56-style-dryrun-v2-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  createdAt,
  version: "v2",
  metadataOnly: true,
  dryRunOnly: true,
  audioRenderAllowed: false,
  midiGenerationAllowed: false,
  korgOutputAllowed: false,
  exportAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  sourceProjectModified: false,
  refinedStyleIntentPreview,
  refinedSectionPlanPreview,
  sectionRiskNotes,
  humanReviewRequired: true,
  safety: safeBlock()
};

const md = [
  "# UAOS V56 Internal Style Generation Dry-run V2",
  "",
  "Metadata-only dry-run. No audio rendering, no MIDI generation, no KORG output, no USB write, and no PA3X load.",
  "",
  `Dry-run ID: ${dryrun.dryRunId}`,
  `Version: ${dryrun.version}`,
  `Sections: ${refinedSectionPlanPreview.length}`,
  "Human review required: YES",
  "Export allowed: NO"
].join("\n");

const report = [
  "# UAOS V56 Internal Style Generation Dry-run V2 Report",
  "",
  "Status: GENERATED",
  "Refined style intent preview created: YES",
  "Refined section plan preview created: YES",
  "Audio render: NO",
  "MIDI generation: NO",
  "KORG output: NO",
  "Source project mutation: NO"
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V56_INTERNAL_STYLE_GENERATION_DRYRUN_V2.json"), JSON.stringify(dryrun, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V56_INTERNAL_STYLE_GENERATION_DRYRUN_V2.md"), md + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V56_STYLE_INTENT_REFINED_PREVIEW.json"), JSON.stringify(refinedStyleIntentPreview, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V56_STYLE_SECTION_PLAN_REFINED_PREVIEW.json"), JSON.stringify(refinedSectionPlanPreview, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V56_INTERNAL_STYLE_GENERATION_DRYRUN_V2_REPORT.md"), report + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V56_INTERNAL_STYLE_GENERATION_DRYRUN_V2.json" }, null, 2));
