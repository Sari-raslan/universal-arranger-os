import fs from "node:fs";

export const UAOS_R61_R70_VERSION = "R61-R70.0.0";

export const REQUIRED_FINAL_BASELINE_FILES = [
  "generated/real-writer-validation/r1-fixtures/UAOS_R1_FIXTURE_COLLECTION_SUMMARY.json",
  "generated/real-writer-validation/r2-r6/UAOS_R2_R6_VALIDATION_PROGRAM_SUMMARY.json",
  "generated/real-writer-validation/final/UAOS_REAL_WRITER_VALIDATION_FINAL_SUMMARY.json",
  "generated/real-writer-validation/r11-r20/UAOS_R11_R20_TARGETED_FIXTURE_VALIDATION_SUMMARY.json",
  "generated/real-writer-validation/r21-r30/UAOS_R21_R30_YAMAHA_PARSER_SANDBOX_SUMMARY.json",
  "generated/real-writer-validation/r31-r40/UAOS_R31_R40_YAMAHA_PARSER_PLANNING_SUMMARY.json",
  "generated/real-writer-validation/r41-r50/UAOS_R41_R50_YAMAHA_UNLOCK_REQUIREMENTS_SUMMARY.json",
  "generated/real-writer-validation/r51-r60/UAOS_R51_R60_YAMAHA_VALIDATION_MASTER_GATE_SUMMARY.json",
  "generated/real-writer-validation/r51-r60/UAOS_REAL_WRITER_VALIDATION_SAFE_BASELINE_HANDOVER.md"
];

function exists(file) {
  try { return fs.existsSync(file); } catch { return false; }
}

