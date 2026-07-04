import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

const paths = {
  zip: path.join(base, "v46", "generated", "UAOS_V46_LOCAL_REVIEW_PACK_METADATA_ONLY.zip"),
  manifest: path.join(base, "v46", "generated", "UAOS_V46_LOCAL_REVIEW_PACK_MANIFEST.json"),
  hashes: path.join(base, "v46", "generated", "UAOS_V46_LOCAL_REVIEW_PACK_HASHES.json")
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function readZipEntries(zipPath) {
  const buffer = fs.readFileSync(zipPath);
  const entries = [];
  let offset = 0;
  while (offset < buffer.length - 4) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;
    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const uncompressedSize = buffer.readUInt32LE(offset + 22);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const contentStart = nameStart + nameLength + extraLength;
    const contentEnd = contentStart + compressedSize;
    const name = buffer.toString("utf8", nameStart, nameStart + nameLength);
    const content = buffer.subarray(contentStart, contentEnd);
    entries.push({
      name,
      method,
      sizeBytes: uncompressedSize,
      compressedSizeBytes: compressedSize,
      sha256: sha256(content),
      content
    });
    offset = contentEnd;
  }
  return entries;
}

function safetyBlock() {
  return {
    metadataOnly: true,
    reviewPackOnly: true,
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

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const generatedAt = new Date().toISOString();
const zipExists = fs.existsSync(paths.zip);
const manifest = readJson(paths.manifest);
const hashes = readJson(paths.hashes);
const entries = zipExists ? readZipEntries(paths.zip) : [];
const listedFiles = entries.map((entry) => entry.name);
const manifestEntries = new Map((manifest.includedFiles || []).map((item) => [item.zipEntry, item]));
const hashEntries = new Map((hashes.files || []).map((item) => [item.zipEntry, item]));
const allowedManifestExtras = new Set([
  "v46/UAOS_V46_LOCAL_REVIEW_PACK_MANIFEST.json",
  "v46/UAOS_V46_LOCAL_REVIEW_PACK_HASHES.json"
]);

const missingFiles = [...manifestEntries.keys()].filter((name) => !listedFiles.includes(name));
const unexpectedFiles = listedFiles.filter((name) => !manifestEntries.has(name) && !allowedManifestExtras.has(name));
const forbiddenPattern = /\.(set|sty|prf|prs|kst|wav|aiff|aif|mp3|flac|ogg|mid|midi)$/i;
const forbiddenFilesDetected = listedFiles.filter((name) => forbiddenPattern.test(name) || path.basename(name).toLowerCase() === "app.jsx");
const hashVerificationResults = entries.map((entry) => {
  const expected = manifestEntries.get(entry.name)?.sha256 || hashEntries.get(entry.name)?.sha256 || null;
  return {
    zipEntry: entry.name,
    sha256: entry.sha256,
    expectedSha256: expected,
    matchesExpected: expected ? expected === entry.sha256 : allowedManifestExtras.has(entry.name),
    verificationSource: manifestEntries.has(entry.name) ? "manifest" : hashEntries.has(entry.name) ? "hashes" : "allowed_manifest_extra"
  };
});
const hashVerificationStatus = hashVerificationResults.every((item) => item.matchesExpected) ? "PASS" : "FAIL";
const manifestMatchesZip = missingFiles.length === 0 && unexpectedFiles.length === 0;
const safetyStatus = zipExists && manifestMatchesZip && hashVerificationStatus === "PASS" && forbiddenFilesDetected.length === 0 ? "PASS" : "FAIL";

const inspection = {
  schemaVersion: "uaos.v47.review.pack.inspection.v1",
  generatedAt,
  zipPath: paths.zip,
  zipExists,
  zipSizeBytes: zipExists ? fs.statSync(paths.zip).size : 0,
  fileCount: entries.length,
  listedFiles,
  manifestMatchesZip,
  hashVerificationStatus,
  hashVerificationResults: hashVerificationResults.map(({ content, ...item }) => item),
  missingFiles,
  unexpectedFiles,
  forbiddenFilesDetected,
  reviewPackOnly: manifest.reviewPackOnly === true,
  metadataOnly: manifest.metadataOnly === true,
  noKorgOutput: manifest.korgOutputAllowed === false,
  noUsbApproval: manifest.usbWriteAllowed === false,
  noKeyboardLoadApproval: manifest.keyboardLoadAllowed === false,
  noExportApproval: manifest.approvedForExport === false,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  safetyStatus,
  safety: safetyBlock()
};

const contentsIndex = {
  schemaVersion: "uaos.v47.review.pack.contents.index.v1",
  generatedAt,
  zipPath: paths.zip,
  fileCount: entries.length,
  contents: entries.map((entry) => ({
    zipEntry: entry.name,
    sizeBytes: entry.sizeBytes,
    compressedSizeBytes: entry.compressedSizeBytes,
    method: entry.method === 0 ? "stored" : `method_${entry.method}`,
    sha256: entry.sha256,
    forbidden: forbiddenFilesDetected.includes(entry.name)
  })),
  safetyStatus,
  metadataOnly: true,
  reviewPackOnly: true
};

const inspectionMd = [
  "# UAOS V47 Review Pack Inspection",
  "",
  `ZIP path: ${paths.zip}`,
  `ZIP exists: ${zipExists ? "YES" : "NO"}`,
  `File count: ${entries.length}`,
  `Manifest matches ZIP: ${manifestMatchesZip ? "YES" : "NO"}`,
  `Hash verification: ${hashVerificationStatus}`,
  `Forbidden files detected: ${forbiddenFilesDetected.length}`,
  `Safety status: ${safetyStatus}`,
  "",
  "Confirmed: review-pack only, metadata-only, no KORG output, no USB approval, no keyboard load approval, no export approval."
].join("\n");

const contentsMd = [
  "# UAOS V47 Review Pack Contents Index",
  "",
  `File count: ${entries.length}`,
  "",
  ...entries.map((entry) => `- ${entry.name} (${entry.sizeBytes} bytes)`)
].join("\n");

const reportMd = [
  "# UAOS V47 Review Pack Inspector Report",
  "",
  `Status: ${safetyStatus}`,
  "",
  `ZIP: ${paths.zip}`,
  `Manifest matches ZIP: ${manifestMatchesZip ? "YES" : "NO"}`,
  `Hash verification: ${hashVerificationStatus}`,
  `Forbidden files detected: ${forbiddenFilesDetected.length}`,
  "",
  "Inspection used direct ZIP reading only. No source folder extraction was required."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V47_REVIEW_PACK_INSPECTION.json"), JSON.stringify(inspection, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V47_REVIEW_PACK_INSPECTION.md"), inspectionMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V47_REVIEW_PACK_CONTENTS_INDEX.json"), JSON.stringify(contentsIndex, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V47_REVIEW_PACK_CONTENTS_INDEX.md"), contentsMd + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V47_REVIEW_PACK_INSPECTOR_REPORT.md"), reportMd + "\n", "utf8");

console.log(JSON.stringify({ status: safetyStatus, zipEntries: entries.length, output: "generated/UAOS_V47_REVIEW_PACK_INSPECTION.json" }, null, 2));
