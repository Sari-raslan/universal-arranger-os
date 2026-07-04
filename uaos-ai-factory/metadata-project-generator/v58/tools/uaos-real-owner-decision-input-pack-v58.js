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
const sample = readJson(path.join(base, "v57", "generated", "UAOS_V57_HUMAN_REVIEW_FILLED_EXAMPLE.json"));
const dryrunV3 = readJson(path.join(base, "v57", "generated", "UAOS_V57_INTERNAL_STYLE_GENERATION_DRYRUN_V3.json"));
const sampleBySource = new Map(sample.sampleItems.map((item) => [item.sourceItemId, item]));

const decisionItems = checklist.checklistItems.map((item, index) => {
  const sampleReference = sampleBySource.get(item.itemId) || null;
  return {
    decisionId: `v58-owner-decision-${String(index + 1).padStart(2, "0")}`,
    sourceChecklistItemId: item.itemId,
    category: item.category,
    question: item.question,
    sampleReferenceFromV57: sampleReference ? {
      sampleDecision: sampleReference.sampleDecision,
      sampleOwnerNote: sampleReference.sampleOwnerNote,
      sampleOnly: true,
      notRealApproval: true
    } : null,
    realOwnerDecision: "pending",
    allowedDecisions: ["approve_metadata_intent", "request_revision", "reject", "defer"],
    ownerNote: "",
    ownerSignatureRequiredForFinal: true,
    metadataOnly: true,
    dryRunOnly: true,
    autoApplyAllowed: false,
    realApplyAllowed: false,
    exportApprovalImpact: false,
    korgOutputAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false
  };
});

const pack = {
  schemaVersion: "uaos.v58.real.owner.decision.input.pack.v1",
  createdAt,
  manualInputPackOnly: true,
  metadataOnly: true,
  dryRunOnly: true,
  noDecisionAutoFilled: true,
  sampleV57IsNotRealApproval: true,
  noExportApproval: true,
  noUsbApproval: true,
  noPa3xLoadApproval: true,
  sourceFiles: {
    v56Checklist: "v56/generated/UAOS_V56_HUMAN_REVIEW_CHECKLIST_STYLE_INTENT.json",
    v57Sample: "v57/generated/UAOS_V57_HUMAN_REVIEW_FILLED_EXAMPLE.json",
    v57DryrunV3: "v57/generated/UAOS_V57_INTERNAL_STYLE_GENERATION_DRYRUN_V3.json"
  },
  sourceDryRunId: dryrunV3.dryRunId,
  decisionItems,
  summary: {
    totalDecisionItems: decisionItems.length,
    pendingDecisionCount: decisionItems.length,
    completedRealOwnerDecisionCount: 0,
    realOwnerDecisionsApplied: false,
    exportRemainsBlocked: true
  },
  safety: {
    metadataOnly: true,
    dryRunOnly: true,
    autoApplyAllowed: false,
    realApplyAllowed: false,
    audioRenderAllowed: false,
    midiGenerationAllowed: false,
    korgOutputAllowed: false,
    exportAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    sourceProjectModified: false,
    compatibilityClaimAllowed: false,
    pa3xReadyClaimAllowed: false
  }
};

const formData = {
  schemaVersion: "uaos.v58.real.owner.decision.form.data.v1",
  createdAt,
  metadataOnly: true,
  manualInputOnly: true,
  decisions: decisionItems.map((item) => ({
    decisionId: item.decisionId,
    sourceChecklistItemId: item.sourceChecklistItemId,
    category: item.category,
    question: item.question,
    realOwnerDecision: "pending",
    ownerNote: "",
    ownerSignature: "",
    ownerDecisionDate: "",
    allowedDecisions: item.allowedDecisions,
    exportApprovalImpact: false
  })),
  exportApproval: false,
  usbApproval: false,
  pa3xLoadApproval: false
};

const md = [
  "# UAOS V58 Real Owner Decision Input Pack",
  "",
  "THIS IS FOR REAL OWNER MANUAL INPUT.",
  "NO DECISION IS AUTO-FILLED.",
  "SAMPLE V57 IS NOT REAL APPROVAL.",
  "NO EXPORT APPROVAL.",
  "NO USB APPROVAL.",
  "NO PA3X LOAD APPROVAL.",
  "",
  `Decision items: ${decisionItems.length}`,
  "All real owner decisions: pending",
  "",
  ...decisionItems.map((item) => `- ${item.decisionId} ${item.category}: ${item.question} Real owner decision: pending`)
].join("\n");

const printable = [
  "# UAOS V58 Real Owner Decision Form - Printable",
  "",
  "THIS FORM IS FOR MANUAL OWNER INPUT ONLY.",
  "It does not approve export.",
  "It does not approve USB.",
  "It does not approve PA3X load.",
  "It does not generate audio, MIDI, or KORG output.",
  "",
  ...decisionItems.map((item) => [
    `## ${item.decisionId} ${item.category}`,
    `Source checklist item: ${item.sourceChecklistItemId}`,
    `Question: ${item.question}`,
    `V57 sample reference: ${item.sampleReferenceFromV57?.sampleDecision || "none"} (sample only, not real approval)`,
    "Owner decision (approve_metadata_intent / request_revision / reject / defer):",
    "Owner notes:",
    "Owner date:",
    "Owner signature:",
    ""
  ].join("\n")),
  "## Final owner signature area",
  "Owner name:",
  "Date:",
  "Signature:",
  "Export approval: NO",
  "USB approval: NO",
  "PA3X load approval: NO"
].join("\n");

const report = [
  "# UAOS V58 Real Owner Decision Input Pack Report",
  "",
  "Status: GENERATED",
  "Manual input pack only: YES",
  "No decision auto-filled: YES",
  "All real owner decisions pending: YES",
  "Sample V57 is not real approval: YES",
  "No export approval: YES",
  "No USB approval: YES",
  "No PA3X load approval: YES"
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V58_REAL_OWNER_DECISION_INPUT_PACK.json"), JSON.stringify(pack, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V58_REAL_OWNER_DECISION_INPUT_PACK.md"), md + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V58_REAL_OWNER_DECISION_FORM_PRINTABLE.md"), printable + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V58_REAL_OWNER_DECISION_FORM_DATA.json"), JSON.stringify(formData, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V58_REAL_OWNER_DECISION_INPUT_PACK_REPORT.md"), report + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V58_REAL_OWNER_DECISION_INPUT_PACK.json" }, null, 2));
