import childProcess from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const resultPath = path.join(reportsDir, "UAOS_V46_VALIDATOR_RESULTS.json");

const paths = {
  preview: path.join(generatedDir, "UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.json"),
  previewMd: path.join(generatedDir, "UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.md"),
  diff: path.join(generatedDir, "UAOS_V46_PREVIEW_V3_DIFF_SUMMARY.json"),
  diffMd: path.join(generatedDir, "UAOS_V46_PREVIEW_V3_DIFF_SUMMARY.md"),
  dryrunProject: path.join(generatedDir, "UAOS_V46_DRYRUN_PROJECT_AFTER_IMPORT_PREVIEW_V3.uaosproject.json"),
  manifest: path.join(generatedDir, "UAOS_V46_LOCAL_REVIEW_PACK_MANIFEST.json"),
  hashes: path.join(generatedDir, "UAOS_V46_LOCAL_REVIEW_PACK_HASHES.json"),
  matrix: path.join(generatedDir, "UAOS_V46_NEXT_RECOMMENDATION_MATRIX.json"),
  zip: path.join(generatedDir, "UAOS_V46_LOCAL_REVIEW_PACK_METADATA_ONLY.zip")
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

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function listZipEntries(zipPath, errors) {
  if (!fs.existsSync(zipPath)) {
    errors.push(`Missing ZIP: ${rel(zipPath)}`);
    return [];
  }
  const buffer = fs.readFileSync(zipPath);
  const entries = [];
  for (let offset = 0; offset < buffer.length - 4;) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const name = buffer.toString("utf8", offset + 30, offset + 30 + nameLength);
    entries.push(name);
    offset += 30 + nameLength + extraLength + compressedSize;
  }
  if (!entries.length) errors.push("ZIP contains no readable local entries");
  return entries;
}

function expectFalse(doc, label, field, errors) {
  if (doc?.[field] !== false) errors.push(`${label}.${field} must be false`);
}

function expectTrue(doc, label, field, errors) {
  if (doc?.[field] !== true) errors.push(`${label}.${field} must be true`);
}

fs.mkdirSync(reportsDir, { recursive: true });
const errors = [];
const warnings = [];

const preview = readJson(paths.preview, errors);
const diff = readJson(paths.diff, errors);
const dryrunProject = readJson(paths.dryrunProject, errors);
const manifest = readJson(paths.manifest, errors);
const hashes = readJson(paths.hashes, errors);
readJson(paths.matrix, errors);

for (const filePath of [paths.previewMd, paths.diffMd]) {
  if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
}

for (const [label, doc] of Object.entries({ preview, diff, dryrunProject })) {
  expectTrue(doc, label, "dryRunOnly", errors);
  expectTrue(doc, label, "metadataOnly", errors);
  expectFalse(doc, label, "sourceProjectModified", errors);
  expectFalse(doc, label, "approvedForKorgExport", errors);
  expectFalse(doc, label, "approvedForUsb", errors);
  expectFalse(doc, label, "approvedForKeyboardLoad", errors);
}
for (const field of ["autoApplyEnabled", "realApplyAllowed", "korgOutputAllowed", "usbWriteAllowed", "keyboardLoadAllowed", "exportApprovalImpact"]) {
  expectFalse(preview, "preview", field, errors);
}
expectTrue(preview, "preview", "humanReviewRequired", errors);
expectTrue(dryrunProject, "dryrunProject", "previewArtifact", errors);
expectTrue(dryrunProject, "dryrunProject", "decisionsAppliedInPreviewOnly", errors);
expectFalse(dryrunProject, "dryrunProject", "compatibilityClaim", errors);
expectFalse(dryrunProject, "dryrunProject", "pa3xReadyClaim", errors);

if (!Array.isArray(preview?.appliedPreviewChanges) || preview.appliedPreviewChanges.length !== 0) errors.push("preview.appliedPreviewChanges must be empty");
if (preview?.acceptedDecisionCount !== 0) errors.push("preview.acceptedDecisionCount must be 0 while imported decisions are pending");
if (!Array.isArray(preview?.skippedPendingChanges) || preview.skippedPendingChanges.length < 1) warnings.push("No skipped pending changes listed");

if (manifest) {
  if (!Array.isArray(manifest.includedFiles) || manifest.includedFiles.length < 1) errors.push("Manifest must list included files");
  expectTrue(manifest, "manifest", "metadataOnly", errors);
  expectTrue(manifest, "manifest", "reviewPackOnly", errors);
  expectFalse(manifest, "manifest", "sourceProjectModified", errors);
  expectFalse(manifest, "manifest", "korgOutputAllowed", errors);
  expectFalse(manifest, "manifest", "usbWriteAllowed", errors);
  expectFalse(manifest, "manifest", "keyboardLoadAllowed", errors);
  expectFalse(manifest, "manifest", "approvedForExport", errors);
}
if (!hashes?.files?.length) errors.push("Hashes JSON must list files");

