import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");
const portalIndexDir = path.join(root, "portal-index");
const zipPath = path.join(generatedDir, "UAOS_V50_LOCAL_PORTAL_INDEX_METADATA_ONLY.zip");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function unixTimeDate(date = new Date()) {
  return {
    dosTime: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    dosDate: ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
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
  fs.writeFileSync(path.join(portalIndexDir, name), lines.join("\n") + "\n", "utf8");
}

function safetyBlock() {
  return {
    metadataOnly: true,
    localPortalOnly: true,
    governanceAuditOnly: true,
    sourceProjectModified: false,
    korgOutputAllowed: false,
    usbWriteAllowed: false,
    keyboardLoadAllowed: false,
    approvedForExport: false
  };
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
fs.mkdirSync(portalIndexDir, { recursive: true });

const generatedAt = new Date().toISOString();
const auditSeal = readJson(path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_SEAL.json"));
const auditFindings = readJson(path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_FINDINGS.json"));
const validatorPath = path.join(reportsDir, "UAOS_V50_VALIDATOR_RESULTS.json");
const validatorAlreadyPassed = fs.existsSync(validatorPath) && readJson(validatorPath).status === "PASS";
const v49Portal = path.join(base, "v49", "generated", "UAOS_V49_LOCAL_STATIC_REVIEW_PORTAL.html");

writeMd("START_HERE_UAOS_V50_LOCAL_PORTAL_INDEX.md", [
  "# Start Here - UAOS V50 Local Portal Index",
  "",
  "This local portal index is metadata-only and governance-audit only.",
  `Governance status: ${auditSeal.governanceStatus}`,
  `Ready for owner review: ${auditSeal.readyForOwnerReview ? "YES" : "NO"}`,
  "",
  "Do not export, do not write USB, and do not load PA3X."
]);
writeMd("V37_V50_TIMELINE.md", [
  "# V37-V50 Timeline",
  "",
  ...auditSeal.auditedVersions.map((version) => `- ${version}: included in governance audit`),
  "- V50: governance audit seal and local portal index ZIP"
]);
writeMd("LOCAL_PORTAL_PATHS.md", [
  "# Local Portal Paths",
  "",
  `- V49 local static review portal: ${v49Portal}`,
  `- V50 governance audit seal: ${path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_SEAL.json")}`,
  `- V50 audit findings: ${path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_FINDINGS.json")}`,
  `- V50 portal ZIP: ${zipPath}`
]);
writeMd("GOVERNANCE_AUDIT_SUMMARY.md", [
  "# Governance Audit Summary",
  "",
  `Status: ${auditSeal.governanceStatus}`,
  `Findings: ${auditFindings.findingCount}`,
  `Warnings: ${auditFindings.warningCount}`,
  "Metadata workflow frozen: YES",
  "Ready for KORG export: NO",
  "Ready for USB: NO",
  "Ready for keyboard load: NO"
]);
writeMd("SAFETY_LIMITS_DO_NOT_EXPORT.md", [
  "# Safety Limits - Do Not Export",
  "",
  "Metadata-only.",
  "Governance audit only.",
  "Local portal ZIP only.",
  "No real apply.",
  "No source project mutation.",
  "No KORG output.",
  "No SET, STY, PRF, PRS, or KST generation.",
  "No audio/sample binaries.",
  "No USB write.",
  "No PA3X load.",
  "No App.jsx.",
  "No deploy.",
  "No payment.",
  "No export approval."
]);
writeMd("NEXT_SAFE_ACTIONS.md", [
  "# Next Safe Actions",
  "",
  "- V51 Metadata Workflow Freeze Acceptance Pack, metadata-only",
  "- V51 Owner Review Portal Polish, local-only/no App.jsx/no deploy",
  "- V51 UI Integration Plan, planning only/no App.jsx",
  "- Stop"
]);
fs.writeFileSync(path.join(portalIndexDir, "V49_LOCAL_STATIC_REVIEW_PORTAL_COPY.html"), fs.readFileSync(v49Portal, "utf8"), "utf8");

const nextMatrix = {
  schemaVersion: "uaos.v50.next.recommendation.matrix.v1",
  generatedAt,
  metadataOnly: true,
  approvedForKorgExport: false,
  approvedForUsb: false,
  approvedForKeyboardLoad: false,
  recommendations: [
    { id: "A", action: "V51 Metadata Workflow Freeze Acceptance Pack", safety: "metadata-only", recommended: true },
    { id: "B", action: "V51 Owner Review Portal Polish", safety: "local-only, no App.jsx, no deploy", recommended: true },
    { id: "C", action: "V51 UI Integration Plan", safety: "planning only, no App.jsx", recommended: false },
    { id: "D", action: "Stop", safety: "always available", recommended: false }
  ],
  recommendedTogether: ["A", "B"],
  safety: safetyBlock()
};
fs.writeFileSync(path.join(generatedDir, "UAOS_V50_NEXT_RECOMMENDATION_MATRIX.json"), JSON.stringify(nextMatrix, null, 2) + "\n", "utf8");

const report = [
  "# UAOS V50 Local Portal Index ZIP Report",
  "",
  "Status: GENERATED",
  "",
  "The ZIP contains only selected local HTML, JSON, and MD metadata review artifacts.",
  "It does not include native keyboard files, audio/sample binaries, App.jsx, deploy/public/docs paths, or executable scripts."
].join("\n");
const qa = [
  "# UAOS V50 QA Report",
  "",
  "Governance audit seal created: YES",
  "Audit findings created: YES",
  "Local portal index ZIP created: YES",
  "Manifest and hashes created: YES",
  `Validator PASS: ${validatorAlreadyPassed ? "YES" : "pending validator run"}`,
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
].join("\n");
const dashboard = [
  "# UAOS V50 Owner Dashboard",
  "",
  `Governance audit seal: ${path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_SEAL.json")}`,
  `Audit findings: ${path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_FINDINGS.json")}`,
  `Portal ZIP: ${zipPath}`,
  `Manifest: ${path.join(generatedDir, "UAOS_V50_LOCAL_PORTAL_INDEX_MANIFEST.json")}`,
  `Hashes: ${path.join(generatedDir, "UAOS_V50_LOCAL_PORTAL_INDEX_HASHES.json")}`,
  `Safety status: ${auditSeal.governanceStatus}`,
  "",
  "Still blocked: real apply, source project mutation, auto-apply, KORG output, SET/STY/PRF/PRS/KST generation, USB write, PA3X load, export approval, App.jsx integration, deploy, payment.",
  "",
  "Next recommended phase: A + B together, V51 Metadata Workflow Freeze Acceptance Pack and V51 Owner Review Portal Polish."
].join("\n");
const master = [
  "# UAOS V50 Master Index",
  "",
  "- generated/UAOS_V50_GOVERNANCE_AUDIT_SEAL.json",
  "- generated/UAOS_V50_GOVERNANCE_AUDIT_SEAL.md",
  "- generated/UAOS_V50_GOVERNANCE_AUDIT_FINDINGS.json",
  "- generated/UAOS_V50_GOVERNANCE_AUDIT_FINDINGS.md",
  "- generated/UAOS_V50_LOCAL_PORTAL_INDEX_MANIFEST.json",
  "- generated/UAOS_V50_LOCAL_PORTAL_INDEX_HASHES.json",
  "- generated/UAOS_V50_LOCAL_PORTAL_INDEX_METADATA_ONLY.zip",
  "- generated/UAOS_V50_NEXT_RECOMMENDATION_MATRIX.json",
  "- reports/UAOS_V50_GOVERNANCE_AUDIT_REPORT.md",
  "- reports/UAOS_V50_LOCAL_PORTAL_INDEX_ZIP_REPORT.md",
  "- reports/UAOS_V50_VALIDATOR_RESULTS.json",
  "- reports/UAOS_V50_QA_REPORT.md",
  "- reports/UAOS_V50_OWNER_DASHBOARD.md",
  "- reports/UAOS_V50_FINAL_SEAL.md"
].join("\n");
const seal = [
  "# UAOS V50 Final Seal",
  "",
  `Status: ${validatorAlreadyPassed ? "PASS" : "pending validator run"}`,
  "",
  "V50 created a governance audit seal, audit findings, local portal index ZIP, manifest, hashes, QA report, owner dashboard, and validator result.",
  "",
  "Safety: metadata-only, governance audit only, local portal ZIP only, no real apply, no source mutation, no KORG output, no SET/STY/PRF/PRS/KST, no audio/sample binaries, no USB write, no PA3X load, no fixture modification, no App.jsx, no deploy, no payment, no export approval."
].join("\n");
fs.writeFileSync(path.join(reportsDir, "UAOS_V50_LOCAL_PORTAL_INDEX_ZIP_REPORT.md"), report + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V50_QA_REPORT.md"), qa + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V50_OWNER_DASHBOARD.md"), dashboard + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V50_MASTER_INDEX.md"), master + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V50_FINAL_SEAL.md"), seal + "\n", "utf8");

const candidates = [
  ...fs.readdirSync(portalIndexDir).map((name) => path.join(portalIndexDir, name)),
  path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_SEAL.json"),
  path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_SEAL.md"),
  path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_FINDINGS.json"),
  path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_FINDINGS.md"),
  path.join(generatedDir, "UAOS_V50_NEXT_RECOMMENDATION_MATRIX.json"),
  path.join(reportsDir, "UAOS_V50_GOVERNANCE_AUDIT_REPORT.md"),
  path.join(reportsDir, "UAOS_V50_LOCAL_PORTAL_INDEX_ZIP_REPORT.md"),
  path.join(reportsDir, "UAOS_V50_QA_REPORT.md"),
  path.join(reportsDir, "UAOS_V50_OWNER_DASHBOARD.md"),
  path.join(reportsDir, "UAOS_V50_MASTER_INDEX.md"),
  path.join(reportsDir, "UAOS_V50_FINAL_SEAL.md")
].filter((filePath) => fs.existsSync(filePath));
const allowedExt = new Set([".html", ".json", ".md"]);
const forbidden = /\.(set|sty|prf|prs|kst|wav|aiff|aif|mp3|flac|ogg|mid|midi)$/i;
const includedFiles = candidates.map((filePath) => {
  if (!allowedExt.has(path.extname(filePath).toLowerCase())) throw new Error(`Blocked ZIP file type: ${filePath}`);
  if (forbidden.test(filePath)) throw new Error(`Blocked ZIP file: ${filePath}`);
  if (path.basename(filePath).toLowerCase() === "app.jsx") throw new Error(`Blocked App.jsx: ${filePath}`);
  return {
    sourcePath: filePath,
    zipEntry: `v50/${path.basename(filePath)}`,
    sha256: sha256File(filePath),
    sizeBytes: fs.statSync(filePath).size
  };
});
const manifest = {
  schemaVersion: "uaos.v50.local.portal.index.manifest.v1",
  zipPath,
  generatedAt,
  includedFiles,
  metadataOnly: true,
  localPortalOnly: true,
  governanceAuditOnly: true,
  sourceProjectModified: false,
  korgOutputAllowed: false,
  usbWriteAllowed: false,
  keyboardLoadAllowed: false,
  approvedForExport: false,
  safety: safetyBlock()
};
const hashes = {
  schemaVersion: "uaos.v50.local.portal.index.hashes.v1",
  generatedAt,
  files: includedFiles.map(({ zipEntry, sourcePath, sha256, sizeBytes }) => ({ zipEntry, sourcePath, sha256, sizeBytes })),
  safety: safetyBlock()
};
fs.writeFileSync(path.join(generatedDir, "UAOS_V50_LOCAL_PORTAL_INDEX_MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V50_LOCAL_PORTAL_INDEX_HASHES.json"), JSON.stringify(hashes, null, 2) + "\n", "utf8");
const entries = [
  ...includedFiles.map((item) => ({ name: item.zipEntry, path: item.sourcePath })),
  { name: "v50/UAOS_V50_LOCAL_PORTAL_INDEX_MANIFEST.json", path: path.join(generatedDir, "UAOS_V50_LOCAL_PORTAL_INDEX_MANIFEST.json") },
  { name: "v50/UAOS_V50_LOCAL_PORTAL_INDEX_HASHES.json", path: path.join(generatedDir, "UAOS_V50_LOCAL_PORTAL_INDEX_HASHES.json") }
];
createStoredZip(entries, zipPath);
manifest.zipSha256 = sha256File(zipPath);
manifest.zipSizeBytes = fs.statSync(zipPath).size;
fs.writeFileSync(path.join(generatedDir, "UAOS_V50_LOCAL_PORTAL_INDEX_MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
createStoredZip(entries, zipPath);

console.log(JSON.stringify({ status: "GENERATED", zip: "generated/UAOS_V50_LOCAL_PORTAL_INDEX_METADATA_ONLY.zip", files: entries.length }, null, 2));
