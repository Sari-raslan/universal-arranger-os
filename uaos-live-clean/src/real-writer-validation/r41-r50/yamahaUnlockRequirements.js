import fs from "node:fs";

export const UAOS_R41_R50_VERSION = "R41-R50.0.0";

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

export function loadPreviousValidation() {
  return {
    r11: readJson("generated/real-writer-validation/r11-r20/UAOS_R11_FIXTURE_TARGET_SELECTION.json"),
    r21: readJson("generated/real-writer-validation/r21-r30/UAOS_R21_R30_YAMAHA_PARSER_SANDBOX_REPORT.json"),
    r31: readJson("generated/real-writer-validation/r31-r40/UAOS_R31_R40_YAMAHA_PARSER_PLANNING_REPORT.json")
  };
}

export function createR41FixtureApprovalSet(input = {}) {
  const prev = input.prev || loadPreviousValidation();
  const selected = prev.r11?.selected || [];

  const approvalItems = selected
    .filter(item => String(item.extension || "").toLowerCase() === ".sty")
    .slice(0, 10)
    .map((item, index) => ({
      approvalId: `r41_yamaha_fixture_${index + 1}`,
      selectionId: item.selectionId,
      fileName: item.fileName,
      fullPath: item.fullPath,
      extension: item.extension,
      approvedForMetadataOnly: true,
      approvedForSmallPrefixReadOnly: true,
      approvedForFullBinaryParse: false,
      approvedForCopyIntoRepo: false,
      approvedForWriterTest: false,
      approvedForPublishing: false,
      note: "Local user-owned fixture path only. No copy, no modification, no write."
    }));

  return {
    format: "UAOS_R41_YAMAHA_FIXTURE_APPROVAL_SET",
    version: UAOS_R41_R50_VERSION,
    phase: "R41",
    status: "PASS",
    approvedItemCount: approvalItems.length,
    approvalItems,
    finalDecision: {
      approvalSetReady: true,
      allowMetadataOnly: true,
      allowSmallPrefixReadOnly: true,
      allowFullBinaryParse: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
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

export function createR42ParserTestMatrix(r41) {
  const tests = [
    "fixture path exists",
    "extension is .sty",
    "metadata hash stable",
    "small prefix readable",
    "marker probe stable",
    "section marker hypothesis stable",
    "midi-like header probe stable",
    "safe structure map generated"
  ];

  return {
    format: "UAOS_R42_PARSER_TEST_MATRIX",
    version: UAOS_R41_R50_VERSION,
    phase: "R42",
    status: "PASS",
    testCount: tests.length,
    tests: tests.map(name => ({
      name,
      requiredBeforeParserImplementation: true,
      currentStatus: "PLANNED_OR_PARTIAL",
      writerUnlockEffect: "does_not_unlock_writer"
    })),
    fixtureApprovalSet: r41.format,
    finalDecision: {
      parserTestMatrixReady: true,
      parserImplementationAllowed: false,
      writerImplementationAllowed: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createR43SemanticSectionMap(r42) {
  const sections = [
    "INTRO_A", "INTRO_B", "INTRO_C",
    "MAIN_A", "MAIN_B", "MAIN_C", "MAIN_D",
    "FILL_A", "FILL_B", "FILL_C", "FILL_D",
    "BREAK",
    "ENDING_A", "ENDING_B", "ENDING_C"
  ];

  return {
    format: "UAOS_R43_SEMANTIC_SECTION_MAP",
    version: UAOS_R41_R50_VERSION,
    phase: "R43",
    status: "PASS",
    target: "yamaha",
    futureFormat: ".STY",
    sections: sections.map(slot => ({
      slot,
      semanticRoleKnown: true,
      binaryOffsetKnown: false,
      binaryLengthKnown: false,
      parseReady: false,
      writeReady: false
    })),
    finalDecision: {
      semanticMapReady: true,
      binaryMapReady: false,
      parserImplementationAllowed: false,
      writerImplementationAllowed: false,
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

export function createR44CasmOtsBlockerMatrix(r43) {
  return {
    format: "UAOS_R44_CASM_OTS_BLOCKER_MATRIX",
    version: UAOS_R41_R50_VERSION,
    phase: "R44",
    status: "PASS_BLOCKED",
    blockers: [
      { area: "CASM chord behavior", confirmed: false, blocksWriter: true },
      { area: "CASM note transposition", confirmed: false, blocksWriter: true },
      { area: "CASM channel mapping", confirmed: false, blocksWriter: true },
      { area: "OTS voice metadata", confirmed: false, blocksWriter: true },
      { area: "OTS effect references", confirmed: false, blocksWriter: true },
      { area: "OTS split/layer behavior", confirmed: false, blocksWriter: true }
    ],
    finalDecision: {
      casmReady: false,
      otsReady: false,
      parserImplementationAllowed: false,
      writerImplementationAllowed: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createR45ChecksumBlockerMatrix(r44) {
  return {
    format: "UAOS_R45_CHECKSUM_BLOCKER_MATRIX",
    version: UAOS_R41_R50_VERSION,
    phase: "R45",
    status: "PASS_BLOCKED",
    blockers: [
      { area: "file checksum algorithm", known: false, blocksWriter: true },
      { area: "chunk checksum algorithm", known: false, blocksWriter: true },
      { area: "footer/package integrity", known: false, blocksWriter: true },
      { area: "editor acceptance criteria", known: false, blocksWriter: true },
      { area: "hardware acceptance criteria", known: false, blocksWriter: true }
    ],
    finalDecision: {
      checksumReady: false,
      packageReady: false,
      writerImplementationAllowed: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createR46RoundtripBlockerMatrix(r45) {
  return {
    format: "UAOS_R46_ROUNDTRIP_BLOCKER_MATRIX",
    version: UAOS_R41_R50_VERSION,
    phase: "R46",
    status: "PASS_BLOCKED",
    roundtripRequirements: [
      { requirement: "parse fixture to semantic model", ready: false },
      { requirement: "semantic model to safe intermediate", ready: false },
      { requirement: "safe intermediate to binary candidate", ready: false },
      { requirement: "binary candidate accepted by editor", ready: false },
      { requirement: "binary candidate accepted by hardware", ready: false }
    ],
    canRunTrueRoundtrip: false,
    finalDecision: {
      roundtripReady: false,
      parserImplementationAllowed: false,
      writerImplementationAllowed: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createR47WriterUnlockRequirements(r41, r42, r43, r44, r45, r46) {
  return {
    format: "UAOS_R47_WRITER_UNLOCK_REQUIREMENTS",
    version: UAOS_R41_R50_VERSION,
    phase: "R47",
    status: "PASS_LOCKED",
    target: "yamaha",
    futureFormat: ".STY",
    unlockRequirements: [
      "user-owned approved fixtures",
      "full read-only parser",
      "confirmed section offsets and lengths",
      "confirmed CASM-like rules",
      "confirmed OTS metadata rules",
      "confirmed checksum/package rules",
      "semantic roundtrip test pass",
      "editor import validation pass",
      "hardware import validation pass",
      "manual explicit writer approval"
    ].map(item => ({
      requirement: item,
      complete: false,
      requiredToUnlockWriter: true
    })),
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

export function runR41R50YamahaUnlockRequirements() {
  const previous = loadPreviousValidation();

  const previousUnsafe = Object.values(previous).some(unsafeWriterClaim);

  const r41 = createR41FixtureApprovalSet({ prev: previous });
  const r42 = createR42ParserTestMatrix(r41);
  const r43 = createR43SemanticSectionMap(r42);
  const r44 = createR44CasmOtsBlockerMatrix(r43);
  const r45 = createR45ChecksumBlockerMatrix(r44);
  const r46 = createR46RoundtripBlockerMatrix(r45);
  const r47 = createR47WriterUnlockRequirements(r41, r42, r43, r44, r45, r46);

  return {
    format: "UAOS_R41_R50_YAMAHA_UNLOCK_REQUIREMENTS_REPORT",
    version: UAOS_R41_R50_VERSION,
    phases: ["R41", "R42", "R43", "R44", "R45", "R46", "R47", "R48", "R49", "R50"],
    status: previousUnsafe ? "FAIL" : "PASS",
    previousUnsafe,
    reports: { r41, r42, r43, r44, r45, r46, r47 },
    finalDecision: {
      unlockRequirementsDocumented: true,
      writerUnlockReady: false,
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

export function validateR41R50YamahaUnlockRequirements(report) {
  const errors = [];

  if (report?.format !== "UAOS_R41_R50_YAMAHA_UNLOCK_REQUIREMENTS_REPORT") errors.push("Invalid report format.");
  if (report?.status !== "PASS") errors.push("Status must be PASS.");
  if (report?.previousUnsafe !== false) errors.push("Previous validation contains unsafe writer claim.");
  if (report?.finalDecision?.writerUnlockReady !== false) errors.push("Writer unlock must remain false.");
  if (report?.finalDecision?.allowParserImplementation !== false) errors.push("Parser implementation must remain blocked.");
  if (report?.finalDecision?.allowFullBinaryParse !== false) errors.push("Full binary parse must remain blocked.");
  if (report?.finalDecision?.allowWriterImplementation !== false) errors.push("Writer implementation must remain blocked.");
  if (report?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (report?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (report?.finalDecision?.canExportRealSty !== false) errors.push("canExportRealSty must be false.");
  if (report?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (report?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (report?.reports?.r47?.finalDecision?.continueToWriterImplementation !== false) errors.push("R47 must block writer implementation.");
  if (report?.safety?.readOnly !== true) errors.push("Must remain read-only.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
