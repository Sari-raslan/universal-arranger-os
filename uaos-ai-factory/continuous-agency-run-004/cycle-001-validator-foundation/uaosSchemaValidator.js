import fs from "fs";
import path from "path";

function readJson(filePath) {
  const absolutePath = path.resolve(filePath);
  const raw = fs.readFileSync(absolutePath, "utf8");
  return JSON.parse(raw);
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function hasKeys(value, keys, label, errors) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`, errors);
  if (!value || typeof value !== "object") return;
  for (const key of keys) {
    assert(Object.prototype.hasOwnProperty.call(value, key), `${label} missing key: ${key}`, errors);
  }
}

function validateArray(value, label, errors) {
  assert(Array.isArray(value), `${label} must be an array`, errors);
  assert(Array.isArray(value) && value.length > 0, `${label} must not be empty`, errors);
}

function validateNoRestrictedOutputs(text, label, errors) {
  const restricted = [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"];
  for (const ext of restricted) {
    assert(!text.includes(`\"${ext}\"`) || text.includes("restrictedOutputs"), `${label} references restricted output ${ext} outside a restriction list`, errors);
  }
}

function validateModuleBoundaryMap(data, errors) {
  hasKeys(data, ["run", "status", "modules", "restrictedOutputs", "safety"], "module boundary map", errors);
  validateArray(data.modules, "modules", errors);
  for (const mod of data.modules || []) {
    hasKeys(mod, ["name", "owns", "inputs", "outputs", "appJsRequired"], `module ${mod && mod.name ? mod.name : "unknown"}`, errors);
  }
  assert(data.safety && data.safety.appJsTouched === false, "module map must confirm App.jsx untouched", errors);
}

function validateLibraryFactorySchema(data, errors) {
  hasKeys(data, ["run", "schemaName", "status", "library", "instrumentCategories", "instrumentMetadata", "articulationSchema", "forbidden"], "library factory schema", errors);
  validateArray(data.instrumentCategories, "instrumentCategories", errors);
  assert(data.library && Array.isArray(data.library.qualityTiers), "library quality tiers must be present", errors);
  assert(data.forbidden && data.forbidden.proprietarySampleCopying === true, "proprietary sample copying must be forbidden", errors);
}

function validateOrientalStringsMap(data, errors) {
  hasKeys(data, ["run", "status", "family", "articulations", "quarterToneMetadata", "restrictedOutputCreated"], "oriental strings map", errors);
  validateArray(data.articulations, "oriental strings articulations", errors);
  assert(data.quarterToneMetadata && data.quarterToneMetadata.type === "metadata-only", "quarter-tone data must be metadata-only", errors);
  assert(data.restrictedOutputCreated === false, "restricted output must not be created", errors);
}

function validateArrangerSchema(data, errors) {
  hasKeys(data, ["run", "schemaName", "status", "input", "arrangementPlan", "outputs"], "arranger intelligence schema", errors);
  validateArray(data.arrangementPlan && data.arrangementPlan.sections, "arranger sections", errors);
  assert(data.outputs && data.outputs.restrictedHardwareNativeOutput === false, "arranger schema must block restricted hardware-native output", errors);
}

function validateTestCases(data, errors) {
  hasKeys(data, ["run", "status", "testCases"], "test case pack", errors);
  validateArray(data.testCases, "testCases", errors);
  for (const testCase of data.testCases || []) {
    hasKeys(testCase, ["id", "songIdea", "tempoBpm", "timeSignature", "maqamHint", "expectedSections"], `test case ${testCase && testCase.id ? testCase.id : "unknown"}`, errors);
  }
}

function validateMonitorModel(data, errors) {
  hasKeys(data, ["run", "schemaName", "status", "fields", "outputPolicy"], "monitor data model", errors);
  assert(data.outputPolicy && data.outputPolicy.deployAttempted === false, "monitor model must confirm no deploy", errors);
  assert(data.outputPolicy && data.outputPolicy.vercelUsed === false, "monitor model must confirm no Vercel", errors);
}

function validateDemoMidiSpec(data, errors) {
  hasKeys(data, ["run", "status", "purpose", "demoSpec", "filesCreated"], "demo MIDI spec", errors);
  assert(data.status === "SPEC_ONLY", "demo MIDI spec must remain spec-only", errors);
  assert(data.filesCreated && data.filesCreated.midi === false, "demo MIDI spec must not create MIDI files", errors);
  assert(data.filesCreated && data.filesCreated.restrictedHardwareNative === false, "demo MIDI spec must not create restricted hardware-native output", errors);
}

function validateSafeNextItems(data, errors) {
  hasKeys(data, ["run", "status", "items"], "safe next implementation items", errors);
  validateArray(data.items, "safe next items", errors);
  for (const item of data.items || []) {
    assert(item.requiresAppJs === false, `safe item ${item.id || "unknown"} must not require App.jsx`, errors);
  }
}

function validateKnownRun003File(filePath, type) {
  const errors = [];
  const data = readJson(filePath);
  const text = JSON.stringify(data);
  validateNoRestrictedOutputs(text, filePath, errors);
  if (type === "moduleBoundary") validateModuleBoundaryMap(data, errors);
  if (type === "libraryFactory") validateLibraryFactorySchema(data, errors);
  if (type === "orientalStrings") validateOrientalStringsMap(data, errors);
  if (type === "arrangerSchema") validateArrangerSchema(data, errors);
  if (type === "testCases") validateTestCases(data, errors);
  if (type === "monitorModel") validateMonitorModel(data, errors);
  if (type === "demoMidiSpec") validateDemoMidiSpec(data, errors);
  if (type === "safeNextItems") validateSafeNextItems(data, errors);
  return {
    file: filePath,
    type,
    status: errors.length === 0 ? "PASS" : "FAIL",
    errors
  };
}

export {
  readJson,
  validateKnownRun003File
};
