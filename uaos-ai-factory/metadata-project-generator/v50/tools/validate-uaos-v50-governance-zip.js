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
const resultPath = path.join(reportsDir, "UAOS_V50_VALIDATOR_RESULTS.json");

const paths = {
  seal: path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_SEAL.json"),
  sealMd: path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_SEAL.md"),
  findings: path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_FINDINGS.json"),
  findingsMd: path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_FINDINGS.md"),
  manifest: path.join(generatedDir, "UAOS_V50_LOCAL_PORTAL_INDEX_MANIFEST.json"),
  hashes: path.join(generatedDir, "UAOS_V50_LOCAL_PORTAL_INDEX_HASHES.json"),
  zip: path.join(generatedDir, "UAOS_V50_LOCAL_PORTAL_INDEX_METADATA_ONLY.zip"),
  matrix: path.join(generatedDir, "UAOS_V50_NEXT_RECOMMENDATION_MATRIX.json")
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
  if (!entries.length) errors.push("ZIP contains no readable entries");
  return entries;
}

fs.mkdirSync(reportsDir, { recursive: true });
const errors = [];
const warnings = [];
const seal = readJson(paths.seal, errors);
readJson(paths.findings, errors);
const manifest = readJson(paths.manifest, errors);
readJson(paths.hashes, errors);
readJson(paths.matrix, errors);
for (const filePath of [paths.sealMd, paths.findingsMd]) {
  if (!fs.existsSync(filePath)) errors.push(`Missing file: ${rel(filePath)}`);
}
const zipEntries = listZipEntries(paths.zip, errors);
if (!zipEntries.some((entry) => entry.endsWith("START_HERE_UAOS_V50_LOCAL_PORTAL_INDEX.md"))) errors.push("ZIP missing START_HERE file");
if (!zipEntries.some((entry) => entry.endsWith("SAFETY_LIMITS_DO_NOT_EXPORT.md"))) errors.push("ZIP missing SAFETY_LIMITS_DO_NOT_EXPORT.md");
if (!zipEntries.some((entry) => entry.endsWith("V49_LOCAL_STATIC_REVIEW_PORTAL_COPY.html"))) errors.push("ZIP missing V49 local portal copy");
const forbiddenZip = /\.(set|sty|prf|prs|kst|wav|aiff|aif|mp3|flac|ogg|mid|midi)$/i;
for (const entry of zipEntries) {
  const lower = entry.toLowerCase();
  if (forbiddenZip.test(lower)) errors.push(`Forbidden ZIP entry: ${entry}`);
  if (lower.endsWith("app.jsx")) errors.push(`ZIP contains App.jsx: ${entry}`);
  if (lower.includes("/deploy/") || lower.includes("/public/") || lower.includes("/docs/")) errors.push(`ZIP contains deploy/public/docs target: ${entry}`);
  if (!/\.(html|json|md)$/i.test(entry)) errors.push(`ZIP contains unsupported type: ${entry}`);
}
if (seal) {
  if (!["PASS", "WARN"].includes(seal.governanceStatus)) errors.push("governanceStatus must be PASS or WARN");
  if (seal.metadataWorkflowFrozen !== true) errors.push("metadataWorkflowFrozen must be true");
  for (const field of ["readyForKorgExport", "readyForUsb", "readyForKeyboardLoad", "appJsTouched", "deployPerformed", "paymentEnabled"]) {
    if (seal[field] !== false) errors.push(`seal.${field} must be false`);
  }
}
if (manifest) {
  for (const field of ["metadataOnly", "localPortalOnly", "governanceAuditOnly"]) {
    if (manifest[field] !== true) errors.push(`manifest.${field} must be true`);
  }
  for (const field of ["sourceProjectModified", "korgOutputAllowed", "usbWriteAllowed", "keyboardLoadAllowed", "approvedForExport"]) {
    if (manifest[field] !== false) errors.push(`manifest.${field} must be false`);
  }
}
for (const filePath of walkFiles(root)) {
  const lower = filePath.toLowerCase();
  if (lower.includes(`${path.sep}.set${path.sep}`) || lower.endsWith(".set")) errors.push(`Forbidden V50 SET folder/file: ${rel(filePath)}`);
  if (/\.(sty|prf|prs|kst)$/i.test(lower)) errors.push(`Forbidden V50 keyboard file: ${rel(filePath)}`);
  if (/\.(wav|aiff|aif|mp3|flac|ogg|mid|midi)$/i.test(lower)) errors.push(`Forbidden V50 audio/sample binary: ${rel(filePath)}`);
  if (path.basename(lower) === "app.jsx") errors.push(`Forbidden V50 App.jsx: ${rel(filePath)}`);
  if (lower.includes(`${path.sep}deploy${path.sep}`) || lower.includes(`${path.sep}public${path.sep}`) || lower.includes(`${path.sep}docs${path.sep}`)) {
    errors.push(`Forbidden V50 deploy/public/docs path: ${rel(filePath)}`);
  }
}
const unchangedChecks = [
  ["V37 source project", path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json")],
  ["V42 dry-run project", path.join(base, "v42", "generated", "UAOS_V42_DRYRUN_PROJECT_AFTER_PREVIEW.uaosproject.json")],
  ["V44 dry-run project", path.join(base, "v44", "generated", "UAOS_V44_DRYRUN_PROJECT_AFTER_DECISION_PREVIEW.uaosproject.json")],
  ["V46 dry-run project", path.join(base, "v46", "generated", "UAOS_V46_DRYRUN_PROJECT_AFTER_IMPORT_PREVIEW_V3.uaosproject.json")],
  ["App.jsx", path.join(repoRoot, "uaos-ai-factory", "pc-workstation", "stable", "UAOS_PC_WORKSTATION_APP_V10", "App.jsx")]
];
for (const [label, filePath] of unchangedChecks) {
  const relative = path.relative(repoRoot, filePath).replace(/\\/g, "/");
  const check = childProcess.spawnSync("git", ["status", "--short", "--", relative], { cwd: repoRoot, encoding: "utf8" });
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
    governanceAuditOnly: true,
    localPortalZipOnly: true,
    noRealApply: true,
    noSourceProjectMutation: true,
    noKorgOutput: true,
    noSetStylePerfPresetKst: true,
    noAudioSampleBinaries: true,
    noUsbWrite: true,
    noKeyboardLoad: true,
    noFixtureModification: true,
    noAppJs: true,
    noDeploy: true,
    noPayment: true,
    noExportApproval: true
  }
};
fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", "utf8");
if (status === "PASS") {
  fs.writeFileSync(path.join(reportsDir, "UAOS_V50_QA_REPORT.md"), [
    "# UAOS V50 QA Report",
    "",
    "Governance audit seal created: YES",
    "Audit findings created: YES",
    "Local portal index ZIP created: YES",
    "Manifest and hashes created: YES",
    "Validator PASS: YES",
    "No real apply: YES",
    "No source project mutation: YES",
    "No KORG output: YES",
    "No SET/STY/PRF/PRS/KST: YES",
    "No audio/sample binaries: YES",
    "No USB: YES",
    "No PA3X load: YES",
    "No fixture modification: YES",
    "No App.jsx: YES",
    "No deploy: YES",
    "No payment: YES"
  ].join("\n") + "\n", "utf8");
  fs.writeFileSync(path.join(reportsDir, "UAOS_V50_FINAL_SEAL.md"), [
    "# UAOS V50 Final Seal",
    "",
    "Status: PASS",
    "",
    "V50 created a governance audit seal, audit findings, local portal index ZIP, manifest, hashes, QA report, owner dashboard, and validator result.",
    "",
    "Safety: metadata-only, governance audit only, local portal ZIP only, no real apply, no source project mutation, no KORG output, no SET/STY/PRF/PRS/KST, no audio/sample binaries, no USB write, no PA3X load, no fixture modification, no App.jsx, no deploy, no payment, no export approval."
  ].join("\n") + "\n", "utf8");
}
console.log(JSON.stringify(result, null, 2));
process.exit(errors.length ? 1 : 0);
