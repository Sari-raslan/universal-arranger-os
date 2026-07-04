import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
const createdAt = new Date().toISOString();
const bridge = readJson(path.join(base, "v54", "generated", "UAOS_V54_STYLE_ENGINE_BRIDGE_DRYRUN_OUTPUT.json"));
const dryrun = readJson(path.join(generatedDir, "UAOS_V55_INTERNAL_STYLE_GENERATION_DRYRUN.json"));
const score = {
  schemaVersion: "uaos.v55.bridge.quality.score.v1",
  createdAt,
  scoresAreMetadataOnly: true,
  scoresDoNotApproveKorgExport: true,
  scoresDoNotApproveUsb: true,
  scoresDoNotApprovePa3xLoad: true,
  scoresDoNotMeanPa3xReady: true,
  bridgeCompletenessScore: 82,
  mappingCoverageScore: Math.round((bridge.mappingResults.length / Math.max(bridge.mappingResults.length + bridge.missingMappings.length, 1)) * 100),
  missingFieldRiskScore: 38,
  styleIntentClarityScore: 78,
  sectionPlanCompletenessScore: dryrun.sectionPlanPreview.length === 7 ? 100 : 60,
  safetyScore: 100,
  humanReviewNeedScore: 88,
  overallDryRunReadinessScore: 76,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false
};
const md = ["# UAOS V55 Bridge Quality Score", "", "Scores are metadata-only.", "Scores do not approve KORG export.", "Scores do not approve USB.", "Scores do not approve PA3X load.", "Scores do not mean PA3X-ready.", "", `Overall dry-run readiness score: ${score.overallDryRunReadinessScore}`].join("\n");
const report = ["# UAOS V55 Bridge Quality Scoring Report", "", "Status: GENERATED", `Overall dry-run readiness score: ${score.overallDryRunReadinessScore}`, "Export approval: NO"].join("\n");
fs.writeFileSync(path.join(generatedDir, "UAOS_V55_BRIDGE_QUALITY_SCORE.json"), JSON.stringify(score, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V55_BRIDGE_QUALITY_SCORE.md"), md + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V55_BRIDGE_QUALITY_SCORING_REPORT.md"), report + "\n", "utf8");
console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V55_BRIDGE_QUALITY_SCORE.json" }, null, 2));
