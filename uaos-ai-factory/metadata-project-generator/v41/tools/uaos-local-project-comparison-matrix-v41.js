import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

const paths = {
  v37Project: path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
  v38Score: path.join(base, "v38", "generated", "UAOS_V38_STYLE_REVIEW_SCORE.json"),
  v39Rules: path.join(base, "v39", "generated", "UAOS_V39_STYLE_REVIEW_RULES_EXPANDED.json"),
  v39RuleSummary: path.join(base, "v39", "generated", "UAOS_V39_STYLE_RULE_SCORE_SUMMARY.json"),
  v40Suggestions: path.join(base, "v40", "generated", "UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.json"),
  v40Summary: path.join(base, "v40", "generated", "UAOS_V40_SUGGESTION_SCORE_SUMMARY.json"),
  v41Pack: path.join(root, "generated", "UAOS_V41_SUGGESTION_REVIEW_PACK.json")
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
    exportApproval: false,
    autoApply: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const project = readJson(paths.v37Project);
const score = readJson(paths.v38Score);
const rules = readJson(paths.v39Rules);
const ruleSummary = readJson(paths.v39RuleSummary);
const suggestions = readJson(paths.v40Suggestions);
const suggestionSummary = readJson(paths.v40Summary);
const pack = readJson(paths.v41Pack);
const generatedAt = new Date().toISOString();

const dimensions = [
  { dimension: "metadataCompleteness", v37: 85, v38: score.scores.structureCompletenessScore, v39: ruleSummary.metadataScore, v40: suggestionSummary.metadataCompletenessImprovementPotential, v41: 100 },
  { dimension: "styleReviewDepth", v37: 70, v38: score.scores.styleReviewCompletenessScore, v39: ruleSummary.metadataScore, v40: suggestions.suggestions.length >= 8 ? 95 : 80, v41: pack.reviewItems.length >= 8 ? 100 : 85 },
  { dimension: "dspPlanCompleteness", v37: 90, v38: score.scores.dspPlanCompletenessScore, v39: 95, v40: suggestions.suggestions.some((item) => item.category === "dspIntent") ? 100 : 80, v41: pack.groups.dspMetadataImprovement.length ? 100 : 80 },
  { dimension: "safetyCoverage", v37: 100, v38: score.scores.safetyScore, v39: 100, v40: 100, v41: 100 },
  { dimension: "humanReviewReadiness", v37: 75, v38: score.scores.humanReviewNeedScore, v39: 95, v40: suggestionSummary.humanReviewRequiredCount > 0 ? 100 : 75, v41: pack.groups.humanReviewRequired.length > 0 ? 100 : 75 },
  { dimension: "exportBlockedStatus", v37: 100, v38: 100, v39: 100, v40: 100, v41: 100 },
  { dimension: "ownerReviewReadiness", v37: 60, v38: 75, v39: 85, v40: 90, v41: 100 }
];

const average = (values) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
const overallMetadataMaturityScore = average(dimensions.map((item) => item.v41));
const scorecard = {
  schemaVersion: "uaos.v41.project.comparison.scorecard.v1",
  generatedAt,
  metadataOnly: true,
  projectId: project.projectId,
  overallMetadataMaturityScore,
  safetyScore: 100,
  reviewReadinessScore: 100,
  exportReadinessScore: 0,
  usbReadinessScore: 0,
  keyboardLoadReadinessScore: 0,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  safety: safetyBlock()
};

const matrix = {
  schemaVersion: "uaos.v41.local.project.comparison.matrix.v1",
  generatedAt,
  metadataOnly: true,
  comparedArtifacts: ["V37 project bundle", "V38 inspection/scoring", "V39 rules/report", "V40 suggestions", "V41 review pack"],
  dimensions,
  notes: [
    "Scores are metadata-only.",
    "Scores do not imply KORG compatibility.",
    "Scores do not imply PA3X readiness.",
    "Scores do not approve export."
  ],
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  safety: safetyBlock()
};

const recommendation = {
  schemaVersion: "uaos.v41.next.recommendation.matrix.v1",
  generatedAt,
  metadataOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V42 Metadata Plan Apply Simulator, dry-run only", safety: "metadata-only dry-run", recommended: true },
    { id: "B", action: "V42 Local HTML Review Dashboard", safety: "no App.jsx, no deploy", recommended: true },
    { id: "C", action: "V42 Batch Metadata Project Generator", safety: "metadata-only", recommended: false },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["A", "B"],
  safety: safetyBlock()
};

const matrixMd = [
  "# UAOS V41 Local Project Comparison Matrix",
  "",
  "Scores are metadata-only. They do not imply KORG compatibility, PA3X readiness, or export approval.",
  "",
  "| Dimension | V37 | V38 | V39 | V40 | V41 |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...dimensions.map((item) => `| ${item.dimension} | ${item.v37} | ${item.v38} | ${item.v39} | ${item.v40} | ${item.v41} |`),
  "",
  `Overall metadata maturity score: ${overallMetadataMaturityScore}`,
  "Export readiness score: 0",
  "USB readiness score: 0",
  "Keyboard load readiness score: 0"
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V41_LOCAL_PROJECT_COMPARISON_MATRIX.json"), JSON.stringify(matrix, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V41_LOCAL_PROJECT_COMPARISON_MATRIX.md"), matrixMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V41_PROJECT_COMPARISON_SCORECARD.json"), JSON.stringify(scorecard, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V41_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(recommendation, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V41_PROJECT_COMPARISON_MATRIX_REPORT.md"), [
  "# UAOS V41 Project Comparison Matrix Report",
  "",
  "Status: GENERATED",
  "",
  `Overall metadata maturity score: ${overallMetadataMaturityScore}`,
  "Safety score: 100",
  "Review readiness score: 100",
  "Export readiness score: 0",
  "USB readiness score: 0",
  "Keyboard load readiness score: 0",
  "",
  "Safety: metadata-only comparison, no export approval."
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", overallMetadataMaturityScore, scorecard: "generated/UAOS_V41_PROJECT_COMPARISON_SCORECARD.json" }, null, 2));
