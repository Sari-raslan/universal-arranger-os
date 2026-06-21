import fs from "node:fs";

export const UAOS_PHASE63_VERSION = "63.0.0";

export const YAMAHA_PHASE63_REQUIRED_FILES = [
  "generated/real-exporter/yamaha-sty/yamaha-sty-writer-research-plan.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-intermediate-schema.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-phrase-event-schema.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-safe-container-plan.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-export-readiness-gate.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-export-readiness-summary.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_EXPORT_PACKAGE.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_EXPORT_PACKAGE_SUMMARY.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_PACKAGE.uaosbin",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_UAOSBIN_PACKAGE.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_SAFE_UAOSBIN_SUMMARY.json"
];

function safeReadJson(file) {
  if (!fs.existsSync(file)) {
    return { exists: false, data: null, error: "missing" };
  }

  if (file.toLowerCase().endsWith(".uaosbin")) {
    const bytes = fs.readFileSync(file);
    return {
      exists: true,
      data: {
        byteLength: bytes.length,
        magic: bytes.subarray(0, 8).toString("utf8")
      },
      error: null
    };
  }

  try {
    return {
      exists: true,
      data: JSON.parse(fs.readFileSync(file, "utf8")),
      error: null
    };
  } catch (error) {
    return {
      exists: true,
      data: null,
      error: String(error?.message || error)
    };
  }
}

function hasUnsafeRealStyClaim(data) {
  if (!data || typeof data !== "object") return false;

  const directUnsafe =
    data.realStyWriterReady === true ||
    data.realKeyboardBinaryWriteAllowed === true ||
    data.allowRealStyOutput === true ||
    data.canExportRealSty === true ||
    data.binaryContainerReady === true;

  const nestedUnsafe =
    data?.finalDecision?.allowRealStyOutput === true ||
    data?.finalDecision?.canExportRealSty === true ||
    data?.readiness?.canGenerateRealStyNow === true ||
    data?.payload?.realStyWriterReady === true ||
    data?.payload?.realKeyboardBinaryWriteAllowed === true;

  return Boolean(directUnsafe || nestedUnsafe);
}

export function createYamahaStySafePackageQaGate(requiredFiles = YAMAHA_PHASE63_REQUIRED_FILES) {
  const checks = requiredFiles.map((file) => {
    const read = safeReadJson(file);
    const isUaosbin = file.toLowerCase().endsWith(".uaosbin");

    return {
      file,
      exists: read.exists,
      type: isUaosbin ? "uaosbin" : "json",
      ok: read.exists && !read.error && (isUaosbin ? read.data.magic === "UAOSBIN1" : !hasUnsafeRealStyClaim(read.data)),
      error: read.error,
      format: read.data?.format || null,
      magic: read.data?.magic || null,
      byteLength: read.data?.byteLength || null,
      unsafeRealStyClaim: isUaosbin ? false : hasUnsafeRealStyClaim(read.data)
    };
  });

  const missing = checks.filter((x) => !x.exists).map((x) => x.file);
  const unsafe = checks.filter((x) => x.unsafeRealStyClaim).map((x) => x.file);
  const badUaosbin = checks.filter((x) => x.type === "uaosbin" && x.magic !== "UAOSBIN1").map((x) => x.file);
  const failed = checks.filter((x) => !x.ok).map((x) => x.file);

  return {
    format: "UAOS_YAMAHA_STY_SAFE_PACKAGE_QA_GATE",
    version: UAOS_PHASE63_VERSION,
    phase: 63,
    target: "yamaha",
    futureFormat: ".STY",

    requiredFileCount: requiredFiles.length,
    passedFileCount: checks.filter((x) => x.ok).length,
    failedFileCount: failed.length,
    checks,

    qa: {
      status: failed.length === 0 ? "PASS" : "FAIL",
      missing,
      unsafe,
      badUaosbin,
      failed
    },

    finalDecision: {
      safePackageQaPass: failed.length === 0,
      allowSafeJsonPackage: failed.length === 0,
      allowSafeUaosbinPackage: failed.length === 0,
      allowRealStyOutput: false,
      canExportRealSty: false,
      reason: "Phase 63 validates the safe package only. Real .STY output remains blocked."
    },

    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,

    safety: {
      realBinaryBlocked: true,
      warning: "QA gate validates safe JSON/UAOSBIN artifacts only. It does not permit Yamaha .STY output."
    }
  };
}

export function validateYamahaStySafePackageQaGate(gate) {
  const errors = [];

  if (gate?.format !== "UAOS_YAMAHA_STY_SAFE_PACKAGE_QA_GATE") errors.push("Invalid QA gate format.");
  if (gate?.target !== "yamaha") errors.push("Target must be yamaha.");
  if (gate?.futureFormat !== ".STY") errors.push("Future format must be .STY.");
  if (gate?.realStyWriterReady !== false) errors.push("Must not claim real STY writer ready.");
  if (gate?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must remain blocked.");
  if (gate?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (gate?.finalDecision?.canExportRealSty !== false) errors.push("canExportRealSty must be false.");
  if (gate?.safety?.realBinaryBlocked !== true) errors.push("Safety realBinaryBlocked must be true.");
  if (!Array.isArray(gate?.checks) || gate.checks.length === 0) errors.push("Missing checks.");
  if (gate?.qa?.status !== "PASS") errors.push("QA status must be PASS.");

  return { ok: errors.length === 0, errors };
}
