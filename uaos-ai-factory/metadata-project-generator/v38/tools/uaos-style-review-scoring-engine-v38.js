import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const v37Root = path.resolve(root, "..", "v37");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

const files = {
  project: path.join(v37Root, "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
  dsp: path.join(v37Root, "generated", "UAOS_EXAMPLE_DSP_PLAN_V37.json"),
  style: path.join(v37Root, "generated", "UAOS_EXAMPLE_STYLE_REVIEW_PLAN_V37.json")
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function pct(done, total) {
  return Math.round((done / total) * 100);
}

function presentCount(object, keys) {
  return keys.filter((key) => object && object[key] !== undefined && object[key] !== null && object[key] !== "").length;
}

function safetyBlock() {
  return {
    metadataOnly: true,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const project = readJson(files.project);
const dsp = readJson(files.dsp);
const style = readJson(files.style);

const intentKeys = ["styleFamily", "tempo", "timeSignature", "scaleMode", "chordProgression", "sections"];
const trackIds = new Set((project.tracks || []).map((track) => track.trackId));
const expectedTracks = ["drums", "bass", "chords", "pad", "melodyGuide"];
const structureCompletenessScore = Math.round((pct(presentCount(project.musicalIntent, intentKeys), intentKeys.length) + pct(expectedTracks.filter((track) => trackIds.has(track)).length, expectedTracks.length)) / 2);

const dspChannelKeys = ["trackId", "role", "eqIntent", "compressionIntent", "reverbIntent", "stereoIntent"];
const dspDone = (dsp.channels || []).reduce((sum, channel) => sum + presentCount(channel, dspChannelKeys), 0);
const dspPlanCompletenessScore = pct(dspDone, expectedTracks.length * dspChannelKeys.length);

const checklistKeys = ["intro", "variation1", "variation2", "variation3", "variation4", "fill", "ending"];
const arrangerKeys = ["drumDensity", "bassMovement", "chordRhythm", "melodySpace", "orientalFeel"];
const styleReviewCompletenessScore = Math.round((pct(presentCount(style.styleChecklist, checklistKeys), checklistKeys.length) + pct(presentCount(style.arrangerNotes, arrangerKeys), arrangerKeys.length)) / 2);

const safe = project.safety?.metadataOnly === true &&
  project.safety?.korgOutputAllowed === false &&
  project.safety?.setModificationAllowed === false &&
  project.safety?.usbWriteAllowed === false &&
  project.safety?.keyboardLoadAllowed === false &&
  project.safety?.compatibilityClaim === false &&
  project.safety?.pa3xReadyClaim === false &&
  dsp.safety?.metadataOnly === true &&
  dsp.safety?.audioRenderAllowed === false &&
  dsp.safety?.pluginExecutionAllowed === false &&
  style.reviewStatus?.approvedForKorgExport === false;
const safetyScore = safe ? 100 : 0;
const arrangerReadinessScore = Math.round((structureCompletenessScore + dspPlanCompletenessScore + styleReviewCompletenessScore) / 3);
const humanReviewNeedScore = style.reviewStatus?.humanReviewRequired ? 100 : 25;

const score = {
  schemaVersion: "uaos.v38.style.review.score.v1",
  generatedAt: new Date().toISOString(),
  metadataOnly: true,
  korgOutputAllowed: false,
  setModificationAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  compatibilityClaim: false,
  pa3xReadyClaim: false,
  projectId: project.projectId,
  scores: {
    structureCompletenessScore,
    dspPlanCompletenessScore,
    styleReviewCompletenessScore,
    safetyScore,
    arrangerReadinessScore,
    humanReviewNeedScore
  },
  notes: [
    "Scores are metadata-only.",
    "Scores do not mean KORG compatibility.",
    "Scores do not mean PA3X-ready.",
    "Scores do not approve export.",
    "Scores do not approve USB or load."
  ],
  safety: safetyBlock()
};

const matrix = {
  schemaVersion: "uaos.v38.recommendation.matrix.v1",
  generatedAt: score.generatedAt,
  metadataOnly: true,
  korgOutputAllowed: false,
  setModificationAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  compatibilityClaim: false,
  pa3xReadyClaim: false,
  recommendations: [
    { id: "A", action: "Improve metadata completeness", priority: structureCompletenessScore < 100 ? "medium" : "low" },
    { id: "B", action: "Add more musical-intent fields", priority: structureCompletenessScore < 100 ? "medium" : "low" },
    { id: "C", action: "Add human review notes", priority: "high" },
    { id: "D", action: "Continue to V39 metadata viewer or CLI report exporter", priority: "high" },
    { id: "E", action: "Stop", priority: "available" }
  ],
  recommended: ["A", "C"],
  safety: safetyBlock()
};

const health = {
  schemaVersion: "uaos.v38.project.health.summary.v1",
  generatedAt: score.generatedAt,
  metadataOnly: true,
  korgOutputAllowed: false,
  setModificationAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  compatibilityClaim: false,
  pa3xReadyClaim: false,
  health: {
    validMetadataInputs: true,
    averageCompletenessScore: arrangerReadinessScore,
    safetyScore,
    humanReviewNeedScore,
    nextPhaseRecommendation: "V39 Metadata HTML Report Exporter or V39 Style Review Rules Expansion"
  },
  safety: safetyBlock()
};

const scoreJson = path.join(generatedDir, "UAOS_V38_STYLE_REVIEW_SCORE.json");
const scoreMd = path.join(generatedDir, "UAOS_V38_STYLE_REVIEW_SCORE.md");
const matrixJson = path.join(generatedDir, "UAOS_V38_RECOMMENDATION_MATRIX.json");
const healthJson = path.join(generatedDir, "UAOS_V38_PROJECT_HEALTH_SUMMARY.json");
fs.writeFileSync(scoreJson, JSON.stringify(score, null, 2) + "\n", "utf8");
fs.writeFileSync(matrixJson, JSON.stringify(matrix, null, 2) + "\n", "utf8");
fs.writeFileSync(healthJson, JSON.stringify(health, null, 2) + "\n", "utf8");
fs.writeFileSync(scoreMd, [
  "# UAOS V38 Style Review Score",
  "",
  `Structure completeness: ${structureCompletenessScore}`,
  `DSP plan completeness: ${dspPlanCompletenessScore}`,
  `Style review completeness: ${styleReviewCompletenessScore}`,
  `Safety score: ${safetyScore}`,
  `Arranger readiness: ${arrangerReadinessScore}`,
  `Human review need: ${humanReviewNeedScore}`,
  "",
  "These scores are metadata-only and do not approve export, hardware loading, USB transfer, or compatibility."
].join("\n") + "\n", "utf8");

fs.writeFileSync(path.join(reportsDir, "UAOS_V38_STYLE_SCORING_REPORT.md"), [
  "# UAOS V38 Style Scoring Report",
  "",
  "Status: GENERATED",
  "",
  `Structure completeness score: ${structureCompletenessScore}`,
  `DSP plan completeness score: ${dspPlanCompletenessScore}`,
  `Style review completeness score: ${styleReviewCompletenessScore}`,
  `Safety score: ${safetyScore}`,
  "",
  "Safety: metadata-only scoring, no KORG output, no SET modification, no USB write, no PA3X load."
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", scores: score.scores, output: "generated/UAOS_V38_STYLE_REVIEW_SCORE.json" }, null, 2));
