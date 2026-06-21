import fs from "node:fs";

export const UAOS_R31_R40_VERSION = "R31-R40.0.0";

function exists(file) {
  try { return fs.existsSync(file); } catch { return false; }
}

function readJson(file) {
  if (!exists(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function unsafeWriterClaim(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Boolean(
    obj.realKeyboardBinaryWriteAllowed === true ||
    obj.realWriterReady === true ||
    obj.realBinaryReady === true ||
    obj.realStyWriterReady === true ||
    obj.allowRealKeyboardBinaryOutput === true ||
    obj.allowRealStyOutput === true ||
    obj.canExportRealSty === true ||
    obj.canExportRealKeyboardBinary === true ||
    obj.allowFullBinaryParse === true ||
    obj.allowParserImplementation === true ||
    obj.allowWriterImplementation === true ||
    obj.wroteRealKeyboardBinary === true ||
    obj.wroteRealSty === true ||
    obj?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
    obj?.finalDecision?.allowRealStyOutput === true ||
    obj?.finalDecision?.canExportRealSty === true ||
    obj?.finalDecision?.allowFullBinaryParse === true ||
    obj?.finalDecision?.allowParserImplementation === true ||
    obj?.finalDecision?.allowWriterImplementation === true ||
    obj?.finalDecision?.continueToWriterImplementation === true
  );
}

export function loadR21R30Sandbox() {
  return readJson("generated/real-writer-validation/r21-r30/UAOS_R21_R30_YAMAHA_PARSER_SANDBOX_REPORT.json");
}

export function createR31ValidatedChunkParserPlan(input = {}) {
  const sandbox = input.sandbox || loadR21R30Sandbox();
  const sandboxReady = sandbox?.status === "PASS" && !unsafeWriterClaim(sandbox);

  return {
    format: "UAOS_R31_VALIDATED_CHUNK_PARSER_PLAN",
    version: UAOS_R31_R40_VERSION,
    phase: "R31",
    status: sandboxReady ? "PASS" : "PASS_EMPTY",
    target: "yamaha",
    futureFormat: ".STY",
    sourceSandboxReady: sandboxReady,
    parserPlan: {
      parserType: "READ_ONLY_VALIDATED_CHUNK_PARSER_PLAN",
      implementationAllowedNow: false,
      fullBinaryParseAllowedNow: false,
      plannedStages: [
        {
          id: "P1",
          name: "prefix scanner",
          allowed: true,
          writeOperation: false
        },
        {
          id: "P2",
          name: "marker index",
          allowed: true,
          writeOperation: false
        },
        {
          id: "P3",
          name: "confirmed chunk boundary reader",
          allowed: false,
          reason: "requires validated chunk boundaries"
        },
        {
          id: "P4",
          name: "semantic section parser",
          allowed: false,
          reason: "requires roundtrip validation"
        }
      ]
    },
    finalDecision: {
      allowParserImplementation: false,
      allowFullBinaryParse: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true,
      warning: "R31 plans parser stages only. It does not implement full binary parsing or writing."
    }
  };
}

export function createR32SectionTableModel(r31) {
  return {
    format: "UAOS_R32_YAMAHA_SECTION_TABLE_MODEL",
    version: UAOS_R31_R40_VERSION,
    phase: "R32",
    status: "PASS",
    target: "yamaha",
    futureFormat: ".STY",
    modelType: "SAFE_SECTION_TABLE_HYPOTHESIS",
    sections: [
      { slot: "INTRO_A", confirmed: false, writable: false },
      { slot: "INTRO_B", confirmed: false, writable: false },
      { slot: "INTRO_C", confirmed: false, writable: false },
      { slot: "MAIN_A", confirmed: false, writable: false },
      { slot: "MAIN_B", confirmed: false, writable: false },
      { slot: "MAIN_C", confirmed: false, writable: false },
      { slot: "MAIN_D", confirmed: false, writable: false },
      { slot: "FILL_A", confirmed: false, writable: false },
      { slot: "FILL_B", confirmed: false, writable: false },
      { slot: "FILL_C", confirmed: false, writable: false },
      { slot: "FILL_D", confirmed: false, writable: false },
      { slot: "ENDING_A", confirmed: false, writable: false },
      { slot: "ENDING_B", confirmed: false, writable: false },
      { slot: "ENDING_C", confirmed: false, writable: false }
    ],
    dependencies: {
      parserPlan: r31.format,
      parserImplementationAllowed: false
    },
    finalDecision: {
      sectionTableConfirmed: false,
      sectionWriterReady: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      hypothesisOnly: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createR33CasmRulesGate(r32) {
  return {
    format: "UAOS_R33_CASM_LIKE_RULES_RESEARCH_GATE",
    version: UAOS_R31_R40_VERSION,
    phase: "R33",
    status: "PASS_LOCKED",
    target: "yamaha",
    futureFormat: ".STY",
    casmLikeRules: {
      researched: false,
      confirmed: false,
      writable: false,
      ruleGroups: [
        { name: "chord recognition", confirmed: false },
        { name: "note transposition", confirmed: false },
        { name: "channel behavior", confirmed: false },
        { name: "section behavior", confirmed: false }
      ]
    },
    blockers: [
      "CASM-like behavior not validated",
      "no semantic parser",
      "no roundtrip import",
      "no editor/hardware validation"
    ],
    finalDecision: {
      casmRulesReady: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createR34OtsMetadataGate(r33) {
  return {
    format: "UAOS_R34_OTS_METADATA_RESEARCH_GATE",
    version: UAOS_R31_R40_VERSION,
    phase: "R34",
    status: "PASS_LOCKED",
    target: "yamaha",
    futureFormat: ".STY",
    otsMetadata: {
      researched: false,
      confirmed: false,
      writable: false,
      placeholders: [
        "voice/preset",
        "mix levels",
        "effects references",
        "keyboard split/layer behavior"
      ]
    },
    dependencies: {
      casmGate: r33.format,
      casmReady: false
    },
    finalDecision: {
      otsMetadataReady: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createR35ChecksumPackageRulePlan(r34) {
  return {
    format: "UAOS_R35_CHECKSUM_PACKAGE_RULE_PLAN",
    version: UAOS_R31_R40_VERSION,
    phase: "R35",
    status: "PASS_LOCKED",
    target: "yamaha",
    futureFormat: ".STY",
    checksumPlan: {
      checksumKnown: false,
      packageFooterKnown: false,
      validationHashOnly: true,
      writeChecksumAllowed: false,
      plannedValidation: [
        "compare user-owned fixture prefix hashes",
        "detect stable markers",
        "later compare full file hashes only after approval",
        "never infer checksum writer without validation"
      ]
    },
    finalDecision: {
      checksumWriterReady: false,
      packageWriterReady: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      readOnly: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createR36ParserImplementationReadinessGate(r31, r32, r33, r34, r35) {
  return {
    format: "UAOS_R36_PARSER_IMPLEMENTATION_READINESS_GATE",
    version: UAOS_R31_R40_VERSION,
    phase: "R36",
    status: "PASS_LOCKED",
    target: "yamaha",
    futureFormat: ".STY",
    readiness: {
      parserPlanReady: r31.status.startsWith("PASS"),
      sectionModelReady: r32.status === "PASS",
      casmRulesReady: false,
      otsMetadataReady: false,
      checksumRulesReady: false,
      parserImplementationAllowed: false,
      fullBinaryParseAllowed: false
    },
    blockers: [
      "CASM-like rules locked",
      "OTS metadata locked",
      "checksum/package rules locked",
      "section table unconfirmed",
      "roundtrip harness not semantic",
      "hardware/editor validation missing"
    ],
    finalDecision: {
      allowParserImplementation: false,
      allowFullBinaryParse: false,
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

export function createR37WriterRiskBlocker(r36) {
  return {
    format: "UAOS_R37_WRITER_RISK_BLOCKER",
    version: UAOS_R31_R40_VERSION,
    phase: "R37",
    status: "PASS_BLOCKED",
    target: "yamaha",
    futureFormat: ".STY",
    riskLevel: "VERY_HIGH_FOR_WRITER_UNTIL_VALIDATED",
    blockedActions: [
      "write Yamaha .STY",
      "rewrite user fixture",
      "copy fixture into repo",
      "publish fixture data",
      "claim parser ready",
      "claim writer ready"
    ],
    allowedActions: [
      "local read-only marker analysis",
      "safe JSON reports",
      "manual review",
      "fixture path selection with user approval"
    ],
    finalDecision: {
      continueToWriterImplementation: false,
      allowWriterImplementation: false,
      allowParserImplementation: false,
      allowFullBinaryParse: false,
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

export function runR31R40YamahaParserPlanning() {
  const r31 = createR31ValidatedChunkParserPlan();
  const r32 = createR32SectionTableModel(r31);
  const r33 = createR33CasmRulesGate(r32);
  const r34 = createR34OtsMetadataGate(r33);
  const r35 = createR35ChecksumPackageRulePlan(r34);
  const r36 = createR36ParserImplementationReadinessGate(r31, r32, r33, r34, r35);
  const r37 = createR37WriterRiskBlocker(r36);

  return {
    format: "UAOS_R31_R40_YAMAHA_PARSER_PLANNING_REPORT",
    version: UAOS_R31_R40_VERSION,
    phases: ["R31", "R32", "R33", "R34", "R35", "R36", "R37", "R38", "R39", "R40"],
    status: "PASS",
    reports: { r31, r32, r33, r34, r35, r36, r37 },
    finalDecision: {
      parserPlanningReady: true,
      allowReadOnlyAnalysis: true,
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
      readOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function validateR31R40YamahaParserPlanning(report) {
  const errors = [];

  if (report?.format !== "UAOS_R31_R40_YAMAHA_PARSER_PLANNING_REPORT") errors.push("Invalid report format.");
  if (report?.status !== "PASS") errors.push("Status must be PASS.");
  if (report?.finalDecision?.allowParserImplementation !== false) errors.push("Parser implementation must remain blocked.");
  if (report?.finalDecision?.allowFullBinaryParse !== false) errors.push("Full binary parse must remain blocked.");
  if (report?.finalDecision?.allowWriterImplementation !== false) errors.push("Writer implementation must remain blocked.");
  if (report?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (report?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (report?.finalDecision?.canExportRealSty !== false) errors.push("canExportRealSty must be false.");
  if (report?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (report?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (report?.reports?.r37?.finalDecision?.continueToWriterImplementation !== false) errors.push("R37 must block writer implementation.");
  if (report?.safety?.readOnly !== true) errors.push("Must remain read-only.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
