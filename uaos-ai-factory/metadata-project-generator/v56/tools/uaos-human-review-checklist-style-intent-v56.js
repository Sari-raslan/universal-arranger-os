import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const createdAt = new Date().toISOString();
const intent = readJson(path.join(generatedDir, "UAOS_V56_STYLE_INTENT_REFINED_PREVIEW.json"));
const sections = readJson(path.join(generatedDir, "UAOS_V56_STYLE_SECTION_PLAN_REFINED_PREVIEW.json"));
const categories = [
  "musicalIntent",
  "sectionStructure",
  "rhythmDensity",
  "bassMovement",
  "chordRhythm",
  "orientalFeel",
  "melodySpace",
  "dspIntent",
  "arrangerUsability",
  "safetyGate"
];
const questions = {
  musicalIntent: `Does the refined intent match ${intent.styleFamily} at ${intent.tempo} BPM?`,
  sectionStructure: `Do the ${sections.length} planned sections make musical sense for owner review?`,
  rhythmDensity: "Is the rhythm density appropriate across intro, variations, fill, and ending?",
  bassMovement: "Is the bass movement supportive without crowding the arrangement?",
  chordRhythm: "Is the chord rhythm clear enough for arranger usability?",
  orientalFeel: "Does the oriental feel read correctly as metadata intent without a compatibility claim?",
  melodySpace: "Is there enough room for live melody and expression?",
  dspIntent: "Are the DSP intentions clear as metadata-only mix guidance?",
  arrangerUsability: "Would a human arranger understand the intent before any future implementation?",
  safetyGate: "Do all safety gates remain closed for export, USB, PA3X load, and KORG output?"
};
const checklistItems = categories.map((category, index) => ({
  itemId: `v56-review-${String(index + 1).padStart(2, "0")}`,
  category,
  question: questions[category],
  expectedOwnerReview: "Owner must manually review and choose a decision before any future phase can treat this as accepted.",
  decisionOptions: ["approve_metadata_intent", "request_revision", "reject", "defer"],
  selectedDecision: "pending",
  ownerNote: "",
  blocksExport: true,
  metadataOnly: true,
  autoApplyAllowed: false,
  korgOutputAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false
}));

const checklist = {
  schemaVersion: "uaos.v56.human.review.checklist.style.intent.v1",
  createdAt,
  metadataOnly: true,
  humanReviewOnly: true,
  sourceFiles: {
    refinedStyleIntentPreview: "generated/UAOS_V56_STYLE_INTENT_REFINED_PREVIEW.json",
    refinedSectionPlanPreview: "generated/UAOS_V56_STYLE_SECTION_PLAN_REFINED_PREVIEW.json"
  },
  checklistItems,
  completion: {
    totalItems: checklistItems.length,
    pendingItems: checklistItems.length,
    completedItems: 0,
    humanReviewCompleted: false,
    blocksExport: true
  },
  safety: {
    audioRenderAllowed: false,
    midiGenerationAllowed: false,
    korgOutputAllowed: false,
    exportAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    autoApplyAllowed: false
  }
};

const checklistMd = [
  "# UAOS V56 Human Review Checklist - Style Intent",
  "",
  "This is human review only.",
  "It does not generate audio.",
  "It does not generate MIDI.",
  "It does not generate KORG output.",
  "It does not approve USB.",
  "It does not approve PA3X load.",
  "",
  ...checklistItems.map((item) => `- [ ] ${item.itemId} ${item.category}: ${item.question} Decision: pending`)
].join("\n");

const decisionForm = [
  "# UAOS V56 Human Review Owner Decision Form",
  "",
  "This is human review only.",
  "It does not generate audio.",
  "It does not generate MIDI.",
  "It does not generate KORG output.",
  "It does not approve USB.",
  "It does not approve PA3X load.",
  "",
  "Allowed decisions for each item: approve_metadata_intent, request_revision, reject, defer.",
  "",
  ...checklistItems.map((item) => `## ${item.itemId} ${item.category}\nQuestion: ${item.question}\nSelected decision: pending\nOwner note:\n`)
].join("\n");

const report = [
  "# UAOS V56 Human Review Checklist Report",
  "",
  "Status: GENERATED",
  `Checklist items: ${checklistItems.length}`,
  "All decisions pending: YES",
  "Auto-apply allowed: NO",
  "KORG output allowed: NO",
  "USB write allowed: NO",
  "Keyboard load allowed: NO"
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V56_HUMAN_REVIEW_CHECKLIST_STYLE_INTENT.json"), JSON.stringify(checklist, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V56_HUMAN_REVIEW_CHECKLIST_STYLE_INTENT.md"), checklistMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V56_HUMAN_REVIEW_OWNER_DECISION_FORM.md"), decisionForm + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V56_HUMAN_REVIEW_CHECKLIST_REPORT.md"), report + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V56_HUMAN_REVIEW_CHECKLIST_STYLE_INTENT.json" }, null, 2));
