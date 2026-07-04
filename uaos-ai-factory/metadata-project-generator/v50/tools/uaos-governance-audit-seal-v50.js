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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safetyBlock() {
  return {
    metadataOnly: true,
    governanceAuditOnly: true,
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

function scanUnsafeFlags(value, filePath, findings, prefix = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanUnsafeFlags(item, filePath, findings, `${prefix}[${index}]`));
    return;
  }
  const falseOnly = new Set([
    "readyForKorgExport",
    "readyForUsb",
    "readyForKeyboardLoad",
    "approvedForKorgExport",
    "approvedForUsb",
    "approvedForKeyboardLoad",
    "korgOutputAllowed",
    "setModificationAllowed",
    "usbWriteAllowed",
    "keyboardLoadAllowed",
    "autoApplyEnabled",
    "realApplyAllowed",
    "sourceProjectModified",
    "canAutoApply",
    "exportApprovalImpact"
  ]);
  for (const [key, nested] of Object.entries(value)) {
    const field = prefix ? `${prefix}.${key}` : key;
    if (falseOnly.has(key) && nested === true) findings.push({ type: "unsafe_true_flag", filePath, field });
    if ((key === "metadataOnly" || key === "dryRunOnly") && nested === false) findings.push({ type: "unsafe_false_flag", filePath, field });
    scanUnsafeFlags(nested, filePath, findings, field);
  }
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });

const generatedAt = new Date().toISOString();
const latestCommit = childProcess.spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
const auditedVersions = Array.from({ length: 13 }, (_, index) => `V${37 + index}`);
const findings = [];
const warnings = [];
const forbiddenFiles = [];
const forbiddenExt = /\.(set|sty|prf|prs|kst|wav|aiff|aif|mp3|flac|ogg|mid|midi)$/i;

for (const versionLabel of auditedVersions) {
  const version = versionLabel.toLowerCase();
  const versionDir = path.join(base, version);
  const generatedPath = path.join(versionDir, "generated");
  const reportsPath = path.join(versionDir, "reports");
  const files = walkFiles(versionDir);
  const qaReport = files.find((filePath) => /QA_REPORT\.md$/i.test(filePath));
  const finalSeal = files.find((filePath) => /FINAL_SEAL\.md$/i.test(filePath));
  const generatedOutputs = walkFiles(generatedPath);

  if (!fs.existsSync(versionDir)) findings.push({ version: versionLabel, type: "missing_version_folder", path: versionDir });
  if (!qaReport) findings.push({ version: versionLabel, type: "missing_qa_report", path: reportsPath });
  if (!finalSeal) findings.push({ version: versionLabel, type: "missing_final_seal", path: reportsPath });
  if (!generatedOutputs.length) findings.push({ version: versionLabel, type: "missing_generated_outputs", path: generatedPath });

  for (const filePath of files) {
    const lower = filePath.toLowerCase();
    if (forbiddenExt.test(lower)) forbiddenFiles.push(filePath);
    if (path.basename(lower) === "app.jsx") findings.push({ version: versionLabel, type: "app_js_found", path: filePath });
    if (lower.includes(`${path.sep}deploy${path.sep}`) || lower.includes(`${path.sep}public${path.sep}`) || lower.includes(`${path.sep}docs${path.sep}`)) {
      findings.push({ version: versionLabel, type: "deploy_public_docs_path_found", path: filePath });
    }
    if (lower.endsWith(".json")) {
      try {
        scanUnsafeFlags(readJson(filePath), filePath, findings);
      } catch (error) {
        findings.push({ version: versionLabel, type: "invalid_json", path: filePath, error: error.message });
      }
    }
  }
}