function readJsonSafe(file) {
  if (!exists(file)) {
    return { file, exists: false, ok: false, error: "missing" };
  }

  if (file.endsWith(".md")) {
    const text = fs.readFileSync(file, "utf8");
    return {
      file,
      exists: true,
      ok: text.includes("SAFE_BASELINE_CLOSED") && text.includes("Blocked"),
      type: "markdown",
      error: null
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
      json.deployAllowed === true ||
      json.wroteRealKeyboardBinary === true ||
      json.wroteRealSty === true ||
      json?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
      json?.finalDecision?.allowRealStyOutput === true ||
      json?.finalDecision?.canExportRealSty === true ||
      json?.finalDecision?.allowFullBinaryParse === true ||
      json?.finalDecision?.allowParserImplementation === true ||
      json?.finalDecision?.allowWriterImplementation === true ||
      json?.finalDecision?.continueToWriterImplementation === true ||
      json?.finalDecision?.writerUnlockReady === true ||
      json?.finalDecision?.deployAllowed === true
    );

    return {
      file,
      exists: true,
      ok: !unsafe,
      type: "json",
      format: json.format || "unknown",
      status: json.status || "unknown",
      unsafeWriterClaim: unsafe,
      error: unsafe ? "unsafe writer/parser/deploy permission" : null
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

export function createR61FinalClosureAudit() {
  const checks = REQUIRED_FINAL_BASELINE_FILES.map(readJsonSafe);
  const failed = checks.filter(item => !item.ok);

  return {
    format: "UAOS_R61_FINAL_CLOSURE_AUDIT",
    version: UAOS_R61_R70_VERSION,
    phase: "R61",
    status: failed.length === 0 ? "PASS" : "FAIL",
    requiredCount: checks.length,
    passedCount: checks.filter(item => item.ok).length,
    failedCount: failed.length,
    checks,
    finalDecision: {
      finalClosureAuditPass: failed.length === 0,
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
      noDeploy: true,
      readOnlyBaseline: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createR62MasterHandoverPack(r61) {
  return {
    format: "UAOS_R62_MASTER_HANDOVER_PACK",
    version: UAOS_R61_R70_VERSION,
    phase: "R62",
    status: "PASS",
    handoverTitle: "UAOS Real Keyboard Binary Writer Validation Program - Final Closure",
    currentStatus: "SAFE_BASELINE_CLOSED",
    targetPriority: "Yamaha .STY first",
    completedBlocks: [
      "R1 fixture collector",
      "R2-R6 binary validation",
      "R7-R10 final validation safe push",
      "R11-R20 targeted fixture validation",
      "R21-R30 Yamaha parser sandbox",
      "R31-R40 parser planning gates",
      "R41-R50 writer unlock requirements",
      "R51-R60 validation master gate",
      "R61-R70 final closure"
    ],
    safeCapabilities: [
      "fixture metadata indexing",
      "small-prefix read-only analysis",
      "safe marker probing",
      "safe structure hypotheses",
      "parser planning gates",
      "writer unlock requirements documentation",
      "final audit and dashboard"
    ],
    blockedCapabilities: [
      "real .STY writing",
      "real .SET writing",
      "real .PRS writing",
      "real .STL writing",
      "real .PAT/.MSP/.KST writing",
      "full binary parse",
      "parser implementation claim",
      "writer implementation claim",
      "fixture modification",
      "public deploy"
    ],
    finalDecision: {
      handoverReady: r61.status === "PASS",
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false,
      deployAllowed: false
    },
    safety: {
      localOnly: true,
      noDeploy: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createR63FinalSafetyCertificate(r61, r62) {
  return {
    format: "UAOS_R63_FINAL_SAFETY_CERTIFICATE",
    version: UAOS_R61_R70_VERSION,
    phase: "R63",
    status: "PASS",
    certificate: {
      project: "UAOS Real Writer Validation",
      state: "SAFE_BASELINE_ONLY",
      writerState: "LOCKED",
      parserState: "PLANNING_ONLY",
      publicDeployState: "BLOCKED_BY_THIS_PROGRAM"
    },
    certifiedFalseClaims: [
      "real writer ready",
      "real .STY export ready",
      "full binary parser ready",
      "hardware validated",
      "editor validated",
      "production deployed"
    ],
    finalDecision: {
      safetyCertificateReady: r61.status === "PASS" && r62.status === "PASS",
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
      noDeploy: true,
      readOnlyBaseline: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createR64NextWorkRoadmap(r63) {
  return {
    format: "UAOS_R64_NEXT_WORK_ROADMAP",
    version: UAOS_R61_R70_VERSION,
    phase: "R64",
    status: "PASS",
    nextProgram: "Manual Approved Yamaha Parser Design",
    nextPhases: [
      {
        id: "Y1",
        name: "manual select 3-5 user-owned Yamaha .STY fixtures",
        allowed: true,
        writesBinary: false
      },
      {
        id: "Y2",
        name: "explicit approval record for full read-only parse",
        allowed: true,
        writesBinary: false
      },
      {
        id: "Y3",
        name: "read-only parser skeleton",
        allowed: false,
        reason: "requires Y1/Y2 approval"
      },
      {
        id: "Y4",
        name: "semantic parse report",
        allowed: false,
        reason: "requires parser skeleton and validation"
      },
      {
        id: "Y5",
        name: "roundtrip semantic validator",
        allowed: false,
        reason: "requires semantic parse report"
      },
      {
        id: "Y6",
        name: "experimental writer sandbox",
        allowed: false,
        reason: "requires parser, checksum, editor and hardware validation"
      }
    ],
    finalDecision: {
      roadmapReady: true,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createR65FinalDashboardData(r61, r62, r63, r64) {
  return {
    format: "UAOS_R65_FINAL_DASHBOARD_DATA",
    version: UAOS_R61_R70_VERSION,
    phase: "R65",
    status: "PASS",
    dashboard: {
      title: "UAOS Real Writer Validation Final Dashboard",
      finalStatus: "SAFE_BASELINE_CLOSED",
      target: "Yamaha .STY first",
      cards: [
        { title: "Baseline", value: "Closed", state: "pass" },
        { title: "Parser", value: "Planning only", state: "warn" },
        { title: "Writer", value: "Locked", state: "warn" },
        { title: "Deploy", value: "Not executed", state: "warn" }
      ]
    },
    finalDecision: {
      dashboardReady: true,
      allowRealKeyboardBinaryOutput: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false,
      deployAllowed: false
    },
    safety: {
      noDeploy: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function runR61R70FinalClosure() {
  const r61 = createR61FinalClosureAudit();
  const r62 = createR62MasterHandoverPack(r61);
  const r63 = createR63FinalSafetyCertificate(r61, r62);
  const r64 = createR64NextWorkRoadmap(r63);
  const r65 = createR65FinalDashboardData(r61, r62, r63, r64);

  return {
    format: "UAOS_R61_R70_REAL_WRITER_VALIDATION_FINAL_CLOSURE",
    version: UAOS_R61_R70_VERSION,
    phases: ["R61", "R62", "R63", "R64", "R65", "R66", "R67", "R68", "R69", "R70"],
    status: r61.status === "PASS" ? "PASS" : "FAIL",
    reports: { r61, r62, r63, r64, r65 },
    finalDecision: {
      finalClosureReady: r61.status === "PASS",
      safeBaselineClosed: true,
      targetPriority: "Yamaha .STY",
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

export function validateR61R70FinalClosure(report) {
  const errors = [];

  if (report?.format !== "UAOS_R61_R70_REAL_WRITER_VALIDATION_FINAL_CLOSURE") errors.push("Invalid report format.");
  if (report?.status !== "PASS") errors.push("Status must be PASS.");
  if (report?.finalDecision?.finalClosureReady !== true) errors.push("Final closure must be ready.");
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
  if (report?.safety?.noDeploy !== true) errors.push("No deploy flag must be true.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
