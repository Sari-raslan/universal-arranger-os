import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

const sourcePaths = {
  v39MetadataReport: path.join(base, "v39", "generated", "UAOS_V39_METADATA_REPORT.html"),
  v40Suggestions: path.join(base, "v40", "generated", "UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.json"),
  v41ReviewPack: path.join(base, "v41", "generated", "UAOS_V41_SUGGESTION_REVIEW_PACK.json"),
  v43DecisionTemplate: path.join(base, "v43", "generated", "UAOS_V43_OWNER_DECISION_TEMPLATE.json"),
  v44OwnerForm: path.join(base, "v44", "generated", "UAOS_V44_OWNER_REVIEW_FORM.html"),
  v45DecisionSheet: path.join(base, "v45", "generated", "UAOS_V45_OWNER_REVIEW_PRINTABLE_DECISION_SHEET.md"),
  v45ImportTemplate: path.join(base, "v45", "generated", "UAOS_V45_MANUAL_DECISION_IMPORT_TEMPLATE.json"),
  v46Manifest: path.join(base, "v46", "generated", "UAOS_V46_LOCAL_REVIEW_PACK_MANIFEST.json"),
  v47ArchiveIndex: path.join(base, "v47", "generated", "UAOS_V47_LOCAL_ARCHIVE_INDEX_V37_V46.html"),
  v47Health: path.join(base, "v47", "generated", "UAOS_V47_ARCHIVE_HEALTH_SUMMARY.json")
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safetyBlock() {
  return {
    metadataOnly: true,
    reviewWorkflowOnly: true,
    readInspectOnly: true,
    sourceProjectModified: false,
    autoApplyEnabled: false,
    realApplyAllowed: false,
    korgOutputAllowed: false,
    setModificationAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    compatibilityClaim: false,
    pa3xReadyClaim: false,
    exportApproval: false
  };
}

function step(stepId, title, localPath, ownerAction, expectedOutput) {
  return {
    stepId,
    title,
    localPath,
    ownerAction,
    expectedOutput,
    safetyNote: "Metadata-only review step. No real apply, no source mutation, no export approval, no USB write, and no keyboard load.",
    blockedActions: [
      "real apply",
      "source project mutation",
      "auto-apply",
      "KORG output",
      "SET/STY/PRF/PRS/KST generation",
      "USB write",
      "PA3X load",
      "export approval",
      "App.jsx integration",
      "deploy"
    ]
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const generatedAt = new Date().toISOString();
const v41ReviewPack = readJson(sourcePaths.v41ReviewPack);
const v43DecisionTemplate = readJson(sourcePaths.v43DecisionTemplate);
const v46Manifest = readJson(sourcePaths.v46Manifest);
const v47Health = readJson(sourcePaths.v47Health);

const steps = [
  step("step-01", "Open V47 local archive index", sourcePaths.v47ArchiveIndex, "Open the local index and confirm V37-V47 materials are visible.", "Owner sees the local archive map."),
  step("step-02", "Review V39 metadata report", sourcePaths.v39MetadataReport, "Read the metadata report for context before deciding.", "Owner understands the current metadata report."),
  step("step-03", "Review V40 suggestions", sourcePaths.v40Suggestions, "Review rule-based style improvement suggestions.", "Owner identifies which suggestions need decisions."),
  step("step-04", "Review V41 suggestion review pack", sourcePaths.v41ReviewPack, "Review grouped suggestion items and scores.", "Owner sees the review candidates."),
  step("step-05", "Open V44 owner review form", sourcePaths.v44OwnerForm, "Use the local form as a guided review screen.", "Owner can compare decision areas without saving automatically."),
  step("step-06", "Use V45 printable decision sheet", sourcePaths.v45DecisionSheet, "Mark decisions manually on the printable sheet.", "Owner has a human-readable decision record."),
  step("step-07", "Record decisions in V43/V45 decision template", sourcePaths.v45ImportTemplate, "Enter decisions manually using allowed decision values only.", "Decision template is ready for a future dry-run import preview."),
  step("step-08", "Run future dry-run import preview only", path.join(base, "v46", "generated", "UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.json"), "Use only a future dry-run preview to inspect accepted metadata changes.", "Owner sees a preview artifact, not a mutated source project."),
  step("step-09", "Do not export, do not USB, do not PA3X load", path.join(base, "v48", "reports", "UAOS_V48_FINAL_SEAL.md"), "Keep all hardware and export gates closed.", "No export approval, no USB write, and no keyboard load.")
];

const decisionAreas = [
  ["style_suggestions", sourcePaths.v40Suggestions, "accept_for_future_metadata_plan_only"],
  ["suggestion_review_pack", sourcePaths.v41ReviewPack, "reject"],
  ["owner_form_review", sourcePaths.v44OwnerForm, "needs_more_review"],
  ["printable_decision_sheet", sourcePaths.v45DecisionSheet, "defer"],
  ["manual_import_template", sourcePaths.v45ImportTemplate, "accept_for_future_metadata_plan_only"]
];
const decisionMap = {
  schemaVersion: "uaos.v48.owner.review.decision.map.v1",
  generatedAt,
  decisionItems: decisionAreas.map(([decisionArea, relatedFile, allowedDecision]) => ({
    decisionArea,
    relatedFile,
    allowedDecision,
    ownerRequired: true,
    canAutoApply: false,
    metadataOnly: true,
    dryRunOnly: true,
    exportApprovalImpact: false
  })),
  sourceDecisionCount: Array.isArray(v43DecisionTemplate.decisions) ? v43DecisionTemplate.decisions.length : 0,
  safety: safetyBlock()
};

const workflowPack = {
  schemaVersion: "uaos.v48.owner.review.workflow.pack.v1",
  generatedAt,
  metadataOnly: true,
  reviewWorkflowOnly: true,
  readInspectOnly: true,
  sourceProjectModified: false,
  workflowSteps: steps,
  decisionMapPath: path.join(generatedDir, "UAOS_V48_OWNER_REVIEW_DECISION_MAP.json"),
  sourceSummary: {
    v41ReviewItemCount: Array.isArray(v41ReviewPack.reviewItems) ? v41ReviewPack.reviewItems.length : 0,
    v43DecisionCount: Array.isArray(v43DecisionTemplate.decisions) ? v43DecisionTemplate.decisions.length : 0,
    v46ReviewPackFileCount: Array.isArray(v46Manifest.includedFiles) ? v46Manifest.includedFiles.length : 0,
    v47ArchiveReadyForOwnerReview: v47Health.archiveReadyForOwnerReview === true
  },
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safety: safetyBlock()
};

const workflowMd = [
  "# UAOS V48 Owner Review Workflow Pack",
  "",
  "Metadata-only owner review workflow. No real apply, no export approval, no USB write, and no PA3X load.",
  "",
  ...steps.map((item) => [
    `## ${item.stepId}: ${item.title}`,
    "",
    `Local path: ${item.localPath}`,
    `Owner action: ${item.ownerAction}`,
    `Expected output: ${item.expectedOutput}`,
    `Safety note: ${item.safetyNote}`
  ].join("\n\n"))
].join("\n\n");

const stepByStepMd = [
  "# UAOS V48 Owner Review Step By Step",
  "",
  ...steps.map((item, index) => `${index + 1}. ${item.title}\n   - Open: ${item.localPath}\n   - Action: ${item.ownerAction}\n   - Keep blocked: ${item.blockedActions.join(", ")}`)
].join("\n\n");

const reportMd = [
  "# UAOS V48 Owner Review Workflow Report",
  "",
  "Status: GENERATED",
  "",
  `Workflow steps: ${steps.length}`,
  `Decision map items: ${decisionMap.decisionItems.length}`,
  "Safety: metadata-only, review workflow only, no real apply, no source mutation, no export approval."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V48_OWNER_REVIEW_WORKFLOW_PACK.json"), JSON.stringify(workflowPack, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V48_OWNER_REVIEW_WORKFLOW_PACK.md"), workflowMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V48_OWNER_REVIEW_STEP_BY_STEP.md"), stepByStepMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V48_OWNER_REVIEW_DECISION_MAP.json"), JSON.stringify(decisionMap, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V48_OWNER_REVIEW_WORKFLOW_REPORT.md"), reportMd + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", steps: steps.length, output: "generated/UAOS_V48_OWNER_REVIEW_WORKFLOW_PACK.json" }, null, 2));
