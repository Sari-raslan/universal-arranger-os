import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function safetyBlock() { return { dryRunOnly: true, metadataOnly: true, realStyleGenerationAllowed: false, korgOutputAllowed: false, exportAllowed: false, usbAllowed: false, keyboardLoadAllowed: false }; }
fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
const createdAt = new Date().toISOString();
const project = readJson(path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"));
const bridgePlan = readJson(path.join(base, "v53", "generated", "UAOS_V53_STYLE_ENGINE_METADATA_BRIDGE_PLAN.json"));
const adapter = readJson(path.join(generatedDir, "UAOS_V54_INTERNAL_PROJECT_ADAPTER_OUTPUT.json"));
const intent = project.musicalIntent || {};
const trackRoles = adapter.normalizedFields.trackRoles || [];
const output = {
  schemaVersion: "uaos.v54.style.engine.bridge.dryrun.output.v1",
  bridgeRunId: `uaos-v54-bridge-dryrun-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  createdAt,
  dryRunOnly: true,
  metadataOnly: true,
  inputProjectId: project.projectId,
  mappingResults: bridgePlan.mappingTable.map((item) => ({ category: item.category, inputPath: item.inputPath, outputPath: item.outputPath, status: "mapped_as_metadata_preview" })),
  missingMappings: bridgePlan.missingFields,
  generatedStyleIntentPreview: { family: intent.styleFamily, tempo: intent.tempo, sections: intent.sections, trackRoles },
  styleEngineInputPreview: {
    tempo: intent.tempo,
    timeSignature: intent.timeSignature,
    scaleMode: intent.scaleMode,
    chordProgression: intent.chordProgression,
    sections: intent.sections,
    trackRoles,
    rhythmDensityIntent: "requires_owner_or_scoring_confirmation",
    bassMovementIntent: "requires_owner_or_scoring_confirmation",
    chordRhythmIntent: "requires_owner_or_scoring_confirmation",
    orientalFeelIntent: "metadata_description_only",
    dspIntentSummary: "linked_via_project_dsp_plan"
  },
  humanReviewRequired: true,
  realStyleGenerationAllowed: false,
  korgOutputAllowed: false,
  exportAllowed: false,
  usbAllowed: false,
  keyboardLoadAllowed: false,
  safety: safetyBlock()
};
const md = ["# UAOS V54 Style Engine Bridge Dry-run Output", "", "Dry-run only. Metadata-only. No real style generation, no KORG output, no export.", "", `Bridge run: ${output.bridgeRunId}`, `Mappings: ${output.mappingResults.length}`].join("\n");
const report = ["# UAOS V54 Style Engine Bridge Dry-run Report", "", "Status: GENERATED", "Bridge dry-run created: YES", "Real style generation: NO", "KORG output: NO"].join("\n");
fs.writeFileSync(path.join(generatedDir, "UAOS_V54_STYLE_ENGINE_BRIDGE_DRYRUN_OUTPUT.json"), JSON.stringify(output, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V54_STYLE_ENGINE_BRIDGE_DRYRUN_OUTPUT.md"), md + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V54_STYLE_ENGINE_BRIDGE_DRYRUN_REPORT.md"), report + "\n", "utf8");
console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V54_STYLE_ENGINE_BRIDGE_DRYRUN_OUTPUT.json" }, null, 2));
