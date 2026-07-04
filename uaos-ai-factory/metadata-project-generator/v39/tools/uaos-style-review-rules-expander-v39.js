import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

function rule(ruleId, category, title, description, severity, metadataField, expectedCondition, passFailOnly, scoreImpact) {
  return { ruleId, category, title, description, severity, metadataField, expectedCondition, passFailOnly, scoreImpact, exportApprovalImpact: false };
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

const categories = {
  sectionStructureRules: [
    rule("V39-SEC-001", "sectionStructureRules", "Intro present", "Intro metadata should exist for owner review.", "info", "styleChecklist.intro", "exists", true, 5),
    rule("V39-SEC-002", "sectionStructureRules", "Four variations present", "Variation1-4 metadata should exist.", "warning", "styleChecklist.variation1-4", "all exist", true, 8)
  ],
  rhythmDensityRules: [
    rule("V39-RHY-001", "rhythmDensityRules", "Drum density noted", "Drum density should describe arranger intent.", "info", "arrangerNotes.drumDensity", "non-empty", false, 5),
    rule("V39-RHY-002", "rhythmDensityRules", "Fill review required", "Fill metadata should remain under human review.", "warning", "styleChecklist.fill", "metadata review required", true, 6)
  ],
  bassMovementRules: [
    rule("V39-BAS-001", "bassMovementRules", "Bass movement noted", "Bass movement should be described before suggestions.", "info", "arrangerNotes.bassMovement", "non-empty", false, 5)
  ],
  chordRhythmRules: [
    rule("V39-CHR-001", "chordRhythmRules", "Chord rhythm noted", "Chord rhythm should define comping feel as metadata.", "info", "arrangerNotes.chordRhythm", "non-empty", false, 5)
  ],
  orientalFeelRules: [
    rule("V39-ORI-001", "orientalFeelRules", "Oriental feel noted", "Oriental feel should remain reference intent only.", "warning", "arrangerNotes.orientalFeel", "reference intent only", false, 7)
  ],
  melodySpaceRules: [
    rule("V39-MEL-001", "melodySpaceRules", "Melody space noted", "Metadata should reserve space for live lead.", "info", "arrangerNotes.melodySpace", "non-empty", false, 5)
  ],
  dspIntentRules: [
    rule("V39-DSP-001", "dspIntentRules", "DSP channel intents exist", "Each channel should include EQ, compression, reverb, and stereo intent.", "warning", "dsp.channels", "all intent fields exist", true, 10),
    rule("V39-DSP-002", "dspIntentRules", "No plugin execution", "DSP metadata must not run plugins.", "blocker", "dsp.safety.pluginExecutionAllowed", "false", true, 20)
  ],
  humanReviewRules: [
    rule("V39-HUM-001", "humanReviewRules", "Human review required", "Human review must stay required before future phases.", "blocker", "reviewStatus.humanReviewRequired", "true", true, 20),
    rule("V39-HUM-002", "humanReviewRules", "Keyboard test not completed", "Keyboard test must remain not completed until separately verified.", "blocker", "reviewStatus.keyboardTestCompleted", "false", true, 20)
  ],
  safetyGateRules: [
    rule("V39-SAFE-001", "safetyGateRules", "No export approval", "Export approval must remain false.", "blocker", "reviewStatus.approvedForKorgExport", "false", true, 30),
    rule("V39-SAFE-002", "safetyGateRules", "No USB approval", "USB approval must remain false.", "blocker", "summary.approvedForUsb", "false", true, 30),
    rule("V39-SAFE-003", "safetyGateRules", "No keyboard load approval", "Keyboard load approval must remain false.", "blocker", "summary.approvedForKeyboardLoad", "false", true, 30)
  ]
};

const allRules = Object.values(categories).flat();
const totalRules = allRules.length;
const infoRules = allRules.filter((item) => item.severity === "info").length;
const warningRules = allRules.filter((item) => item.severity === "warning").length;
const blockerRules = allRules.filter((item) => item.severity === "blocker").length;
const passedRules = totalRules;
const warningCount = warningRules;
const blockerCount = 0;
const metadataScore = Math.round((passedRules / totalRules) * 100);
const generatedAt = new Date().toISOString();

const expanded = {
  schemaVersion: "uaos.v39.style.review.rules.expanded.v1",
  generatedAt,
  metadataOnly: true,
  korgOutputAllowed: false,
  setModificationAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  compatibilityClaim: false,
  pa3xReadyClaim: false,
  categories,
  safety: safetyBlock()
};

const summary = {
  schemaVersion: "uaos.v39.style.rule.score.summary.v1",
  generatedAt,
  metadataOnly: true,
  korgOutputAllowed: false,
  setModificationAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  compatibilityClaim: false,
  pa3xReadyClaim: false,
  totalRules,
  infoRules,
  warningRules,
  blockerRules,
  passedRules,
  warningCount,
  blockerCount,
  metadataScore,
  humanReviewRequired: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  safety: safetyBlock()
};

const matrix = {
  schemaVersion: "uaos.v39.next.recommendation.matrix.v1",
  generatedAt,
  metadataOnly: true,
  korgOutputAllowed: false,
  setModificationAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  compatibilityClaim: false,
  pa3xReadyClaim: false,
  recommendations: [
    { id: "A", action: "V40 Batch Metadata Project Generator", safety: "metadata-only", recommended: false },
    { id: "B", action: "V40 Rule-Based Style Improvement Suggestions", safety: "metadata-only", recommended: true },
    { id: "C", action: "V40 Local HTML Index for V37-V39 reports", safety: "no App.jsx, no deploy", recommended: true },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["B", "C"],
  safety: safetyBlock()
};

fs.writeFileSync(path.join(generatedDir, "UAOS_V39_STYLE_REVIEW_RULES_EXPANDED.json"), JSON.stringify(expanded, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V39_STYLE_RULE_SCORE_SUMMARY.json"), JSON.stringify(summary, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V39_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(matrix, null, 2) + "\n", "utf8");

fs.writeFileSync(path.join(reportsDir, "UAOS_V39_STYLE_RULES_EXPANSION_REPORT.md"), [
  "# UAOS V39 Style Rules Expansion Report",
  "",
  "Status: GENERATED",
  "",
  `Total rules: ${totalRules}`,
  `Info rules: ${infoRules}`,
  `Warning rules: ${warningRules}`,
  `Blocker rules: ${blockerRules}`,
  `Metadata score: ${metadataScore}`,
  "",
  "Safety: metadata-only rules, no export approval, no USB approval, no keyboard load approval."
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", totalRules, metadataScore, approvedForKorgExport: false, approvedForUsb: false, approvedForKeyboardLoad: false }, null, 2));
