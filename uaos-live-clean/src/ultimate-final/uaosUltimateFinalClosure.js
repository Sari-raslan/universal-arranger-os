import fs from "node:fs";

export const UAOS_PHASE93_100_VERSION = "93-100.0.0";

export const ULTIMATE_REQUIRED_FILES = [
  "generated/final-closure/UAOS_FINAL_CLOSURE_PACK.json",
  "generated/final-closure/UAOS_FINAL_CLOSURE_SUMMARY.json",
  "generated/final-closure/UAOS_HANDOVER_FINAL.md",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_SAFE_RELEASE_MANIFEST.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_COMPATIBILITY_MATRIX.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_NEXT_ROADMAP.json",
  "generated/real-exporter/final-release/UAOS_REAL_EXPORTER_SAFE_FINAL_AUDIT.json",
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_MASTER_SAFE_INDEX.json",
  "generated/real-exporter/final-safe/UAOS_REAL_EXPORTER_FINAL_QA_GATE.json",
  "generated/real-exporter/yamaha-sty/package/UAOS_YAMAHA_STY_TRACK_FINAL_LOCAL_GATE_SUMMARY.json",
  "generated/real-exporter/device-tracks/korg-safe-track.json",
  "generated/real-exporter/device-tracks/roland-safe-track.json",
  "generated/real-exporter/device-tracks/ketron-safe-track.json"
];

function readFileSafe(file) {
  if (!fs.existsSync(file)) {
    return {
      file,
      exists: false,
      ok: false,
      type: file.endsWith(".md") ? "markdown" : "json",
      error: "missing"
    };
  }

  if (file.endsWith(".md")) {
    const text = fs.readFileSync(file, "utf8");
    return {
      file,
      exists: true,
      ok: text.length > 20,
      type: "markdown",
      size: text.length,
      error: text.length > 20 ? null : "markdown too small"
    };
  }

  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));

    const unsafe = Boolean(
      data.realKeyboardBinaryWriteAllowed === true ||
      data.realWriterReady === true ||
      data.realBinaryReady === true ||
      data.realStyWriterReady === true ||
      data.allowRealKeyboardBinaryOutput === true ||
      data.allowRealStyOutput === true ||
      data.canExportRealSty === true ||
      data.canExportRealKeyboardBinary === true ||
      data.realBinaryOutputAllowed === true ||
      data?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
      data?.finalDecision?.realBinaryOutputAllowed === true ||
      data?.finalDecision?.allowRealStyOutput === true ||
      data?.finalDecision?.canExportRealSty === true ||
      data?.finalDecision?.canExportRealKeyboardBinary === true
    );

    return {
      file,
      exists: true,
      ok: !unsafe,
      type: "json",
      format: data.format || "unknown",
      target: data.target || "global",
      unsafeRealBinaryClaim: unsafe,
      error: unsafe ? "unsafe real binary claim" : null
    };
  } catch (error) {
    return {
      file,
      exists: true,
      ok: false,
      type: "json",
      error: String(error?.message || error)
    };
  }
}

export function createUaosUltimateFinalClosure() {
  const checks = ULTIMATE_REQUIRED_FILES.map(readFileSafe);
  const failed = checks.filter((item) => !item.ok);

  return {
    format: "UAOS_ULTIMATE_FINAL_CLOSURE",
    version: UAOS_PHASE93_100_VERSION,
    phases: "93-100",
    status: failed.length === 0 ? "PASS" : "FAIL",

    project: {
      name: "UAOS",
      localPackage: "Ultimate Final Closure",
      localStatus: "FINAL_SAFE_FOUNDATION_CLOSED_AND_PUSH_READY",
      productionStatus: "NOT_DEPLOYED_BY_THIS_SCRIPT",
      realKeyboardBinaryStatus: "BLOCKED_UNTIL_VALIDATED_WRITER_PROGRAM"
    },

    completed: [
      "Phase 93 Ultimate Artifact Inventory",
      "Phase 94 Ultimate Safety Review",
      "Phase 95 Ultimate Handover Index",
      "Phase 96 Ultimate Status Page",
      "Phase 97 Ultimate Final QA",
      "Phase 98 Ultimate Build Gate",
      "Phase 99 Ultimate Local Commit",
      "Phase 100 Ultimate Safe Push"
    ],

    artifactChecks: checks,

    finalDecision: {
      ultimateFinalClosurePass: failed.length === 0,
      allowSafeJsonPackage: true,
      allowSafeUaosbinPackage: true,
      allowRealKeyboardBinaryOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false,
      noDeploy: true,
      reason: "UAOS safe foundation is closed and safe-push ready. Real keyboard binary output remains blocked."
    },

    nextProgram: {
      name: "Real Keyboard Binary Writer Validation Program",
      recommendedFirstTarget: "Yamaha .STY",
      requiredBeforeStart: [
        "collect user-owned legal fixtures",
        "build read-only binary analyzer",
        "validate chunk/container rules",
        "validate checksum/package rules",
        "roundtrip import test",
        "hardware/editor validation"
      ]
    },

    safety: {
      realBinaryBlocked: true,
      allowedFormats: [".json", ".uaosbin"],
      blockedFormats: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
      warning: "Ultimate final closure does not permit proprietary keyboard binary export."
    }
  };
}

export function validateUaosUltimateFinalClosure(pack) {
  const errors = [];

  if (pack?.format !== "UAOS_ULTIMATE_FINAL_CLOSURE") errors.push("Invalid ultimate final closure format.");
  if (pack?.status !== "PASS") errors.push("Ultimate final closure status must be PASS.");
  if (pack?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (pack?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (pack?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (pack?.finalDecision?.noDeploy !== true) errors.push("No deploy flag must be true.");
  if (pack?.safety?.realBinaryBlocked !== true) errors.push("Safety must block real binary.");
  if (!pack?.artifactChecks?.length) errors.push("Missing artifact checks.");

  return { ok: errors.length === 0, errors };
}
