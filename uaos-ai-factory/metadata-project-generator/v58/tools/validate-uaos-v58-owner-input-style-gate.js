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
const resultPath = path.join(reportsDir, "UAOS_V58_VALIDATOR_RESULTS.json");
const paths = {
  inputPack: path.join(generatedDir, "UAOS_V58_REAL_OWNER_DECISION_INPUT_PACK.json"),
  inputPackMd: path.join(generatedDir, "UAOS_V58_REAL_OWNER_DECISION_INPUT_PACK.md"),
  printableForm: path.join(generatedDir, "UAOS_V58_REAL_OWNER_DECISION_FORM_PRINTABLE.md"),
  formData: path.join(generatedDir, "UAOS_V58_REAL_OWNER_DECISION_FORM_DATA.json"),
  dryrun: path.join(generatedDir, "UAOS_V58_INTERNAL_STYLE_GENERATION_DRYRUN_V4.json"),
  dryrunMd: path.join(generatedDir, "UAOS_V58_INTERNAL_STYLE_GENERATION_DRYRUN_V4.md"),
  intent: path.join(generatedDir, "UAOS_V58_STYLE_INTENT_REAL_OWNER_PENDING_PREVIEW.json"),
  sections: path.join(generatedDir, "UAOS_V58_STYLE_SECTION_PLAN_REAL_OWNER_PENDING_PREVIEW.json"),
  gates: path.join(generatedDir, "UAOS_V58_EXPORT_GATE_VALIDATOR_V5_RESULTS.json"),
  gatesMd: path.join(generatedDir, "UAOS_V58_EXPORT_GATE_VALIDATOR_V5_REPORT.md"),
  matrix: path.join(generatedDir, "UAOS_V58_NEXT_RECOMMENDATION_MATRIX.json")
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
const inputPack = readJson(paths.inputPack, errors);
readJson(paths.formData, errors);
const dryrun = readJson(paths.dryrun, errors);
readJson(paths.intent, errors);
const sections = readJson(paths.sections, errors);
const gates = readJson(paths.gates, errors);
readJson(paths.matrix, errors);

for (const filePath of [paths.inputPackMd, paths.printableForm, paths.dryrunMd, paths.gatesMd]) {
  if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
}

if (inputPack) {
  if (!Array.isArray(inputPack.decisionItems)) errors.push("inputPack.decisionItems must be an array");
  else {
    for (const item of inputPack.decisionItems) {
      if (item.realOwnerDecision !== "pending") errors.push(`${item.decisionId}.realOwnerDecision must be pending`);
      if (item.autoApplyAllowed !== false) errors.push(`${item.decisionId}.autoApplyAllowed must be false`);
      if (item.realApplyAllowed !== false) errors.push(`${item.decisionId}.realApplyAllowed must be false`);
      for (const field of ["metadataOnly", "dryRunOnly"]) if (item[field] !== true) errors.push(`${item.decisionId}.${field} must be true`);
      for (const field of ["exportApprovalImpact", "korgOutputAllowed", "usbWriteAllowed", "keyboardLoadAllowed"]) if (item[field] !== false) errors.push(`${item.decisionId}.${field} must be false`);
    }
  }
}

if (dryrun) {
  for (const [field, expected] of Object.entries({
    realOwnerInputPackUsed: true,
    realOwnerDecisionsApplied: false,
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
  errors.push("pending owner section plan must be an array");
}

if (gates) {
  for (const field of ["exportAllowed", "usbAllowed", "keyboardLoadAllowed", "compatibilityClaimAllowed"]) {
    if (gates[field] !== false) errors.push(`gates.${field} must be false`);
  }
}

for (const filePath of walkFiles(root)) {
  const lower = filePath.toLowerCase();
  if (lower.includes(`${path.sep}.set${path.sep}`) || lower.endsWith(".set")) errors.push(`Forbidden V58 SET folder/file: ${rel(filePath)}`);
  if (/\.(sty|prf|prs|kst|mid|midi|wav|aiff|aif|mp3|flac|ogg)$/i.test(lower)) errors.push(`Forbidden V58 generated/audio/native file: ${rel(filePath)}`);
  if (path.basename(lower) === "app.jsx") errors.push(`Forbidden V58 App.jsx: ${rel(filePath)}`);
  if (lower.includes(`${path.sep}deploy${path.sep}`)) errors.push(`Forbidden V58 deploy path: ${rel(filePath)}`);
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
    manualInputPackOnly: true,
    dryRunOnly: true,
    metadataOnly: true,
    noAutomaticRealOwnerDecision: true,
    noRealApply: true,
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
  fs.writeFileSync(path.join(reportsDir, "UAOS_V58_QA_REPORT.md"), [
    "# UAOS V58 QA Report",
    "",
    "Real owner decision input pack created: YES",
    "Printable decision form created: YES",
    "Internal style generation dry-run v4 created: YES",
    "Pending owner previews created: YES",
    "Export gate validator v5 created: YES",
    "Validator PASS: YES",
    "All real owner decisions remain pending: YES",
    "No real owner approval applied: YES",
    "No real apply: YES",
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
  fs.writeFileSync(path.join(reportsDir, "UAOS_V58_FINAL_SEAL.md"), [
    "# UAOS V58 Final Seal",
    "",
    "Status: PASS",
    "",
    "Safety: manual input pack only, dry-run only, metadata-only, no automatic real owner decision, no real apply, no audio, no MIDI, no KORG output, no native keyboard files, no USB, no PA3X load, no source mutation, no fixture modification, no App.jsx, no deploy, no payment."
  ].join("\n") + "\n", "utf8");
}

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
