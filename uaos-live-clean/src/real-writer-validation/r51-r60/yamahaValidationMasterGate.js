import fs from "node:fs";

export const UAOS_R51_R60_VERSION = "R51-R60.0.0";

export const REQUIRED_SAFE_BASELINE_FILES = [
  "generated/real-writer-validation/r1-fixtures/UAOS_R1_FIXTURE_COLLECTION_SUMMARY.json",
  "generated/real-writer-validation/r2-r6/UAOS_R2_R6_VALIDATION_PROGRAM_SUMMARY.json",
  "generated/real-writer-validation/final/UAOS_REAL_WRITER_VALIDATION_FINAL_SUMMARY.json",
  "generated/real-writer-validation/r11-r20/UAOS_R11_R20_TARGETED_FIXTURE_VALIDATION_SUMMARY.json",
  "generated/real-writer-validation/r21-r30/UAOS_R21_R30_YAMAHA_PARSER_SANDBOX_SUMMARY.json",
  "generated/real-writer-validation/r31-r40/UAOS_R31_R40_YAMAHA_PARSER_PLANNING_SUMMARY.json",
  "generated/real-writer-validation/r41-r50/UAOS_R41_R50_YAMAHA_UNLOCK_REQUIREMENTS_SUMMARY.json"
];

function exists(file) {
  try { return fs.existsSync(file); } catch { return false; }
}

function readJsonSafe(file) {
  if (!exists(file)) {
    return {
      file,
      exists: false,
      ok: false,
      error: "missing"
    };
  }

  try {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));

    const unsafe = Boolean(
      json.realKeyboardBinaryWriteAllowed === true ||
      json.realWriterReady === true ||
      json.realBinaryReady === true ||
      json.realStyWriterReady === true ||
      json.writerUnlockReady === true ||
      json.allowRealKeyboardBinaryOutput === true ||
      json.allowRealStyOutput === true ||
      json.canExportRealSty === true ||
      json.canExportRealKeyboardBinary === true ||
      json.allowFullBinaryParse === true ||
      json.allowParserImplementation === true ||
      json.allowWriterImplementation === true ||
      json.wroteRealKeyboardBinary === true ||
      json.wroteRealSty === true ||
      json?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
      json?.finalDecision?.allowRealStyOutput === true ||
      json?.finalDecision?.canExportRealSty === true ||
      json?.finalDecision?.allowFullBinaryParse === true ||
      json?.finalDecision?.allowParserImplementation === true ||
      json?.finalDecision?.allowWriterImplementation === true ||
      json?.finalDecision?.continueToWriterImplementation === true ||
      json?.finalDecision?.writerUnlockReady === true
    );

    return {
      file,
      exists: true,
      ok: !unsafe,
      format: json.format || "unknown",
      status: json.status || "unknown",
      unsafeWriterClaim: unsafe,
      error: unsafe ? "unsafe writer/parser permission" : null
    };
  } catch (error) {
    return {
      file,
      exists: true,
      ok: false,
      error: String(error?.message || error)
    };
  }
}

