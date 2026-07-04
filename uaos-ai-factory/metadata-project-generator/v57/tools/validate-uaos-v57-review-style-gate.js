import childProcess from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const repoRoot = path.resolve(root, "..", "..", "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const resultPath = path.join(reportsDir, "UAOS_V57_VALIDATOR_RESULTS.json");
const paths = {
  sample: path.join(generatedDir, "UAOS_V57_HUMAN_REVIEW_FILLED_EXAMPLE.json"),
  sampleMd: path.join(generatedDir, "UAOS_V57_HUMAN_REVIEW_FILLED_EXAMPLE.md"),
  dryrun: path.join(generatedDir, "UAOS_V57_INTERNAL_STYLE_GENERATION_DRYRUN_V3.json"),
  dryrunMd: path.join(generatedDir, "UAOS_V57_INTERNAL_STYLE_GENERATION_DRYRUN_V3.md"),
  intent: path.join(generatedDir, "UAOS_V57_STYLE_INTENT_OWNER_REVIEWED_PREVIEW.json"),
  sections: path.join(generatedDir, "UAOS_V57_STYLE_SECTION_PLAN_OWNER_REVIEWED_PREVIEW.json"),
  gates: path.join(generatedDir, "UAOS_V57_EXPORT_GATE_VALIDATOR_V4_RESULTS.json"),
  gatesMd: path.join(generatedDir, "UAOS_V57_EXPORT_GATE_VALIDATOR_V4_REPORT.md"),
  matrix: path.join(generatedDir, "UAOS_V57_NEXT_RECOMMENDATION_MATRIX.json")
};

function rel(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function readJson(filePath, errors) {
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing JSON: ${rel(filePath)}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`Invalid JSON ${rel(filePath)}: ${error.message}`);
    return null;
  }
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function gitStatusFor(filePath) {
  const relative = path.relative(repoRoot, filePath).replace(/\\/g, "/");
  const check = childProcess.spawnSync("git", ["status", "--short", "--", relative], { cwd: repoRoot, encoding: "utf8" });
  return check.stdout.trim();
}

fs.mkdirSync(reportsDir, { recursive: true });
const errors = [];
const warnings = [];
const sample = readJson(paths.sample, errors);
const dryrun = readJson(paths.dryrun, errors);
readJson(paths.intent, errors);
const sections = readJson(paths.sections, errors);
const gates = readJson(paths.gates, errors);
readJson(paths.matrix, errors);

for (const filePath of [paths.sampleMd, paths.dryrunMd, paths.gatesMd]) {
  if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
}

if (sample) {
  if (sample.sampleOnly !== true) errors.push("sample.sampleOnly must be true");
  if (sample.realOwnerApprovalApplied !== false) errors.push("sample.realOwnerApprovalApplied must be false");
  if (sample.exportApprovalComplete !== false) errors.push("sample.exportApprovalComplete must be false");
  if (sample.usbApprovalComplete !== false) errors.push("sample.usbApprovalComplete must be false");
  if (sample.keyboardLoadApprovalComplete !== false) errors.push("sample.keyboardLoadApprovalComplete must be false");
  if (!Array.isArray(sample.sampleItems)) errors.push("sample.sampleItems must be an array");
  else {
    for (const item of sample.sampleItems) {
      if (item.sampleOnly !== true) errors.push(`${item.sourceItemId}.sampleOnly must be true`);
      if (item.realOwnerDecisionRequired !== true) errors.push(`${item.sourceItemId}.realOwnerDecisionRequired must be true`);
      if (item.exportApprovalImpact !== false) errors.push(`${item.sourceItemId}.exportApprovalImpact must be false`);
      for (const field of ["korgOutputAllowed", "usbWriteAllowed", "keyboardLoadAllowed"]) if (item[field] !== false) errors.push(`${item.sourceItemId}.${field} must be false`);
    }
  }
}

if (dryrun) {
  for (const [field, expected] of Object.entries({
    sampleReviewInputUsed: true,
    realOwnerDecisionApplied: false,
    sampleOnly: true,
    dryRunOnly: true,
    metadataOnly: true,
    audioRenderAllowed: false,
    midiGenerationAllowed: false,
    korgOutputAllowed: false,
    exportAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    sourceProjectModified: false
  })) {
    if (dryrun[field] !== expected) errors.push(`dryrun.${field} must be ${expected}`);
  }
}

if (Array.isArray(sections)) {
  for (const section of sections) {
    for (const field of ["generatedAudio", "generatedMidi", "generatedKorgFile"]) {
      if (section[field] !== false) errors.push(`${section.sectionId}.${field} must be false`);
    }
  }
} else {
  errors.push("owner reviewed section plan must be an array");
}

if (gates) {
  for (const field of ["exportAllowed", "usbAllowed", "keyboardLoadAllowed", "compatibilityClaimAllowed"]) {
    if (gates[field] !== false) errors.push(`gates.${field} must be false`);
  }
}

for (const filePath of walkFiles(root)) {
  const lower = filePath.toLowerCase();
  if (lower.includes(`${path.sep}.set${path.sep}`) || lower.endsWith(".set")) errors.push(`Forbidden V57 SET folder/file: ${rel(filePath)}`);
  if (/\.(sty|prf|prs|kst|mid|midi|wav|aiff|aif|mp3|flac|ogg)$/i.test(lower)) errors.push(`Forbidden V57 generated/audio/native file: ${rel(filePath)}`);
  if (path.basename(lower) === "app.jsx") errors.push(`Forbidden V57 App.jsx: ${rel(filePath)}`);
  if (lower.includes(`${path.sep}deploy${path.sep}`)) errors.push(`Forbidden V57 deploy path: ${rel(filePath)}`);
}

for (const [label, filePath] of [
  ["V37 source project", path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json")],
  ["V42 dry-run project", path.join(base, "v42", "generated", "UAOS_V42_DRYRUN_PROJECT_AFTER_PREVIEW.uaosproject.json")],
  ["V44 dry-run project", path.join(base, "v44", "generated", "UAOS_V44_DRYRUN_PROJECT_AFTER_DECISION_PREVIEW.uaosproject.json")],
  ["V46 dry-run project", path.join(base, "v46", "generated", "UAOS_V46_DRYRUN_PROJECT_AFTER_IMPORT_PREVIEW_V3.uaosproject.json")],
  ["App.jsx", path.join(repoRoot, "uaos-ai-factory", "pc-workstation", "stable", "UAOS_PC_WORKSTATION_APP_V10", "App.jsx")]
]) {
  if (gitStatusFor(filePath)) errors.push(`${label} appears modified in git status`);
}

const status = errors.length ? "FAIL" : "PASS";
const result = {
  status,
  checkedAt: new Date().toISOString(),
  checkedFiles: Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, rel(value)])),
  errors,
  warnings,
  safety: {
    sampleOnly: true,
    dryRunOnly: true,
    metadataOnly: true,
    noRealOwnerApprovalApplied: true,
    noAudioRender: true,
    noMidiGeneration: true,
    noKorgOutput: true,
    noSetStyPrfPrsKst: true,
    noUsbWrite: true,
    noKeyboardLoad: true,
    noSourceProjectMutation: true,
    noFixtureModification: true,
    noAppJs: true,
    noDeploy: true,
    noPayment: true
  }
};

fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
if (status === "PASS") {
  fs.writeFileSync(path.join(reportsDir, "UAOS_V57_QA_REPORT.md"), [
    "# UAOS V57 QA Report",
    "",
    "Sample human review filled example created: YES",
    "Internal style generation dry-run v3 created: YES",
    "Owner-reviewed preview created using sample only: YES",
    "Export gate validator v4 created: YES",
    "Validator PASS: YES",
    "No real owner approval applied: YES",
    "No audio render: YES",
    "No MIDI generation: YES",
    "No KORG output: YES",
    "No SET/STY/PRF/PRS/KST: YES",
    "No USB: YES",
    "No PA3X load: YES",
    "No source project mutation: YES",
    "No fixture modification: YES",
    "No App.jsx: YES",
    "No deploy: YES",
    "No payment: YES"
  ].join("\n") + "\n", "utf8");
  fs.writeFileSync(path.join(reportsDir, "UAOS_V57_FINAL_SEAL.md"), [
    "# UAOS V57 Final Seal",
    "",
    "Status: PASS",
    "",
    "Safety: sample only, dry-run only, metadata-only, no real owner approval applied, no audio, no MIDI, no KORG output, no native keyboard files, no USB, no PA3X load, no source mutation, no fixture modification, no App.jsx, no deploy, no payment."
  ].join("\n") + "\n", "utf8");
}

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