const requiredArtifacts = [
  ["V49 freeze pack", path.join(base, "v49", "generated", "UAOS_V49_METADATA_GOVERNANCE_FREEZE_PACK.json")],
  ["V48 archive regression", path.join(base, "v48", "generated", "UAOS_V48_ARCHIVE_INTEGRITY_REGRESSION_RESULTS.json")],
  ["V47 archive index", path.join(base, "v47", "generated", "UAOS_V47_LOCAL_ARCHIVE_INDEX_V37_V46.html")],
  ["V46 review pack ZIP", path.join(base, "v46", "generated", "UAOS_V46_LOCAL_REVIEW_PACK_METADATA_ONLY.zip")]
];
for (const [label, filePath] of requiredArtifacts) {
  if (!fs.existsSync(filePath)) findings.push({ type: "missing_required_artifact", label, path: filePath });
}
for (const filePath of forbiddenFiles) findings.push({ type: "forbidden_native_or_audio_file", path: filePath });

const governanceStatus = findings.length ? "BLOCKED" : warnings.length ? "WARN" : "PASS";
const blockedActions = [
  "real apply",
  "source project mutation",
  "auto-apply",
  "KORG output",
  "SET/STY/PRF/PRS/KST generation",
  "USB write",
  "PA3X load",
  "export approval",
  "App.jsx integration",
  "deploy",
  "payment"
];

const auditSeal = {
  schemaVersion: "uaos.v50.governance.audit.seal.v1",
  generatedAt,
  auditId: `uaos-v50-governance-audit-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  auditedVersions,
  latestVersion: "V49",
  latestCommit,
  expectedLatestCommitFromBrief: "0150093873ca520cb88d9cac4df34e43f0e90556",
  governanceStatus,
  metadataWorkflowFrozen: true,
  readyForOwnerReview: governanceStatus === "PASS" || governanceStatus === "WARN",
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  appJsTouched: false,
  deployPerformed: false,
  paymentEnabled: false,
  findings,
  warnings,
  blockedActions,
  safety: safetyBlock()
};

const auditFindings = {
  schemaVersion: "uaos.v50.governance.audit.findings.v1",
  generatedAt,
  findingCount: findings.length,
  warningCount: warnings.length,
  findings,
  warnings,
  forbiddenFilesDetected: forbiddenFiles,
  governanceStatus,
  metadataOnly: true,
  governanceAuditOnly: true
};

const auditSealMd = [
  "# UAOS V50 Governance Audit Seal",
  "",
  `Audit ID: ${auditSeal.auditId}`,
  `Governance status: ${governanceStatus}`,
  `Audited versions: ${auditedVersions.join(", ")}`,
  `Latest version: ${auditSeal.latestVersion}`,
  `Latest commit: ${latestCommit}`,
  "Metadata workflow frozen: YES",
  `Ready for owner review: ${auditSeal.readyForOwnerReview ? "YES" : "NO"}`,
  "",
  "Ready for KORG export: NO",
  "Ready for USB: NO",
  "Ready for keyboard load: NO",
  "App.jsx touched: NO",
  "Deploy performed: NO",
  "Payment enabled: NO"
].join("\n");

const findingsMd = [
  "# UAOS V50 Governance Audit Findings",
  "",
  `Findings: ${findings.length}`,
  `Warnings: ${warnings.length}`,
  "",
  findings.length ? findings.map((item) => `- ${item.type}: ${item.path || item.label || ""}`).join("\n") : "No blocking findings.",
  "",
  warnings.length ? warnings.map((item) => `- ${item.type || "warning"}: ${item.path || item.message || ""}`).join("\n") : "No warnings."
].join("\n");

const reportMd = [
  "# UAOS V50 Governance Audit Report",
  "",
  `Status: ${governanceStatus}`,
  "",
  `Audit seal: generated/UAOS_V50_GOVERNANCE_AUDIT_SEAL.json`,
  `Findings: ${findings.length}`,
  `Warnings: ${warnings.length}`,
  "",
  "Safety: governance audit only, metadata-only, no source mutation, no export approval."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_SEAL.json"), JSON.stringify(auditSeal, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_SEAL.md"), auditSealMd + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_FINDINGS.json"), JSON.stringify(auditFindings, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V50_GOVERNANCE_AUDIT_FINDINGS.md"), findingsMd + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V50_GOVERNANCE_AUDIT_REPORT.md"), reportMd + "\n", "utf8");

console.log(JSON.stringify({ status: governanceStatus, findings: findings.length, output: "generated/UAOS_V50_GOVERNANCE_AUDIT_SEAL.json" }, null, 2));