export function createR51RealWriterValidationMasterGate() {
  const checks = REQUIRED_SAFE_BASELINE_FILES.map(readJsonSafe);
  const failed = checks.filter(item => !item.ok);

  return {
    format: "UAOS_R51_REAL_WRITER_VALIDATION_MASTER_GATE",
    version: UAOS_R51_R60_VERSION,
    phase: "R51",
    status: failed.length === 0 ? "PASS" : "FAIL",
    requiredFileCount: checks.length,
    passedFileCount: checks.filter(item => item.ok).length,
    failedFileCount: failed.length,
    checks,
    finalDecision: {
      safeValidationBaselineReady: failed.length === 0,
      allowReadOnlyAnalysis: true,
      allowMetadataIndexing: true,
      allowSafeJsonReports: true,
      allowParserImplementation: false,
      allowFullBinaryParse: false,
      allowWriterImplementation: false,
      allowRealKeyboardBinaryOutput: false,
      allowRealStyOutput: false,
      canExportRealSty: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      readOnlyBaseline: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createR52YamahaValidationMasterIndex(r51) {
  return {
    format: "UAOS_R52_YAMAHA_VALIDATION_MASTER_INDEX",
    version: UAOS_R51_R60_VERSION,
    phase: "R52",
    status: "PASS",
    target: "yamaha",
    futureFormat: ".STY",
    baselineFiles: REQUIRED_SAFE_BASELINE_FILES,
    baselineStatus: r51.status,
    completedProgramBlocks: [
      "R1 fixture collector",
      "R2-R6 read-only validation",
      "R7-R10 final validation push",
      "R11-R20 targeted fixture validation",
      "R21-R30 Yamaha parser sandbox",
      "R31-R40 parser planning gates",
      "R41-R50 unlock requirements"
    ],
    notCompleted: [
      "full binary parser",
      "confirmed Yamaha chunk map",
      "confirmed CASM-like rules",
      "confirmed OTS metadata rules",
      "confirmed checksum/package writer",
      "semantic roundtrip pass",
      "editor validation",
      "hardware validation",
      "real .STY writer"
    ],
    finalDecision: {
      masterIndexReady: true,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      readOnly: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createR53WriterUnlockAudit(r52) {
  const requirements = [
    "approved fixture set with explicit full-parse permission",
    "full read-only parser",
    "confirmed chunk offsets and lengths",
    "confirmed section table",
    "confirmed CASM-like rules",
    "confirmed OTS metadata rules",
    "confirmed checksum/package rules",
    "semantic model roundtrip",
    "binary candidate sandbox",
    "Yamaha editor import pass",
    "Yamaha hardware import pass",
    "manual explicit writer approval"
  ];

  return {
    format: "UAOS_R53_WRITER_UNLOCK_AUDIT",
    version: UAOS_R51_R60_VERSION,
    phase: "R53",
    status: "PASS_LOCKED",
    target: "yamaha",
    futureFormat: ".STY",
    requirements: requirements.map(item => ({
      requirement: item,
      complete: false,
      blocksWriter: true
    })),
    completeCount: 0,
    blockerCount: requirements.length,
    finalDecision: {
      writerUnlockReady: false,
      continueToWriterImplementation: false,
      allowParserImplementation: false,
      allowFullBinaryParse: false,
      allowWriterImplementation: false,
      allowRealKeyboardBinaryOutput: false,
      allowRealStyOutput: false,
      canExportRealSty: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createR54SafeBaselineReleaseManifest(r51, r52, r53) {
  return {
    format: "UAOS_R54_SAFE_BASELINE_RELEASE_MANIFEST",
    version: UAOS_R51_R60_VERSION,
    phase: "R54",
    status: "PASS",
    releaseName: "UAOS Real Writer Validation Safe Baseline",
    releaseType: "LOCAL_SAFE_BASELINE_ONLY",
    includes: [
      "fixture metadata collector",
      "read-only header analyzer",
      "Yamaha candidate classifier",
      "parser sandbox reports",
      "parser planning gates",
      "writer unlock requirements",
      "master validation gate"
    ],
    excludes: [
      "real .STY writer",
      "real .SET writer",
      "real .PRS writer",
      "real .STL writer",
      "real .PAT/.MSP/.KST writer",
      "full binary parser",
      "fixture file copies"
    ],
    finalDecision: {
      safeBaselineReady: r51.status === "PASS" && r52.status === "PASS" && r53.status === "PASS_LOCKED",
      releasePublicly: false,
      deployAllowed: false,
      allowRealKeyboardBinaryOutput: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      localOnly: true,
      noDeploy: true,
      readOnlyBaseline: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createR55FinalHandover(r54) {
  return {
    format: "UAOS_R55_REAL_WRITER_VALIDATION_HANDOVER",
    version: UAOS_R51_R60_VERSION,
    phase: "R55",
    status: "PASS",
    handover: {
      currentStatus: "SAFE_BASELINE_READY",
      target: "Yamaha .STY first",
      safeCapabilities: [
        "metadata-only fixture indexing",
        "small-prefix read-only analysis",
        "Yamaha candidate classification",
        "marker probing",
        "safe structure hypotheses",
        "unlock requirement documentation"
      ],
      blockedCapabilities: [
        "real .STY writing",
        "full binary parsing",
        "fixture modification",
        "fixture publishing",
        "claiming writer ready"
      ],
      nextRealWork: [
        "manual fixture approval",
        "read-only full parser design",
        "confirmed chunk map",
        "roundtrip validation",
        "editor/hardware validation"
      ]
    },
    finalDecision: {
      handoverReady: true,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      readOnly: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function runR51R60YamahaValidationMasterGate() {
  const r51 = createR51RealWriterValidationMasterGate();
  const r52 = createR52YamahaValidationMasterIndex(r51);
  const r53 = createR53WriterUnlockAudit(r52);
  const r54 = createR54SafeBaselineReleaseManifest(r51, r52, r53);
  const r55 = createR55FinalHandover(r54);

  return {
    format: "UAOS_R51_R60_YAMAHA_VALIDATION_MASTER_GATE_REPORT",
    version: UAOS_R51_R60_VERSION,
    phases: ["R51", "R52", "R53", "R54", "R55", "R56", "R57", "R58", "R59", "R60"],
    status: r51.status === "PASS" ? "PASS" : "FAIL",
    reports: { r51, r52, r53, r54, r55 },
    finalDecision: {
      safeBaselineClosed: r51.status === "PASS",
      allowReadOnlyAnalysis: true,
      allowParserImplementation: false,
      allowFullBinaryParse: false,
      allowWriterImplementation: false,
      allowRealKeyboardBinaryOutput: false,
      allowRealStyOutput: false,
      canExportRealSty: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false,
      deployAllowed: false
    },
    safety: {
      localOnly: true,
      noDeploy: true,
      readOnlyBaseline: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function validateR51R60YamahaValidationMasterGate(report) {
  const errors = [];

  if (report?.format !== "UAOS_R51_R60_YAMAHA_VALIDATION_MASTER_GATE_REPORT") errors.push("Invalid report format.");
  if (report?.status !== "PASS") errors.push("Status must be PASS.");
  if (report?.finalDecision?.safeBaselineClosed !== true) errors.push("Safe baseline must be closed.");
  if (report?.finalDecision?.allowParserImplementation !== false) errors.push("Parser implementation must remain blocked.");
  if (report?.finalDecision?.allowFullBinaryParse !== false) errors.push("Full binary parse must remain blocked.");
  if (report?.finalDecision?.allowWriterImplementation !== false) errors.push("Writer implementation must remain blocked.");
  if (report?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (report?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (report?.finalDecision?.canExportRealSty !== false) errors.push("canExportRealSty must be false.");
  if (report?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (report?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (report?.finalDecision?.deployAllowed !== false) errors.push("Deploy must be blocked.");
  if (report?.reports?.r53?.finalDecision?.continueToWriterImplementation !== false) errors.push("R53 must block writer implementation.");
  if (report?.safety?.noDeploy !== true) errors.push("No deploy flag must be true.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
