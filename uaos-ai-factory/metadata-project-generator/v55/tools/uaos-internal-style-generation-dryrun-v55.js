import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function safetyBlock() { return { metadataOnly: true, dryRunOnly: true, audioRenderAllowed: false, midiGenerationAllowed: false, korgOutputAllowed: false, exportAllowed: false, usbWriteAllowed: false, keyboardLoadAllowed: false, sourceProjectModified: false }; }
fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
const createdAt = new Date().toISOString();
const adapter = readJson(path.join(base, "v54", "generated", "UAOS_V54_INTERNAL_PROJECT_ADAPTER_OUTPUT.json"));
const bridge = readJson(path.join(base, "v54", "generated", "UAOS_V54_STYLE_ENGINE_BRIDGE_DRYRUN_OUTPUT.json"));
const project = readJson(path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"));
const intent = project.musicalIntent || {};
const styleIntentPreview = {
  tempo: intent.tempo,
  timeSignature: intent.timeSignature,
  scaleMode: intent.scaleMode,
  chordProgression: intent.chordProgression,
  styleFamily: intent.styleFamily,
  orientalFeelIntent: bridge.styleEngineInputPreview?.orientalFeelIntent || "metadata_description_only",
  rhythmDensityIntent: bridge.styleEngineInputPreview?.rhythmDensityIntent || "requires_review",
  bassMovementIntent: bridge.styleEngineInputPreview?.bassMovementIntent || "requires_review",
  chordRhythmIntent: bridge.styleEngineInputPreview?.chordRhythmIntent || "requires_review",
  melodySpaceIntent: "leave room for human review"
};
const sectionNames = ["intro", "variation1", "variation2", "variation3", "variation4", "fill", "ending"];
const sectionPlanPreview = sectionNames.map((sectionId, index) => ({
  sectionId,
  intendedEnergy: index === 0 ? "setup" : index < 4 ? "build" : index === 4 ? "peak" : "transition_or_close",
  drumRole: "metadata role only",
  bassRole: "metadata role only",
  chordRole: "metadata role only",
  padRole: "metadata role only",
  melodyGuideRole: "metadata role only",
  humanReviewRequired: true,
  generatedAudio: false,
  generatedMidi: false,
  generatedKorgFile: false
}));
const dryrun = {
  schemaVersion: "uaos.v55.internal.style.generation.dryrun.v1",
  dryRunId: `uaos-v55-style-dryrun-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  createdAt,
  metadataOnly: true,
  dryRunOnly: true,
  audioRenderAllowed: false,
  midiGenerationAllowed: false,
  korgOutputAllowed: false,
  exportAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  sourceProjectModified: false,
  styleIntentPreview,
  sectionPlanPreview,
  trackRolePlan: adapter.internalProjectModel?.tracks || [],
  arrangerNotes: ["Metadata-only arrangement preview.", "No audio, MIDI, or KORG file generated.", "Human review required before any future real implementation."],
  humanReviewRequired: true,
  safety: safetyBlock()
};
const md = ["# UAOS V55 Internal Style Generation Dry-run", "", "Metadata-only. No audio rendering, no MIDI generation, no KORG output.", "", `Dry-run ID: ${dryrun.dryRunId}`, `Sections: ${sectionPlanPreview.length}`].join("\n");
const report = ["# UAOS V55 Internal Style Generation Dry-run Report", "", "Status: GENERATED", "Audio render: NO", "MIDI generation: NO", "KORG output: NO"].join("\n");
fs.writeFileSync(path.join(generatedDir, "UAOS_V55_INTERNAL_STYLE_GENERATION_DRYRUN.json"), JSON.stringify(dryrun, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V55_INTERNAL_STYLE_GENERATION_DRYRUN.md"), md + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V55_STYLE_INTENT_PREVIEW.json"), JSON.stringify(styleIntentPreview, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V55_STYLE_SECTION_PLAN_PREVIEW.json"), JSON.stringify(sectionPlanPreview, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V55_INTERNAL_STYLE_GENERATION_DRYRUN_REPORT.md"), report + "\n", "utf8");
console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V55_INTERNAL_STYLE_GENERATION_DRYRUN.json" }, null, 2));
