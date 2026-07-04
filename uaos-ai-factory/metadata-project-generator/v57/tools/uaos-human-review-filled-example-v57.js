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

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const createdAt = new Date().toISOString();
const checklist = readJson(path.join(base, "v56", "generated", "UAOS_V56_HUMAN_REVIEW_CHECKLIST_STYLE_INTENT.json"));
const ownerDecisionForm = fs.readFileSync(path.join(base, "v56", "generated", "UAOS_V56_HUMAN_REVIEW_OWNER_DECISION_FORM.md"), "utf8");
const lowRisk = new Set(["musicalIntent", "sectionStructure", "melodySpace", "dspIntent"]);
const revisionRisk = new Set(["rhythmDensity", "bassMovement", "chordRhythm", "orientalFeel", "arrangerUsability"]);

function sampleDecisionFor(category) {
  if (lowRisk.has(category)) return "approve_metadata_intent";
  if (revisionRisk.has(category)) return "request_revision";
  return "defer";
}

const sampleItems = checklist.checklistItems.map((item) => {
  const sampleDecision = sampleDecisionFor(item.category);
  const noteByDecision = {
    approve_metadata_intent: "Sample note: metadata intent is clear enough for dry-run preview only.",
    request_revision: "Sample note: clarify this area before any real owner decision or implementation.",
    defer: "Sample note: export, USB, keyboard load, and safety approvals remain deferred and blocked."
  };
  return {
    sourceItemId: item.itemId,
    category: item.category,
    sampleDecision,
    sampleOwnerNote: noteByDecision[sampleDecision],
    realOwnerDecisionRequired: true,
    metadataOnly: true,
    dryRunOnly: true,
    sampleOnly: true,
    exportApprovalImpact: false,
    korgOutputAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false
  };
});

const sample = {
  schemaVersion: "uaos.v57.human.review.filled.example.v1",
  createdAt,
  sampleOnly: true,
  dryRunOnly: true,
  metadataOnly: true,
  humanReviewExampleOnly: true,
  realOwnerApprovalApplied: false,
  exportApprovalComplete: false,
  usbApprovalComplete: false,
  keyboardLoadApprovalComplete: false,
  sourceFiles: {
    checklist: "v56/generated/UAOS_V56_HUMAN_REVIEW_CHECKLIST_STYLE_INTENT.json",
    ownerDecisionForm: "v56/generated/UAOS_V56_HUMAN_REVIEW_OWNER_DECISION_FORM.md"
  },
  sourceOwnerDecisionFormDigest: {
    characterCount: ownerDecisionForm.length,
    containsHumanReviewOnlyWarning: ownerDecisionForm.includes("This is human review only.")
  },
  sampleItems,
  summary: {
    approveMetadataIntentCount: sampleItems.filter((item) => item.sampleDecision === "approve_metadata_intent").length,
    requestRevisionCount: sampleItems.filter((item) => item.sampleDecision === "request_revision").length,
    deferCount: sampleItems.filter((item) => item.sampleDecision === "defer").length,
    realOwnerDecisionRequired: true,
    exportRemainsBlocked: true
  },
  safety: {
    sampleOnly: true,
    notRealOwnerApproval: true,
    doesNotApproveExport: true,
    doesNotApproveUsb: true,
    doesNotApprovePa3xLoad: true,
    audioRenderAllowed: false,
    midiGenerationAllowed: false,
    korgOutputAllowed: false,
    exportAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    sourceProjectModified: false,
    autoApplyAllowed: false
  }
};

const md = [
  "# UAOS V57 Human Review Filled Example",
  "",
  "SAMPLE ONLY.",
  "NOT REAL OWNER APPROVAL.",
  "DOES NOT APPROVE EXPORT.",
  "DOES NOT APPROVE USB.",
  "DOES NOT APPROVE PA3X LOAD.",
  "",
  `Sample items: ${sampleItems.length}`,
  `Approve metadata intent samples: ${sample.summary.approveMetadataIntentCount}`,
  `Request revision samples: ${sample.summary.requestRevisionCount}`,
  `Deferred samples: ${sample.summary.deferCount}`,
  "",
  ...sampleItems.map((item) => `- ${item.sourceItemId} ${item.category}: ${item.sampleDecision} - ${item.sampleOwnerNote}`)
].join("\n");

const report = [
  "# UAOS V57 Human Review Filled Example Report",
  "",
  "Status: GENERATED",
  "Sample only: YES",
  "Not real owner approval: YES",
  "Does not approve export: YES",
  "Does not approve USB: YES",
  "Does not approve PA3X load: YES"
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V57_HUMAN_REVIEW_FILLED_EXAMPLE.json"), JSON.stringify(sample, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V57_HUMAN_REVIEW_FILLED_EXAMPLE.md"), md + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V57_HUMAN_REVIEW_FILLED_EXAMPLE_REPORT.md"), report + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V57_HUMAN_REVIEW_FILLED_EXAMPLE.json" }, null, 2));
