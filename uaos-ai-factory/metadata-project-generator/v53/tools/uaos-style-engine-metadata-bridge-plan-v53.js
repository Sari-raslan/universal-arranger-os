import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

function safetyBlock() {
  return {
    planningOnly: true,
    metadataOnly: true,
    dryRunBridgeOnly: true,
    realStyleGenerationAllowed: false,
    korgOutputAllowed: false,
    exportAllowed: false,
    sourceProjectModified: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
const createdAt = new Date().toISOString();
const categories = [
  "tempo",
  "timeSignature",
  "scaleMode",
  "chordProgression",
  "sections",
  "trackRoles",
  "rhythmDensity",
  "bassMovement",
  "chordRhythm",
  "orientalFeel",
  "dspIntent",
  "humanReviewStatus"
];
const plan = {
  schemaVersion: "uaos.v53.style.engine.metadata.bridge.plan.v1",
  bridgeId: `uaos-v53-style-bridge-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  createdAt,
  inputMetadataFields: categories,
  styleEngineExpectedFields: categories.map((item) => `styleEngine.${item}`),
  mappingTable: categories.map((category) => ({
    category,
    inputPath: category === "dspIntent" ? "dspPlan.channels" : `uaosproject.musicalIntent.${category}`,
    outputPath: `styleEngine.${category}`,
    transform: "draft_passthrough_or_normalize",
    required: true
  })),
  missingFields: [
    "rhythmDensity must be confirmed by scoring or owner review",
    "bassMovement must be confirmed by scoring or owner review",
    "chordRhythm must be confirmed by scoring or owner review",
    "humanReviewStatus must come from owner decision workflow"
  ],
  transformationRulesDraft: [
    "Normalize tempo to integer BPM.",
    "Normalize timeSignature to numerator/denominator text.",
    "Map section names to internal arrangement section ids.",
    "Keep orientalFeel descriptive until a real style engine schema is approved."
  ],
  validationRules: [
    "Reject missing tempo/timeSignature/sections.",
    "Reject export flags or KORG output flags.",
    "Require human review status before any future bridge dry-run.",
    "Keep real style generation disabled."
  ],
  dryRunBridgeOnly: true,
  realStyleGenerationAllowed: false,
  korgOutputAllowed: false,
  exportAllowed: false,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  sourceInputs: {
    v52GapAnalysis: path.join(base, "v52", "generated", "UAOS_V52_EXPORT_READINESS_GAP_ANALYSIS.json")
  },
  safety: safetyBlock()
};
const md = [
  "# UAOS V53 Style Engine Metadata Bridge Plan",
  "",
  "Planning only. Dry-run bridge only. No real style generation, no KORG output, no export.",
  "",
  "## Mapping Table",
  ...plan.mappingTable.map((item) => `- ${item.category}: ${item.inputPath} -> ${item.outputPath}`),
  "",
  "## Missing Fields",
  ...plan.missingFields.map((item) => `- ${item}`)
].join("\n");
const report = [
  "# UAOS V53 Style Engine Bridge Plan Report",
  "",
  "Status: GENERATED",
  "Safety: metadata-only bridge planning, no style generation, no export."
].join("\n");
fs.writeFileSync(path.join(generatedDir, "UAOS_V53_STYLE_ENGINE_METADATA_BRIDGE_PLAN.json"), JSON.stringify(plan, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V53_STYLE_ENGINE_METADATA_BRIDGE_PLAN.md"), md + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V53_STYLE_ENGINE_BRIDGE_PLAN_REPORT.md"), report + "\n", "utf8");
console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V53_STYLE_ENGINE_METADATA_BRIDGE_PLAN.json" }, null, 2));
