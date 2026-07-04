import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const v37Root = path.resolve(root, "..", "v37");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const generatedAt = new Date().toISOString();

const files = {
  project: path.join(v37Root, "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
  dsp: path.join(v37Root, "generated", "UAOS_EXAMPLE_DSP_PLAN_V37.json"),
  style: path.join(v37Root, "generated", "UAOS_EXAMPLE_STYLE_REVIEW_PLAN_V37.json"),
  manifest: path.join(v37Root, "generated", "UAOS_EXAMPLE_PROJECT_BUNDLE_MANIFEST_V37.json")
};

function readJson(filePath, missingFields, label) {
  if (!fs.existsSync(filePath)) {
    missingFields.push(`${label} file`);
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function rel(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function hasAll(object, keys) {
  return keys.filter((key) => object == null || object[key] === undefined);
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

const missingFields = [];
const warnings = [];
const project = readJson(files.project, missingFields, "project");
const dsp = readJson(files.dsp, missingFields, "DSP plan");
const style = readJson(files.style, missingFields, "style review plan");
const manifest = readJson(files.manifest, missingFields, "manifest");

if (project) {
  missingFields.push(...hasAll(project, ["schemaVersion", "projectId", "projectName", "sourceMode", "targetKeyboard", "safety", "musicalIntent", "tracks", "links"]).map((item) => `project.${item}`));
  missingFields.push(...hasAll(project.musicalIntent, ["styleFamily", "tempo", "timeSignature", "scaleMode", "chordProgression", "sections"]).map((item) => `project.musicalIntent.${item}`));
  if (!Array.isArray(project.tracks) || project.tracks.length < 5) missingFields.push("project.tracks complete set");
  if (project.links && !fs.existsSync(path.join(v37Root, project.links.dspPlanPath || ""))) missingFields.push("project.links.dspPlanPath target");
  if (project.links && !fs.existsSync(path.join(v37Root, project.links.styleReviewPlanPath || ""))) missingFields.push("project.links.styleReviewPlanPath target");
  if (project.links && !fs.existsSync(path.join(v37Root, project.links.manifestPath || ""))) missingFields.push("project.links.manifestPath target");
}
if (manifest && Array.isArray(manifest.files)) {
  for (const entry of manifest.files) {
    if (entry.path === "generated/UAOS_EXAMPLE_PROJECT_BUNDLE_MANIFEST_V37.json") continue;
    const absolute = path.join(v37Root, entry.path);
    if (!fs.existsSync(absolute)) {
      warnings.push(`Manifest entry missing on disk: ${entry.path}`);
    } else if (entry.sha256 && entry.sha256 !== sha256(absolute)) {
      warnings.push(`Manifest hash mismatch: ${entry.path}`);
    }
  }
} else {
  missingFields.push("manifest.files");
}

const safetyStatus = {
  metadataOnly: Boolean(project?.safety?.metadataOnly && dsp?.safety?.metadataOnly),
  korgOutputAllowed: Boolean(project?.safety?.korgOutputAllowed),
  setModificationAllowed: Boolean(project?.safety?.setModificationAllowed),
  usbWriteAllowed: Boolean(project?.safety?.usbWriteAllowed),
  keyboardLoadAllowed: Boolean(project?.safety?.keyboardLoadAllowed),
  compatibilityClaim: Boolean(project?.safety?.compatibilityClaim),
  pa3xReadyClaim: Boolean(project?.safety?.pa3xReadyClaim)
};

const inspection = {
  schemaVersion: "uaos.v38.bundle.inspection.v1",
  generatedAt,
  metadataOnly: true,
  korgOutputAllowed: false,
  setModificationAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  compatibilityClaim: false,
  pa3xReadyClaim: false,
  validBundle: missingFields.length === 0 && warnings.length === 0 && safetyStatus.metadataOnly && !safetyStatus.korgOutputAllowed && !safetyStatus.setModificationAllowed && !safetyStatus.usbWriteAllowed && !safetyStatus.keyboardLoadAllowed && !safetyStatus.compatibilityClaim && !safetyStatus.pa3xReadyClaim,
  project: project ? {
    schemaVersion: project.schemaVersion,
    projectId: project.projectId,
    projectName: project.projectName,
    sourceMode: project.sourceMode,
    targetKeyboard: project.targetKeyboard
  } : null,
  missingFields,
  warnings,
  safetyStatus,
  linkStatus: {
    dspLinkExists: Boolean(project?.links?.dspPlanPath && fs.existsSync(path.join(v37Root, project.links.dspPlanPath))),
    styleReviewLinkExists: Boolean(project?.links?.styleReviewPlanPath && fs.existsSync(path.join(v37Root, project.links.styleReviewPlanPath))),
    manifestExists: fs.existsSync(files.manifest)
  },
  manifestHashesChecked: Boolean(manifest && Array.isArray(manifest.files)),
  recommendedNextActions: [
    "Improve metadata completeness if missing fields appear.",
    "Add human review notes before any future simulator use.",
    "Continue to V39 metadata viewer or CLI report exporter.",
    "Keep hardware output blocked."
  ],
  safety: safetyBlock()
};

const outputJson = path.join(generatedDir, "UAOS_V38_PROJECT_BUNDLE_INSPECTION.json");
const outputMd = path.join(generatedDir, "UAOS_V38_PROJECT_BUNDLE_INSPECTION.md");
fs.writeFileSync(outputJson, JSON.stringify(inspection, null, 2) + "\n", "utf8");
fs.writeFileSync(outputMd, [
  "# UAOS V38 Project Bundle Inspection",
  "",
  `Valid bundle: ${inspection.validBundle ? "YES" : "NO"}`,
  `Project: ${inspection.project?.projectName || "missing"}`,
  `Project id: ${inspection.project?.projectId || "missing"}`,
  `Source mode: ${inspection.project?.sourceMode || "missing"}`,
  "",
  "## Safety",
  "",
  "- Metadata only: YES",
  "- KORG output allowed: NO",
  "- SET modification allowed: NO",
  "- USB write allowed: NO",
  "- Keyboard load allowed: NO",
  "",
  "## Recommended Next Actions",
  "",
  ...inspection.recommendedNextActions.map((item) => `- ${item}`)
].join("\n") + "\n", "utf8");

fs.writeFileSync(path.join(reportsDir, "UAOS_V38_CLI_INSPECTOR_REPORT.md"), [
  "# UAOS V38 CLI Inspector Report",
  "",
  "Status: GENERATED",
  "",
  `Inspection JSON: ${rel(outputJson)}`,
  `Inspection Markdown: ${rel(outputMd)}`,
  "",
  `Valid bundle: ${inspection.validBundle ? "YES" : "NO"}`,
  "",
  "Safety: metadata-only inspection, no KORG output, no SET modification, no USB write, no PA3X load."
].join("\n") + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", validBundle: inspection.validBundle, output: rel(outputJson) }, null, 2));
