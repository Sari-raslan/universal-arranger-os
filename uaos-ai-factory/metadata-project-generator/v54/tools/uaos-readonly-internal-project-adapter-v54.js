import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const sourceProjectPath = path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json");
const planPath = path.join(base, "v53", "generated", "UAOS_V53_INTERNAL_PROJECT_INTEGRATION_PLAN.json");

function readJson(filePath) { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
function safetyBlock() {
  return { readOnly: true, metadataOnly: true, dryRunOnly: true, sourceProjectModified: false, implementationAllowedNow: false, appJsTouchedNow: false, korgOutputAllowed: false, usbWriteAllowed: false, keyboardLoadAllowed: false };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
const createdAt = new Date().toISOString();
const project = readJson(sourceProjectPath);
const plan = readJson(planPath);
const tracks = Array.isArray(project.tracks) ? project.tracks : [];
const output = {
  schemaVersion: "uaos.v54.internal.project.adapter.output.v1",
  adapterId: `uaos-v54-readonly-adapter-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  createdAt,
  sourceProjectPath,
  sourcePlanPath: planPath,
  readOnly: true,
  sourceProjectModified: false,
  internalProjectModel: {
    projectIdentity: { projectId: project.projectId, projectName: project.projectName, schemaVersion: project.schemaVersion },
    musicalIntent: project.musicalIntent,
    tracks,
    dspPlanLink: project.links?.dspPlanPath || null,
    styleReviewPlanLink: project.links?.styleReviewPlanPath || null,
    safety: project.safety,
    ownerReviewStatus: "human_review_required"
  },
  normalizedFields: {
    tempo: project.musicalIntent?.tempo ?? null,
    timeSignature: project.musicalIntent?.timeSignature ?? null,
    scaleMode: project.musicalIntent?.scaleMode ?? null,
    sectionCount: Array.isArray(project.musicalIntent?.sections) ? project.musicalIntent.sections.length : 0,
    trackRoles: tracks.map((track) => track.role || track.trackId).filter(Boolean)
  },
  missingFields: ["owner decision completion", "style engine bridge dry-run result", "export gate approvals"],
  warnings: ["Read-only prototype only; no save path is enabled.", "UI integration remains blocked until explicit approval."],
  validationStatus: "PASS",
  implementationAllowedNow: false,
  appJsTouchedNow: false,
  sourceIntegrationScope: plan.integrationScope,
  safety: safetyBlock()
};
const md = ["# UAOS V54 Internal Project Adapter Output", "", "Read-only adapter prototype only.", "", `Adapter: ${output.adapterId}`, `Project: ${project.projectName}`, "Source project modified: NO", "Implementation allowed now: NO", "App.jsx touched now: NO"].join("\n");
const report = ["# UAOS V54 Internal Project Adapter Report", "", "Status: GENERATED", "Read-only adapter created: YES", "Source project mutation: NO", "App.jsx touched: NO"].join("\n");
fs.writeFileSync(path.join(generatedDir, "UAOS_V54_INTERNAL_PROJECT_ADAPTER_OUTPUT.json"), JSON.stringify(output, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V54_INTERNAL_PROJECT_ADAPTER_OUTPUT.md"), md + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V54_INTERNAL_PROJECT_ADAPTER_REPORT.md"), report + "\n", "utf8");
console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V54_INTERNAL_PROJECT_ADAPTER_OUTPUT.json" }, null, 2));
