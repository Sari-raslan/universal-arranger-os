import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safetyBlock() {
  return {
    planningOnly: true,
    metadataOnly: true,
    implementationAllowedNow: false,
    sourceProjectModified: false,
    autoApplyEnabled: false,
    realApplyAllowed: false,
    korgOutputAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false,
    exportApproval: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const createdAt = new Date().toISOString();
const v37ProjectPath = path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json");
const v52SealPath = path.join(base, "v52", "generated", "UAOS_V52_METADATA_FREEZE_ACCEPTANCE_SEAL.json");
const v52GapPath = path.join(base, "v52", "generated", "UAOS_V52_EXPORT_READINESS_GAP_ANALYSIS.json");
const v52GatePath = path.join(base, "v52", "generated", "UAOS_V52_BLOCKED_EXPORT_GATE_MATRIX.json");
const project = readJson(v37ProjectPath);
const seal = readJson(v52SealPath);
const gap = readJson(v52GapPath);
const gate = readJson(v52GatePath);

const plan = {
  schemaVersion: "uaos.v53.internal.project.integration.plan.v1",
  createdAt,
  integrationScope: [
    "Read .uaosproject metadata as an internal project candidate.",
    "Map musical intent, tracks, links, and safety flags to internal project manager fields.",
    "Keep all import behavior read-only until explicit owner approval."
  ],
  dataFlow: [
    "uaosproject JSON",
    "read-only parser",
    "validation layer",
    "internal project preview model",
    "owner review screen or report"
  ],
  internalProjectFields: {
    projectId: project.projectId,
    projectName: project.projectName,
    sourceMode: project.sourceMode,
    targetKeyboard: project.targetKeyboard,
    musicalIntent: Object.keys(project.musicalIntent || {}),
    tracks: Array.isArray(project.tracks) ? project.tracks.map((track) => track.trackId || track.role).filter(Boolean) : [],
    links: Object.keys(project.links || {}),
    safety: Object.keys(project.safety || {})
  },
  requiredAdapters: [
    "uaosproject schema reader",
    "track role normalizer",
    "safety gate reader",
    "owner review status adapter",
    "dry-run preview adapter"
  ],
  readOnlyImportPlan: [
    "Load project JSON from a user-selected local path.",
    "Validate schema and safety flags.",
    "Create an in-memory preview only.",
    "Write no source files and mutate no project state."
  ],
  savePlan: [
    "No save is allowed in V53.",
    "Future save requires owner approval, validator pass, and source mutation gate."
  ],
  validationPlan: [
    "Reject any metadata with export flags enabled.",
    "Reject missing schemaVersion/projectId/projectName.",
    "Verify dry-run-only and safety gates before preview.",
    "Cross-check V52 blocked gates remain closed."
  ],
  UIIntegrationBlockedUntilApproval: true,
  appJsChangeRequiredLater: true,
  appJsTouchedNow: false,
  implementationAllowedNow: false,
  sourceProjectModified: false,
  sourceInputs: { v37ProjectPath, v52SealPath, v52GapPath, v52GatePath },
  sourceStatuses: {
    freezeAccepted: seal.metadataFreezeAccepted,
    gapCount: gap.gapCount,
    blockedGateCount: Array.isArray(gate.gates) ? gate.gates.length : 0
  },
  safety: safetyBlock()
};

const md = [
  "# UAOS V53 Internal Project Integration Plan",
  "",
  "This is a plan only.",
  "No app files are modified.",
  "No source project is mutated.",
  "No App.jsx touched.",
  "",
  "## Integration Scope",
  ...plan.integrationScope.map((item) => `- ${item}`),
  "",
  "## Data Flow",
  ...plan.dataFlow.map((item, index) => `${index + 1}. ${item}`),
  "",
  "## Required Adapters",
  ...plan.requiredAdapters.map((item) => `- ${item}`),
  "",
  "Implementation allowed now: NO",
  "App.jsx touched now: NO"
].join("\n");

const report = [
  "# UAOS V53 Internal Project Integration Plan Report",
  "",
  "Status: GENERATED",
  "Safety: planning only, metadata-only, no implementation, no App.jsx."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V53_INTERNAL_PROJECT_INTEGRATION_PLAN.json"), JSON.stringify(plan, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V53_INTERNAL_PROJECT_INTEGRATION_PLAN.md"), md + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V53_INTERNAL_PROJECT_INTEGRATION_PLAN_REPORT.md"), report + "\n", "utf8");
console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V53_INTERNAL_PROJECT_INTEGRATION_PLAN.json" }, null, 2));
