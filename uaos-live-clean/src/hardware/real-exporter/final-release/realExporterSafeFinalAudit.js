import fs from "node:fs";

export const UAOS_PHASE74_VERSION = "74.0.0";

export const FINAL_AUDIT_REQUIRED_FILES = [
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_SAFE_RELEASE_MANIFEST.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_COMPATIBILITY_MATRIX.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_NEXT_ROADMAP.json",
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_MASTER_SAFE_INDEX.json",
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_FINAL_QA_GATE.json"
];

function readJson(file) {
  if (!fs.existsSync(file)) return { file, exists: false, data: null };
  return { file, exists: true, data: JSON.parse(fs.readFileSync(file, "utf8")) };
}

function unsafe(data) {
  if (!data || typeof data !== "object") return false;

  return Boolean(
    data.realKeyboardBinaryWriteAllowed === true ||
    data.realWriterReady === true ||
    data.realBinaryReady === true ||
    data.realStyWriterReady === true ||
    data.allowRealKeyboardBinaryOutput === true ||
    data.allowRealStyOutput === true ||
    data.canExportRealSty === true ||
    data?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
    data?.finalDecision?.realBinaryOutputAllowed === true ||
    data?.finalDecision?.allowRealStyOutput === true ||
    data?.finalDecision?.canExportRealSty === true
  );
}

export function createRealExporterSafeFinalAudit() {
  const checks = FINAL_AUDIT_REQUIRED_FILES.map((file) => {
    const read = readJson(file);
    return {
      file,
      exists: read.exists,
      format: read.data?.format || "unknown",
      unsafeRealBinaryClaim: unsafe(read.data),
      ok: read.exists && !unsafe(read.data)
    };
  });

  const failed = checks.filter(x => !x.ok);

  return {
    format: "UAOS_REAL_EXPORTER_SAFE_FINAL_AUDIT",
    version: UAOS_PHASE74_VERSION,
    phase: 74,
    status: failed.length === 0 ? "PASS" : "FAIL",
    requiredFileCount: FINAL_AUDIT_REQUIRED_FILES.length,
    passedFileCount: checks.filter(x => x.ok).length,
    failedFileCount: failed.length,
    checks,
    finalDecision: {
      realExporterSafeFoundationFinal: failed.length === 0,
      allowSafeJsonPackage: true,
      allowSafeUaosbinPackage: true,
      allowRealKeyboardBinaryOutput: false,
      realWriterReady: false,
      reason: "Final audit passed for safe foundation only. Real keyboard binary output remains blocked."
    },
    safety: {
      realBinaryBlocked: true,
      warning: "Final audit does not permit real proprietary keyboard binary output."
    }
  };
}

export function validateRealExporterSafeFinalAudit(audit) {
  const errors = [];

  if (audit?.format !== "UAOS_REAL_EXPORTER_SAFE_FINAL_AUDIT") errors.push("Invalid audit format.");
  if (audit?.status !== "PASS") errors.push("Audit status must be PASS.");
  if (audit?.failedFileCount !== 0) errors.push("Failed file count must be zero.");
  if (audit?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real binary output must be blocked.");
  if (audit?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (audit?.safety?.realBinaryBlocked !== true) errors.push("Safety must block real binary.");

  return { ok: errors.length === 0, errors };
}
