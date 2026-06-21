import fs from "node:fs";

export const UAOS_PHASE61_VERSION = "61.0.0";

export const YAMAHA_SAFE_PACKAGE_INPUTS = [
  "generated/real-exporter/yamaha-sty/yamaha-sty-writer-research-plan.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-intermediate-schema.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-phrase-event-schema.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-safe-container-plan.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-export-readiness-gate.json",
  "generated/real-exporter/yamaha-sty/yamaha-sty-export-readiness-summary.json"
];

export function readJsonFile(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing package input: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function createYamahaStySafeExportPackage(inputFiles = YAMAHA_SAFE_PACKAGE_INPUTS) {
  const items = inputFiles.map((file) => ({
    file,
    data: readJsonFile(file)
  }));

  for (const item of items) {
    const data = item.data;
    if (
      data.realStyWriterReady === true ||
      data.realKeyboardBinaryWriteAllowed === true ||
      data.allowRealStyOutput === true ||
      data?.finalDecision?.allowRealStyOutput === true
    ) {
      throw new Error(`Unsafe real STY permission found in ${item.file}`);
    }
  }

  return {
    format: "UAOS_YAMAHA_STY_SAFE_EXPORT_PACKAGE",
    version: UAOS_PHASE61_VERSION,
    phase: 61,
    target: "yamaha",
    futureFormat: ".STY",

    packageType: "SAFE_JSON_EXPORT_PACKAGE",
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    allowRealStyOutput: false,
    allowJsonOutput: true,
    allowUaosbinOutput: true,

    inputs: items.map((item) => ({
      file: item.file,
      format: item.data.format || "unknown",
      version: item.data.version || "unknown"
    })),

    artifacts: {
      researchPlan: items[0].data,
      intermediateSchema: items[1].data,
      phraseEventSchema: items[2].data,
      safeContainerPlan: items[3].data,
      readinessGate: items[4].data,
      readinessSummary: items[5].data
    },

    finalDecision: {
      status: "SAFE_PACKAGE_READY_REAL_STY_BLOCKED",
      canExportSafeJsonPackage: true,
      canExportSafeUaosbinPackage: true,
      canExportRealSty: false,
      reason: "Safe Yamaha pipeline package is ready, but real .STY binary validation is still incomplete."
    },

    safety: {
      realBinaryBlocked: true,
      warning: "Phase 61 produces only a safe export package. It must not generate a Yamaha .STY binary."
    }
  };
}

export function validateYamahaStySafeExportPackage(pkg) {
  const errors = [];

  if (pkg?.format !== "UAOS_YAMAHA_STY_SAFE_EXPORT_PACKAGE") errors.push("Invalid package format.");
  if (pkg?.target !== "yamaha") errors.push("Target must be yamaha.");
  if (pkg?.futureFormat !== ".STY") errors.push("Future format must be .STY.");
  if (pkg?.realStyWriterReady !== false) errors.push("Must not claim real STY writer ready.");
  if (pkg?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must remain blocked.");
  if (pkg?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (pkg?.allowJsonOutput !== true) errors.push("JSON output should be allowed.");
  if (pkg?.allowUaosbinOutput !== true) errors.push("UAOSBIN output should be allowed.");
  if (!pkg?.inputs?.length) errors.push("Missing package inputs.");
  if (!pkg?.artifacts?.readinessGate) errors.push("Missing readiness gate artifact.");
  if (pkg?.finalDecision?.canExportRealSty !== false) errors.push("Final decision must block real STY export.");
  if (pkg?.safety?.realBinaryBlocked !== true) errors.push("Safety realBinaryBlocked must be true.");

  return { ok: errors.length === 0, errors };
}
