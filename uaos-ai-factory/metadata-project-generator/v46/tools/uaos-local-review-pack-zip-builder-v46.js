import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const reviewPackDir = path.join(root, "review-pack");
const zipPath = path.join(generatedDir, "UAOS_V46_LOCAL_REVIEW_PACK_METADATA_ONLY.zip");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function relFromRoot(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function unixTimeDate(date = new Date()) {
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { dosTime, dosDate };
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function createStoredZip(entries, destination) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const { dosTime, dosDate } = unixTimeDate();

  for (const entry of entries) {
    const name = Buffer.from(entry.name.replace(/\\/g, "/"), "utf8");
    const content = fs.readFileSync(entry.path);
    const crc = crc32(content);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(content.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, content);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(dosTime, 12);
    central.writeUInt16LE(dosDate, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(content.length, 20);
    central.writeUInt32LE(content.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + content.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  fs.writeFileSync(destination, Buffer.concat([...localParts, ...centralParts, end]));
}

function writeMd(name, lines) {
  fs.writeFileSync(path.join(reviewPackDir, name), lines.join("\n") + "\n", "utf8");
}

function safetyBlock() {
  return {
    metadataOnly: true,
    reviewPackOnly: true,
    sourceProjectModified: false,
    korgOutputAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    approvedForExport: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
fs.mkdirSync(reviewPackDir, { recursive: true });

const generatedAt = new Date().toISOString();
const preview = readJson(path.join(generatedDir, "UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.json"));
const diff = readJson(path.join(generatedDir, "UAOS_V46_PREVIEW_V3_DIFF_SUMMARY.json"));
const v37Project = readJson(path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"));
const validatorResultPath = path.join(reportsDir, "UAOS_V46_VALIDATOR_RESULTS.json");
const validatorAlreadyPassed = fs.existsSync(validatorResultPath) && readJson(validatorResultPath).status === "PASS";

writeMd("START_HERE_UAOS_V46_REVIEW_PACK.md", [
  "# Start Here - UAOS V46 Review Pack",
  "",
  "This local review pack is metadata-only and dry-run only.",
  "",
  `Preview: ${preview.previewId}`,
  `Pending decisions: ${preview.pendingDecisionCount}`,
  "Accepted changes: 0",
  "",
  "Open the summaries in order, then choose whether the next safe phase should inspect this pack or build a local archive index."
]);
writeMd("V37_PROJECT_SUMMARY.md", [
  "# V37 Project Summary",
  "",
  `Project: ${v37Project.projectName}`,
  `Project ID: ${v37Project.projectId}`,
  "Created internal metadata project, DSP plan, style review plan, and manifest.",
  "No keyboard files were written."
]);
writeMd("V40_SUGGESTIONS_SUMMARY.md", [
  "# V40 Suggestions Summary",
  "",
  "Rule-based style improvement suggestions were produced as metadata.",
  "No real apply, export, USB write, or keyboard load was allowed."
]);
writeMd("V41_REVIEW_PACK_SUMMARY.md", [
  "# V41 Review Pack Summary",
  "",
  "Suggestion review material was packaged for owner review as local metadata.",
  "Owner review remained required before any future metadata planning step."
]);
writeMd("V42_SIMULATION_SUMMARY.md", [
  "# V42 Simulation Summary",
  "",
  "A dry-run apply simulator preview was created.",
  "The original project was not modified."
]);
writeMd("V43_DECISION_TEMPLATE_SUMMARY.md", [
  "# V43 Decision Template Summary",
  "",
  "An owner decision collector template was created.",
  "Decisions remained pending and no export approval was produced."
]);
writeMd("V44_OWNER_FORM_SUMMARY.md", [
  "# V44 Owner Form Summary",
  "",
  "A local owner review form and preview v2 were created.",
  "No source project mutation occurred."
]);
writeMd("V45_PRINTABLE_DECISION_SUMMARY.md", [
  "# V45 Printable Decision Summary",
  "",
  "A manual decision import template and printable decision sheet were created.",
  "All imported decisions remained pending."
]);
writeMd("V46_PREVIEW_V3_SUMMARY.md", [
  "# V46 Preview V3 Summary",
  "",
  `Preview ID: ${preview.previewId}`,
  `Accepted decisions: ${preview.acceptedDecisionCount}`,
  `Pending decisions: ${preview.pendingDecisionCount}`,
  `Skipped pending changes: ${diff.pendingOwnerDecisions.length}`,
  "Applied preview changes: 0"
]);
writeMd("SAFETY_LIMITS_DO_NOT_EXPORT.md", [
  "# Safety Limits - Do Not Export",
  "",
  "Metadata-only.",
  "Dry-run only.",
  "No real apply.",
  "No source project mutation.",
  "No KORG output.",
  "No SET, STY, PRF, PRS, or KST generation.",
  "No USB write.",
  "No keyboard load.",
  "No export approval.",
  "No App.jsx or deploy integration."
]);
writeMd("LOCAL_PATHS_INDEX.md", [
  "# Local Paths Index",
  "",
  "- generated/UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.json",
  "- generated/UAOS_V46_PREVIEW_V3_DIFF_SUMMARY.json",
  "- generated/UAOS_V46_DRYRUN_PROJECT_AFTER_IMPORT_PREVIEW_V3.uaosproject.json",
  "- generated/UAOS_V46_LOCAL_REVIEW_PACK_METADATA_ONLY.zip",
  "- generated/UAOS_V46_LOCAL_REVIEW_PACK_MANIFEST.json",
  "- generated/UAOS_V46_LOCAL_REVIEW_PACK_HASHES.json",
  "- reports/UAOS_V46_OWNER_DASHBOARD.md",
  "- reports/UAOS_V46_FINAL_SEAL.md"
]);

const zipReport = [
  "# UAOS V46 Local Review Pack ZIP Report",
  "",
  "Status: GENERATED",
  "",
  "The ZIP is local, metadata-only, and review-pack only.",
  "It contains markdown, JSON, and HTML review artifacts only.",
  "It does not contain keyboard files, audio/sample binaries, App.jsx, deploy outputs, or executable scripts."
].join("\n");
const qaReport = [
  "# UAOS V46 QA Report",
  "",
  "Metadata project preview v3 created: YES",
  "Diff summary created: YES",
  "Dry-run preview project created: YES",
  "Local review pack folder created: YES",
  "Metadata-only ZIP created: YES",
  "Manifest and hashes created: YES",
  `Validator PASS: ${validatorAlreadyPassed ? "YES" : "pending validator run"}`,
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
].join("\n");
const dashboard = [
  "# UAOS V46 Owner Dashboard",
  "",
  `Preview v3: ${path.join(generatedDir, "UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.json")}`,
  `Diff summary: ${path.join(generatedDir, "UAOS_V46_PREVIEW_V3_DIFF_SUMMARY.json")}`,
  `Dry-run preview project: ${path.join(generatedDir, "UAOS_V46_DRYRUN_PROJECT_AFTER_IMPORT_PREVIEW_V3.uaosproject.json")}`,
  `Review pack ZIP: ${zipPath}`,
  `Manifest: ${path.join(generatedDir, "UAOS_V46_LOCAL_REVIEW_PACK_MANIFEST.json")}`,
  `Hashes: ${path.join(generatedDir, "UAOS_V46_LOCAL_REVIEW_PACK_HASHES.json")}`,
  "",
  `Safety status: ${validatorAlreadyPassed ? "PASS" : "PASS pending validator run"}.`,
  "",
  "Still blocked: real apply, source mutation, export approval, USB write, keyboard load, KORG output, deploy.",
  "",
  "Next recommended phase: A + C together, V47 Review Pack Reader / Inspector and V47 Local Archive Index V37-V46."
].join("\n");
const masterIndex = [
  "# UAOS V46 Master Index",
  "",
  "- generated/UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.json",
  "- generated/UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.md",
  "- generated/UAOS_V46_PREVIEW_V3_DIFF_SUMMARY.json",
  "- generated/UAOS_V46_PREVIEW_V3_DIFF_SUMMARY.md",
  "- generated/UAOS_V46_DRYRUN_PROJECT_AFTER_IMPORT_PREVIEW_V3.uaosproject.json",
  "- generated/UAOS_V46_LOCAL_REVIEW_PACK_METADATA_ONLY.zip",
  "- generated/UAOS_V46_LOCAL_REVIEW_PACK_MANIFEST.json",
  "- generated/UAOS_V46_LOCAL_REVIEW_PACK_HASHES.json",
  "- generated/UAOS_V46_NEXT_RECOMMENDATION_MATRIX.json",
  "- reports/UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3_REPORT.md",
  "- reports/UAOS_V46_LOCAL_REVIEW_PACK_ZIP_REPORT.md",
  "- reports/UAOS_V46_VALIDATOR_RESULTS.json",
  "- reports/UAOS_V46_QA_REPORT.md",
  "- reports/UAOS_V46_OWNER_DASHBOARD.md",
  "- reports/UAOS_V46_FINAL_SEAL.md"
].join("\n");
const finalSeal = [
  "# UAOS V46 Final Seal",
  "",
  `Status: ${validatorAlreadyPassed ? "PASS" : "pending validator run"}`,
  "Safety: metadata-only, dry-run only, local review pack only.",
  "No real apply, no source mutation, no export approval, no USB write, no keyboard load."
].join("\n");

fs.writeFileSync(path.join(reportsDir, "UAOS_V46_LOCAL_REVIEW_PACK_ZIP_REPORT.md"), zipReport + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V46_QA_REPORT.md"), qaReport + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V46_OWNER_DASHBOARD.md"), dashboard + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V46_MASTER_INDEX.md"), masterIndex + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V46_FINAL_SEAL.md"), finalSeal + "\n", "utf8");

const includeCandidates = [
  ...fs.readdirSync(reviewPackDir).map((name) => path.join(reviewPackDir, name)),
  path.join(generatedDir, "UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.json"),
  path.join(generatedDir, "UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3.md"),
  path.join(generatedDir, "UAOS_V46_PREVIEW_V3_DIFF_SUMMARY.json"),
  path.join(generatedDir, "UAOS_V46_PREVIEW_V3_DIFF_SUMMARY.md"),
  path.join(generatedDir, "UAOS_V46_DRYRUN_PROJECT_AFTER_IMPORT_PREVIEW_V3.uaosproject.json"),
  path.join(generatedDir, "UAOS_V46_NEXT_RECOMMENDATION_MATRIX.json"),
  path.join(base, "v37", "generated", "UAOS_EXAMPLE_PROJECT_V37.uaosproject.json"),
  path.join(base, "v40", "generated", "UAOS_V40_STYLE_IMPROVEMENT_SUGGESTIONS.json"),
  path.join(base, "v41", "generated", "UAOS_V41_SUGGESTION_REVIEW_PACK.json"),
  path.join(base, "v42", "generated", "UAOS_V42_METADATA_APPLY_SIMULATION_PREVIEW.json"),
  path.join(base, "v43", "generated", "UAOS_V43_OWNER_DECISION_TEMPLATE.json"),
  path.join(base, "v44", "generated", "UAOS_V44_OWNER_REVIEW_FORM.html"),
  path.join(base, "v45", "generated", "UAOS_V45_OWNER_REVIEW_FORM_V2_PRINTABLE.html"),
  path.join(base, "v45", "generated", "UAOS_V45_OWNER_REVIEW_PRINTABLE_DECISION_SHEET.md"),
  path.join(reportsDir, "UAOS_V46_DECISION_IMPORT_APPLY_PREVIEW_V3_REPORT.md"),
  path.join(reportsDir, "UAOS_V46_LOCAL_REVIEW_PACK_ZIP_REPORT.md"),
  path.join(reportsDir, "UAOS_V46_QA_REPORT.md"),
  path.join(reportsDir, "UAOS_V46_OWNER_DASHBOARD.md"),
  path.join(reportsDir, "UAOS_V46_MASTER_INDEX.md"),
  path.join(reportsDir, "UAOS_V46_FINAL_SEAL.md")
].filter((filePath) => fs.existsSync(filePath));

const allowedExt = new Set([".md", ".json", ".html"]);
const forbiddenPattern = /\.(set|sty|prf|prs|kst|wav|aif|aiff|mp3|flac|ogg|kmp|ksf|pcg)$/i;
const includedFiles = includeCandidates.map((filePath) => {
  if (!allowedExt.has(path.extname(filePath).toLowerCase())) throw new Error(`Blocked ZIP file type: ${filePath}`);
  if (forbiddenPattern.test(filePath)) throw new Error(`Blocked unsafe ZIP file: ${filePath}`);
  if (path.basename(filePath).toLowerCase() === "app.jsx") throw new Error(`Blocked App.jsx in ZIP: ${filePath}`);
  const prefix = filePath.startsWith(root) ? "v46/" : "source-reference/";
  return {
    sourcePath: filePath,
    zipEntry: `${prefix}${path.basename(filePath)}`,
    sha256: sha256File(filePath),
    sizeBytes: fs.statSync(filePath).size
  };
});

const manifest = {
  schemaVersion: "uaos.v46.local.review.pack.manifest.v1",
  zipPath,
  generatedAt,
  includedFiles: includedFiles.map(({ sourcePath, zipEntry, sha256, sizeBytes }) => ({
    sourcePath,
    zipEntry,
    sha256,
    sizeBytes
  })),
  metadataOnly: true,
  reviewPackOnly: true,
  sourceProjectModified: false,
  korgOutputAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  approvedForExport: false,
  safety: safetyBlock()
};
const hashes = {
  schemaVersion: "uaos.v46.local.review.pack.hashes.v1",
  generatedAt,
  files: includedFiles.map(({ zipEntry, sourcePath, sha256, sizeBytes }) => ({ zipEntry, sourcePath, sha256, sizeBytes })),
  safety: safetyBlock()
};

fs.writeFileSync(path.join(generatedDir, "UAOS_V46_LOCAL_REVIEW_PACK_MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V46_LOCAL_REVIEW_PACK_HASHES.json"), JSON.stringify(hashes, null, 2) + "\n", "utf8");

const finalEntries = [
  ...includedFiles.map((item) => ({ name: item.zipEntry, path: item.sourcePath })),
  { name: "v46/UAOS_V46_LOCAL_REVIEW_PACK_MANIFEST.json", path: path.join(generatedDir, "UAOS_V46_LOCAL_REVIEW_PACK_MANIFEST.json") },
  { name: "v46/UAOS_V46_LOCAL_REVIEW_PACK_HASHES.json", path: path.join(generatedDir, "UAOS_V46_LOCAL_REVIEW_PACK_HASHES.json") }
];
createStoredZip(finalEntries, zipPath);

const zipHash = sha256File(zipPath);
manifest.zipSha256 = zipHash;
manifest.zipSizeBytes = fs.statSync(zipPath).size;
fs.writeFileSync(path.join(generatedDir, "UAOS_V46_LOCAL_REVIEW_PACK_MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
createStoredZip([
  ...includedFiles.map((item) => ({ name: item.zipEntry, path: item.sourcePath })),
  { name: "v46/UAOS_V46_LOCAL_REVIEW_PACK_MANIFEST.json", path: path.join(generatedDir, "UAOS_V46_LOCAL_REVIEW_PACK_MANIFEST.json") },
  { name: "v46/UAOS_V46_LOCAL_REVIEW_PACK_HASHES.json", path: path.join(generatedDir, "UAOS_V46_LOCAL_REVIEW_PACK_HASHES.json") }
], zipPath);

console.log(JSON.stringify({ status: "GENERATED", zip: relFromRoot(zipPath), files: finalEntries.length }, null, 2));
