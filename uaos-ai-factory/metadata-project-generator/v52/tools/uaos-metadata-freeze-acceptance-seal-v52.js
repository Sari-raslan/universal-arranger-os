import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const base = path.resolve(root, "..");
const generatedDir = path.join(root, "generated");
const reportsDir = path.join(root, "reports");

const paths = {
  v49FreezePack: path.join(base, "v49", "generated", "UAOS_V49_METADATA_GOVERNANCE_FREEZE_PACK.json"),
  v50AuditSeal: path.join(base, "v50", "generated", "UAOS_V50_GOVERNANCE_AUDIT_SEAL.json"),
  v51AcceptancePack: path.join(base, "v51", "generated", "UAOS_V51_METADATA_WORKFLOW_FREEZE_ACCEPTANCE_PACK.json"),
  v51Checklist: path.join(base, "v51", "generated", "UAOS_V51_FREEZE_ACCEPTANCE_CHECKLIST.json"),
  v51Portal: path.join(base, "v51", "generated", "UAOS_V51_OWNER_REVIEW_PORTAL_POLISHED.html"),
  v48Regression: path.join(base, "v48", "generated", "UAOS_V48_ARCHIVE_INTEGRITY_REGRESSION_RESULTS.json"),
  v47Health: path.join(base, "v47", "generated", "UAOS_V47_ARCHIVE_HEALTH_SUMMARY.json")
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safetyBlock() {
  return {
    metadataOnly: true,
    freezeSealDocumentationOnly: true,
    sourceProjectModified: false,
    autoApplyEnabled: false,
    realApplyAllowed: false,
    exportAllowed: false,
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

const createdAt = new Date().toISOString();
const v49FreezePack = readJson(paths.v49FreezePack);
const v50AuditSeal = readJson(paths.v50AuditSeal);
const v51AcceptancePack = readJson(paths.v51AcceptancePack);
const v51Checklist = readJson(paths.v51Checklist);
const v48Regression = readJson(paths.v48Regression);
const v47Health = readJson(paths.v47Health);
const checklistPassed = Array.isArray(v51Checklist.items) && v51Checklist.items.every((item) => item.passed === true);
const ownerReviewReady = v50AuditSeal.readyForOwnerReview === true && v51AcceptancePack.ownerReviewReadyStatus === "READY_FOR_OWNER_REVIEW" && checklistPassed;

const seal = {
  schemaVersion: "uaos.v52.metadata.freeze.acceptance.seal.v1",
  sealId: `uaos-v52-freeze-seal-${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}`,
  createdAt,
  coveredVersions: Array.from({ length: 16 }, (_, index) => `V${37 + index}`),
  acceptedScope: [
    "metadata project generator workflow",
    "metadata review workflow",
    "suggestion review workflow",
    "dry-run preview workflow",
    "local review portal workflow",
    "governance freeze documentation"
  ],
  excludedScope: [
    "KORG writer",
    "PA3X hardware export",
    "USB copy",
    "SET modification",
    "App.jsx integration",
    "deploy/payment"
  ],
  metadataFreezeAccepted: true,
  ownerReviewReady,
  readyForKorgExport: false,
  readyForUsb: false,
  readyForKeyboardLoad: false,
  compatibilityClaim: false,
  pa3xReadyClaim: false,
  sourceSummary: {
    v49FreezePackPath: paths.v49FreezePack,
    v50AuditSealPath: paths.v50AuditSeal,
    v51AcceptancePackPath: paths.v51AcceptancePack,
    v51ChecklistPath: paths.v51Checklist,
    v51PortalPath: paths.v51Portal,
    v48RegressionStatus: v48Regression.archiveIntegrityStatus,
    v47ArchiveReadyForOwnerReview: v47Health.archiveReadyForOwnerReview,
    v49FrozenScopeCount: Array.isArray(v49FreezePack.frozenScope) ? v49FreezePack.frozenScope.length : 0
  },
  safety: safetyBlock()
};

const sealMd = [
  "# UAOS V52 Metadata Freeze Acceptance Seal",
  "",
  `Seal ID: ${seal.sealId}`,
  `Created at: ${seal.createdAt}`,
  `Covered versions: ${seal.coveredVersions.join(", ")}`,
  "Metadata freeze accepted: YES",
  `Owner review ready: ${ownerReviewReady ? "YES" : "NO"}`,
  "",
  "## Accepted Scope",
  ...seal.acceptedScope.map((item) => `- ${item}`),
  "",
  "## Excluded Scope",
  ...seal.excludedScope.map((item) => `- ${item}`),
  "",
  "Ready for KORG export: NO",
  "Ready for USB: NO",
  "Ready for keyboard load: NO",
  "Compatibility claim: NO",
  "PA3X-ready claim: NO"
].join("\n");

const report = [
  "# UAOS V52 Metadata Freeze Acceptance Seal Report",
  "",
  "Status: GENERATED",
  "",
  `Seal: generated/UAOS_V52_METADATA_FREEZE_ACCEPTANCE_SEAL.json`,
  "Metadata freeze accepted: YES",
  `Owner review ready: ${ownerReviewReady ? "YES" : "NO"}`,
  "",
  "Safety: freeze seal documentation only, metadata-only, no export approval."
].join("\n");

fs.writeFileSync(path.join(generatedDir, "UAOS_V52_METADATA_FREEZE_ACCEPTANCE_SEAL.json"), JSON.stringify(seal, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(generatedDir, "UAOS_V52_METADATA_FREEZE_ACCEPTANCE_SEAL.md"), sealMd + "\n", "utf8");
fs.writeFileSync(path.join(reportsDir, "UAOS_V52_METADATA_FREEZE_ACCEPTANCE_SEAL_REPORT.md"), report + "\n", "utf8");

console.log(JSON.stringify({ status: "GENERATED", output: "generated/UAOS_V52_METADATA_FREEZE_ACCEPTANCE_SEAL.json" }, null, 2));
