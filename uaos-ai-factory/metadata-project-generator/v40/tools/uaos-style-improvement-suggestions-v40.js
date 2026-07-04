import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

const inputPaths = {
  project: path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
  dsp: path.join(base, "v37", "generated", "UAOS_EXAMPLE_DSP_PLAN_V37.json"),
  style: path.join(base, "v37", "generated", "UAOS_EXAMPLE_STYLE_REVIEW_PLAN_V37.json"),
  inspection: path.join(base, "v38", "generated", "UAOS_V38_PROJECT_BUNDLE_INSPECTION.json"),
  score: path.join(base, "v38", "generated", "UAOS_V38_STYLE_REVIEW_SCORE.json"),
  rules: path.join(base, "v39", "generated", "UAOS_V39_STYLE_REVIEW_RULES_EXPANDED.json"),
  ruleSummary: path.join(base, "v39", "generated", "UAOS_V39_STYLE_RULE_SCORE_SUMMARY.json")
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safetyBlock() {
  return {
    metadataOnly: true,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false,
    exportApproval: false
  };
}

function suggestion(suggestionId, category, title, reason, metadataField, suggestedMetadataChange, priority, humanReviewRequired) {
  return {
    suggestionId,
    category,
    title,
    reason,
    metadataField,
    suggestedMetadataChange,
    priority,
    humanReviewRequired,
    canAutoApply: false,
    exportApprovalImpact: false,
    korgOutputAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const project = readJson(inputPaths.project);
const dsp = readJson(inputPaths.dsp);
const style = readJson(inputPaths.style);
const inspection = readJson(inputPaths.inspection);
const score = readJson(inputPaths.score);
const rules = readJson(inputPaths.rules);
const ruleSummary = readJson(inputPaths.ruleSummary);
const generatedAt = new Date().toISOString();

const suggestions = [
  suggestion("V40-SEC-001", "sectionStructure", "Add owner notes per section", "All sections exist, but owner-facing notes would make review easier.", "styleChecklist.*.ownerNote", "Add optional ownerNote fields for intro, variations, fill, and ending.", "medium", true),
  suggestion("V40-RHY-001", "rhythmDensity", "Define density targets by section", "Current drum density is global metadata; section-level density can guide future review.", "arrangerNotes.rhythmDensityBySection", "Add low/medium/high density intent for each section.", "high", true),
  suggestion("V40-BAS-001", "bassMovement", "Add bass movement contour", "Bass movement is described broadly; contour tags can improve review precision.", "arrangerNotes.bassMovementContour", "Add root_hold, passing_motion, and turnaround tags as metadata only.", "medium", true),
  suggestion("V40-CHR-001", "chordRhythm", "Add chord rhythm pattern labels", "Chord rhythm exists as prose; labels help compare style sections.", "arrangerNotes.chordRhythmPatterns", "Add metadata labels such as stab, syncopated, held, and push.", "medium", true),
  suggestion("V40-ORI-001", "orientalFeel", "Separate feel from compatibility", "Oriental feel should remain a musical reference, not a device claim.", "arrangerNotes.orientalFeelReference", "Keep maqam/feel notes as reference-only metadata.", "high", true),
  suggestion("V40-MEL-001", "melodySpace", "Add melody space map", "Live lead space is noted; section-level space improves arranger review.", "arrangerNotes.melodySpaceBySection", "Add sparse/medium/busy melody-space values per section.", "medium", true),
  suggestion("V40-DSP-001", "dspIntent", "Add DSP intent confidence", "DSP channels are complete; confidence labels make future scoring clearer.", "dsp.channels[].intentConfidence", "Add low/medium/high confidence metadata for each DSP channel.", "low", true),
  suggestion("V40-HUM-001", "humanReview", "Add reviewer checklist slots", "Human review remains required; checklist slots can capture decisions safely.", "reviewStatus.humanReviewerNotes", "Add empty metadata-only reviewer note fields.", "high", true),
  suggestion("V40-SAFE-001", "safetyGate", "Keep export gates locked", "All future suggestion consumers must preserve blocked output gates.", "safety.exportGates", "Mirror approvedForKorgExport, approvedForUsb, and approvedForKeyboardLoad as false.", "high", false)
];

const counts = {
  totalSuggestions: suggestions.length,
  highPriorityCount: suggestions.filter((item) => item.priority === "high").length,
  mediumPriorityCount: suggestions.filter((item) => item.priority === "medium").length,
  lowPriorityCount: suggestions.filter((item) => item.priority === "low").length,
  humanReviewRequiredCount: suggestions.filter((item) => item.humanReviewRequired).length
};

const suggestionsDoc = {
  schemaVersion: "uaos.v40.style.improvement.suggestions.v1",
  generatedAt,
  metadataOnly: true,
  sourceProjectId: project.projectId,
  sourceInspectionValid: inspection.validBundle,
  sourceScores: score.scores,
  sourceRuleScore: ruleSummary.metadataScore,
  sourceRuleCategories: Object.keys(rules.categories),
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  suggestions,
  safety: safetyBlock()
};

const summary = {
  schemaVersion: "uaos.v40.suggestion.score.summary.v1",
  generatedAt,
  metadataOnly: true,
  ...counts,
  metadataCompletenessImprovementPotential: Math.min(100, counts.highPriorityCount * 18 + counts.mediumPriorityCount * 10 + counts.lowPriorityCount * 4),
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  safety: safetyBlock()
};

const matrix = {
  schemaVersion: "uaos.v40.next.recommendation.matrix.v1",
  generatedAt,
  metadataOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V41 Metadata Suggestion Review Pack", safety: "metadata-only", recommended: true },
    { id: "B", action: "V41 Batch Metadata Project Generator", safety: "metadata-only", recommended: false },
    { id: "C", action: "V41 Local Project Comparison Matrix", safety: "metadata-only", recommended: true },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["A", "C"],
  safety: safetyBlock()
};

const md = [
  "# UAOS V40 Style Improvement Suggestions",
  "",
  "Status: GENERATED",
  "",
  ...suggestions.map((item) => `## ${item.suggestionId} ${item.title}\n\n- Category: ${item.category}\n- Priority: ${item.priority}\n- Human review required: ${item.humanReviewRequired ? "YES" : "NO"}\n- Field: ${item.metadataField}\n- Suggestion: ${item.suggestedMetadataChange}\n- Safety: metadata-only, no auto-apply, no export approval\n`)
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.json"), JSON.stringify(suggestionsDoc, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.md"), md, "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V40_SUGGESTION_SCORE_SUMMARY.json"), JSON.stringify(summary, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V40_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(matrix, null, 2) + "\n", "utf8");

fs.writeFileSync(path.join(reportsDir, "UAOS_V40_STYLE_SUGGESTIONS_REPORT.md"), [
  "# UAOS V40 Style Suggestions Report",
  "",
  "Status: GENERATED",
  "",
  `Total suggestions: ${counts.totalSuggestions}`,
  `High priority: ${counts.highPriorityCount}`,
  `Medium priority: ${counts.mediumPriorityCount}`,
  `Low priority: ${counts.lowPriorityCount}`,
  `Human review required: ${counts.humanReviewRequiredCount}`,
  "",
  "Safety: metadata-only suggestions, no auto-apply, no export approval."
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", totalSuggestions: suggestions.length, summary: "generated/UAOS_V40_SUGGESTION_SCORE_SUMMARY.json" }, null, 2));
