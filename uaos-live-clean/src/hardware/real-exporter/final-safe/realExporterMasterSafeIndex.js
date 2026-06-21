import fs from "node:fs";

export const UAOS_PHASE67_VERSION = "67.0.0";

export const MASTER_SAFE_INPUTS = [
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_TRACK_FINAL_LOCAL_GATE_SUMMARY.json",
  "generated/real-exporter/device-tracks/korg-safe-track.json",
  "generated/real-exporter/device-tracks/roland-safe-track.json",
  "generated/real-exporter/device-tracks/ketron-safe-track.json"
];

function readMaybeJson(file) {
  if (!fs.existsSync(file)) {
    return { file, exists: false, data: null };
  }
  return {
    file,
    exists: true,
    data: JSON.parse(fs.readFileSync(file, "utf8"))
  };
}

function unsafeClaim(data) {
  if (!data || typeof data !== "object") return false;
  return Boolean(
    data.realStyWriterReady === true ||
    data.realKeyboardBinaryWriteAllowed === true ||
    data.realWriterReady === true ||
    data.allowRealStyOutput === true ||
    data.allowRealBinaryOutput === true ||
    data.canExportRealSty === true ||
    data.canExportRealKeyboardBinary === true ||
    data?.finalDecision?.allowRealStyOutput === true ||
    data?.finalDecision?.canExportRealSty === true ||
    data?.finalDecision?.canExportRealKeyboardBinary === true
  );
}

export function createRealExporterMasterSafeIndex(inputFiles = MASTER_SAFE_INPUTS) {
  const entries = inputFiles.map(readMaybeJson);
  const missing = entries.filter((x) => !x.exists).map((x) => x.file);
  const unsafe = entries.filter((x) => unsafeClaim(x.data)).map((x) => x.file);

  return {
    format: "UAOS_REAL_EXPORTER_MASTER_SAFE_INDEX",
    version: UAOS_PHASE67_VERSION,
    phase: 67,
    inputCount: inputFiles.length,
    entries: entries.map((entry) => ({
      file: entry.file,
      exists: entry.exists,
      format: entry.data?.format || "unknown",
      target: entry.data?.target || "unknown",
      futureFormat: entry.data?.futureFormat || null,
      futureFormats: entry.data?.futureFormats || null,
      unsafeRealBinaryClaim: unsafeClaim(entry.data)
    })),
    qa: {
      status: missing.length === 0 && unsafe.length === 0 ? "PASS" : "FAIL",
      missing,
      unsafe
    },
    finalDecision: {
      safeFoundationReady: missing.length === 0 && unsafe.length === 0,
      allowSafeJsonPackage: true,
      allowSafeUaosbinPackage: true,
      allowRealKeyboardBinaryOutput: false,
      reason: "Master index closes the safe foundation only. Real keyboard binary writers remain blocked."
    },
    realKeyboardBinaryWriteAllowed: false,
    realWriterReady: false,
    safety: {
      realBinaryBlocked: true,
      warning: "This master index does not permit .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST output."
    }
  };
}

export function validateRealExporterMasterSafeIndex(index) {
  const errors = [];

  if (index?.format !== "UAOS_REAL_EXPORTER_MASTER_SAFE_INDEX") errors.push("Invalid master index format.");
  if (index?.qa?.status !== "PASS") errors.push("Master index QA must be PASS.");
  if (index?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (index?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (index?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (index?.safety?.realBinaryBlocked !== true) errors.push("Safety must block real binary.");
  if (!index?.entries?.length) errors.push("Missing entries.");

  return { ok: errors.length === 0, errors };
}
