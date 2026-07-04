import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const generatedAt = new Date().toISOString();
const projectId = "uaos-v37-example-project";

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function rel(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const projectPath = path.join(generatedDir, "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json");
const dspPath = path.join(generatedDir, "UAOS_EXAMPLE_DSP_PLAN_V37.json");
const stylePath = path.join(generatedDir, "UAOS_EXAMPLE_STYLE_REVIEW_PLAN_V37.json");
const manifestPath = path.join(generatedDir, "UAOS_EXAMPLE_PROJECT_BUNDLE_MANIFEST_V37.json");

const project = {
  schemaVersion: "uaosproject.v1",
  projectId,
  projectName: "UAOS V37 Example Metadata Project",
  createdAt: generatedAt,
  sourceMode: "metadata_only",
  targetKeyboard: "KORG_PA3X_ORIENTAL_UNVERIFIED",
  safety: {
    metadataOnly: true,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false
  },
  musicalIntent: {
    styleFamily: "oriental_pop",
    tempo: 96,
    timeSignature: "4/4",
    scaleMode: "hijaz_oriental_reference",
    chordProgression: ["Dm", "C", "Bb", "A"],
    sections: ["intro", "variation1", "variation2", "variation3", "variation4", "fill", "ending"]
  },
  tracks: [
    { trackId: "drums", role: "rhythm", intent: "balanced darbuka and kit reference metadata" },
    { trackId: "bass", role: "low_end", intent: "simple root movement metadata" },
    { trackId: "chords", role: "harmony", intent: "short chord stabs metadata" },
    { trackId: "pad", role: "texture", intent: "soft sustained layer metadata" },
    { trackId: "melodyGuide", role: "guide", intent: "non-rendered melody contour metadata" }
  ],
  links: {
    dspPlanPath: "generated/UAOS_EXAMPLE_DSP_PLAN_V37.json",
    styleReviewPlanPath: "generated/UAOS_EXAMPLE_STYLE_REVIEW_PLAN_V37.json",
    manifestPath: "generated/UAOS_EXAMPLE_PROJECT_BUNDLE_MANIFEST_V37.json"
  }
};

const dspPlan = {
  schemaVersion: "uaos.dsp.plan.v1",
  projectId,
  master: {
    targetLufs: -14,
    peakCeilingDb: -1,
    sampleRate: 48000
  },
  channels: [
    { trackId: "drums", role: "rhythm", eqIntent: "tight low mids, clean highs", compressionIntent: "controlled transient metadata", reverbIntent: "short room reference", stereoIntent: "center-weighted" },
    { trackId: "bass", role: "low_end", eqIntent: "stable sub and low-mid separation", compressionIntent: "gentle leveling metadata", reverbIntent: "dry", stereoIntent: "mono" },
    { trackId: "chords", role: "harmony", eqIntent: "reduce mud, preserve body", compressionIntent: "light glue metadata", reverbIntent: "small plate reference", stereoIntent: "moderate width" },
    { trackId: "pad", role: "texture", eqIntent: "soft high pass metadata", compressionIntent: "minimal", reverbIntent: "wide hall reference", stereoIntent: "wide" },
    { trackId: "melodyGuide", role: "guide", eqIntent: "presence guide only", compressionIntent: "none", reverbIntent: "none", stereoIntent: "center" }
  ],
  safety: {
    audioRenderAllowed: false,
    pluginExecutionAllowed: false,
    metadataOnly: true
  }
};

const styleReviewPlan = {
  schemaVersion: "uaos.style.review.v1",
  projectId,
  styleChecklist: {
    intro: "metadata review required",
    variation1: "metadata review required",
    variation2: "metadata review required",
    variation3: "metadata review required",
    variation4: "metadata review required",
    fill: "metadata review required",
    ending: "metadata review required"
  },
  arrangerNotes: {
    drumDensity: "medium with room for manual adjustment",
    bassMovement: "root-focused, human review required",
    chordRhythm: "syncopated but not rendered",
    melodySpace: "leave room for live lead",
    orientalFeel: "reference intent only, no compatibility claim"
  },
  reviewStatus: {
    humanReviewRequired: true,
    keyboardTestRequired: true,
    keyboardTestCompleted: false,
    approvedForKorgExport: false
  }
};

writeJson(projectPath, project);
writeJson(dspPath, dspPlan);
writeJson(stylePath, styleReviewPlan);

const manifestFiles = [projectPath, dspPath, stylePath];
const manifest = {
  schemaVersion: "uaos.project.bundle.manifest.v1",
  projectId,
  generatedAt,
  files: manifestFiles.map((filePath) => ({
    path: rel(filePath),
    sha256: sha256(filePath)
  })),
  safety: {
    metadataOnly: true,
    noKorgOutput: true,
    noSetModification: true,
    noUsbWrite: true,
    noPa3xLoad: true,
    noPackageCopy: true,
    noFixtureModification: true,
    noProprietarySampleExtraction: true
  },
  confirmations: {
    korgOutputCreated: false,
    setFolderModified: false,
    styGenerated: false,
    prfGenerated: false,
    prsGenerated: false,
    kstGenerated: false
  }
};
writeJson(manifestPath, manifest);
manifest.files.push({ path: rel(manifestPath), sha256: sha256(manifestPath) });
writeJson(manifestPath, manifest);

const report = [
  "# UAOS V37 Metadata Project Generator Report",
  "",
  "Status: GENERATED",
  "",
  "Created metadata JSON files only:",
  "",
  `- ${rel(projectPath)}`,
  `- ${rel(dspPath)}`,
  `- ${rel(stylePath)}`,
  `- ${rel(manifestPath)}`,
  "",
  "Safety:",
  "",
  "- No KORG output: YES",
  "- No SET modification: YES",
  "- No STY/PRF/PRS/KST generation: YES",
  "- No USB write: YES",
  "- No PA3X load: YES",
  "- No App.jsx change: YES"
].join("\n");
fs.writeFileSync(path.join(reportsDir, "UAOS_V37_METADATA_PROJECT_GENERATOR_REPORT.md"), report + "\n", "utf8");

console.log(JSON.stringify({
  status: "GENERATED",
  project: rel(projectPath),
  dspPlan: rel(dspPath),
  styleReviewPlan: rel(stylePath),
  manifest: rel(manifestPath)
}, null, 2));