const zipEntries = listZipEntries(paths.zip, errors);
if (!zipEntries.some((entry) => entry.endsWith("START_HERE_UAOS_V46_REVIEW_PACK.md"))) errors.push("ZIP missing START_HERE file");
if (!zipEntries.some((entry) => entry.endsWith("SAFETY_LIMITS_DO_NOT_EXPORT.md"))) errors.push("ZIP missing SAFETY_LIMITS_DO_NOT_EXPORT.md");

const forbiddenZipExt = /\.(set|sty|prf|prs|kst|wav|aif|aiff|mp3|flac|ogg|kmp|ksf|pcg)$/i;
for (const entry of zipEntries) {
  const lower = entry.toLowerCase();
  if (forbiddenZipExt.test(lower)) errors.push(`Forbidden ZIP entry: ${entry}`);
  if (lower.endsWith("app.jsx")) errors.push(`ZIP contains App.jsx: ${entry}`);
  if (lower.includes("/deploy/") || lower.includes("/public/") || lower.includes("/dist/") || lower.includes("/build/")) {
    errors.push(`ZIP contains deploy/public output target: ${entry}`);
  }
  if (!/\.(md|json|html)$/i.test(entry)) errors.push(`ZIP contains non-review file type: ${entry}`);
}

const v46Files = walk(root);
for (const filePath of v46Files) {
  const lower = filePath.toLowerCase();
  if (lower.includes(`${path.sep}.set${path.sep}`) || lower.endsWith(".set")) errors.push(`Forbidden V46 SET folder/file: ${rel(filePath)}`);
  if (/\.(sty|prf|prs|kst)$/i.test(lower)) errors.push(`Forbidden V46 keyboard file: ${rel(filePath)}`);
  if (path.basename(lower) === "app.jsx") errors.push(`Forbidden V46 App.jsx: ${rel(filePath)}`);
  if (lower.includes(`${path.sep}deploy${path.sep}`) || lower.includes(`${path.sep}public${path.sep}`)) errors.push(`Forbidden V46 deploy/public path: ${rel(filePath)}`);
}

const gitChecks = [
  ["v37 source project", path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json")],
  ["v42 dry-run project", path.join(base, "v42", "generated", "UAOS_V42_DRYRUN_PROJECT_AFTER_PREVIEW.uaosproject.json")],
  ["v44 dry-run project", path.join(base, "v44", "generated", "UAOS_V44_DRYRUN_PROJECT_AFTER_DECISION_PREVIEW.uaosproject.json")],
  ["App.jsx", path.join(base, "..", "pc-workstation", "stable", "UAOS_PC_WORKSTATION_APP_V10", "App.jsx")]
];
for (const [label, filePath] of gitChecks) {
  const relative = path.relative(path.resolve(root, "..", "..", ".."), filePath).replace(/\\/g, "/");
  const check = childProcess.spawnSync("git", ["status", "--short", "--", relative], {
    cwd: path.resolve(root, "..", "..", ".."),
    encoding: "utf8"
  });
  if (check.stdout.trim()) errors.push(`${label} appears modified in git status`);
}

const status = errors.length ? "FAIL" : "PASS";
const result = {
  status,
  checkedAt: new Date().toISOString(),
  checkedFiles: Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, rel(value)])),
  zipEntries,
  errors,
  warnings,
  safety: {
    metadataOnly: true,
    dryRunOnly: true,
    localReviewPackOnly: true,
    noRealApply: true,
    noSourceProjectMutation: true,
    noAutoApply: true,
    noKorgOutput: true,
    noSetStylePerfPresetKst: true,
    noUsbWrite: true,
    noKeyboardLoad: true,
    noFixtureModification: true,
    noAppJs: true,
    noDeploy: true,
    noExportApproval: true
  }
};

fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");

if (status === "PASS") {
  fs.writeFileSync(path.join(reportsDir, "UAOS_V46_QA_REPORT.md"), [
    "# UAOS V46 QA Report",
    "",
    "Preview v3 created: YES",
    "Diff summary created: YES",
    "Dry-run preview project created: YES",
    "Local review pack folder created: YES",
    "Metadata-only ZIP created: YES",
    "Manifest and hashes created: YES",
    "Validator PASS: YES",
    "No real apply: YES",
    "No source project mutation: YES",
    "No auto-apply: YES",
    "No KORG output: YES",
    "No SET/STY/PRF/PRS/KST: YES",
    "No USB: YES",
    "No PA3X load: YES",
    "No fixture modification: YES",
    "No App.jsx: YES",
    "No deploy: YES"
  ].join("\n") + "\n", "utf8");
  fs.writeFileSync(path.join(reportsDir, "UAOS_V46_FINAL_SEAL.md"), [
    "# UAOS V46 Final Seal",
    "",
    "Status: PASS",
    "",
    "V46 created a decision import apply preview v3, diff summary, dry-run preview project, local metadata review pack ZIP, manifest, hashes, QA report, owner dashboard, and validator result.",
    "",
    "Safety: metadata-only, dry-run only, local review pack only, no real apply, no source project mutation, no auto-apply, no KORG output, no SET/STY/PRF/PRS/KST, no USB write, no keyboard load, no fixture modification, no App.jsx, no deploy, no export approval."
  ].join("\n") + "\n", "utf8");
}

console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
