import fs from "node:fs";

export const UAOS_Y71_Y80_VERSION = "Y71-Y80.0.0";

const REQUIRED_BASELINE = [
  "generated/real-writer-validation/y61-y70/UAOS_Y61_Y70_YAMAHA_PARSER_DESIGN_FINAL_CLOSURE_SUMMARY.json",
  "generated/real-writer-validation/y61-y70/UAOS_YAMAHA_PARSER_DESIGN_FINAL_HANDOVER.md"
];

function exists(file) {
  try { return fs.existsSync(file); } catch { return false; }
}

function readJson(file) {
  if (!exists(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function unsafeClaim(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Boolean(
    obj.realKeyboardBinaryWriteAllowed === true ||
    obj.realWriterReady === true ||
    obj.realBinaryReady === true ||
    obj.realStyWriterReady === true ||
    obj.writerUnlockReady === true ||
    obj.parserUnlockReady === true ||
    obj.fullParseUnlocked === true ||
    obj.allowRealKeyboardBinaryOutput === true ||
    obj.allowRealStyOutput === true ||
    obj.canExportRealSty === true ||
    obj.allowFullBinaryParse === true ||
    obj.allowParserImplementation === true ||
    obj.allowWriterImplementation === true ||
    obj.allowBoundedPrefixScannerImplementation === true ||
    obj.allowMarkerExtractionImplementation === true ||
    obj.deployAllowed === true ||
    obj.wroteRealKeyboardBinary === true ||
    obj.wroteRealSty === true ||
    obj?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
    obj?.finalDecision?.allowRealStyOutput === true ||
    obj?.finalDecision?.canExportRealSty === true ||
    obj?.finalDecision?.allowFullBinaryParse === true ||
    obj?.finalDecision?.allowParserImplementation === true ||
    obj?.finalDecision?.allowWriterImplementation === true ||
    obj?.finalDecision?.allowBoundedPrefixScannerImplementation === true ||
    obj?.finalDecision?.allowMarkerExtractionImplementation === true ||
    obj?.finalDecision?.continueToParserImplementation === true ||
    obj?.finalDecision?.continueToWriterImplementation === true ||
    obj?.finalDecision?.parserUnlockReady === true ||
    obj?.finalDecision?.writerUnlockReady === true ||
    obj?.finalDecision?.fullParseUnlocked === true ||
    obj?.finalDecision?.deployAllowed === true
  );
}

function baselineCheck() {
  const summary = readJson(REQUIRED_BASELINE[0]);
  const handoverExists = exists(REQUIRED_BASELINE[1]);
  const summaryReady = summary?.yamahaParserDesignBaselineClosed === true && !unsafeClaim(summary);

  return {
    summaryFile: REQUIRED_BASELINE[0],
    handoverFile: REQUIRED_BASELINE[1],
    summaryExists: Boolean(summary),
    handoverExists,
    summaryReady,
    ok: summaryReady && handoverExists
  };
}

export function createY71ManualUnlockDecisionGate() {
  const baseline = baselineCheck();

  return {
    format: "UAOS_Y71_MANUAL_UNLOCK_DECISION_GATE",
    version: UAOS_Y71_Y80_VERSION,
    phase: "Y71",
    status: baseline.ok ? "PASS_LOCKED" : "FAIL_BASELINE_MISSING",
    target: "yamaha",
    futureFormat: ".STY",
    baseline,
    decisionMode: "MANUAL_ONLY",
    defaultDecision: "STOP_LOCKED",
    allowedDecisions: [
      "STOP_LOCKED",
      "CONTINUE_TO_PREFIX_SCANNER_IMPLEMENTATION_REVIEW_ONLY"
    ],
    forbiddenDecisions: [
      "UNLOCK_FULL_PARSE",
      "UNLOCK_PARSER_IMPLEMENTATION",
      "UNLOCK_WRITER",
      "EXPORT_REAL_STY",
      "DEPLOY"
    ],
    finalDecision: {
      manualUnlockGateReady: baseline.ok,
      selectedDecision: "STOP_LOCKED",
      parserUnlockReady: false,
      writerUnlockReady: false,
      allowBoundedPrefixScannerImplementation: false,
      allowMarkerExtractionImplementation: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealKeyboardBinaryOutput: false,
      allowRealStyOutput: false,
      canExportRealSty: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false,
      deployAllowed: false
    },
    safety: {
      lockedByDefault: true,
      noDeploy: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY72ParserUnlockRequirementsChecklist(y71) {
  return {
    format: "UAOS_Y72_PARSER_UNLOCK_REQUIREMENTS_CHECKLIST",
    version: UAOS_Y71_Y80_VERSION,
    phase: "Y72",
    status: "PASS_LOCKED",
    requirements: [
      { item: "User selects approved local Yamaha .STY fixtures", complete: false },
      { item: "User confirms rights for local analysis", complete: false },
      { item: "User explicitly approves bounded prefix scanner implementation", complete: false },
      { item: "User explicitly approves marker extraction implementation", complete: false },
      { item: "User explicitly approves full read-only parse", complete: false },
      { item: "Parser outputs JSON only", complete: false },
      { item: "Writer remains absent from parser phase", complete: true }
    ],
    finalDecision: {
      parserRequirementsComplete: false,
      parserUnlockReady: false,
      continueToParserImplementation: false,
      allowBoundedPrefixScannerImplementation: false,
      allowMarkerExtractionImplementation: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      locked: true,
      readOnly: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createY73PrefixScannerUnlockBlocker(y72) {
  return {
    format: "UAOS_Y73_PREFIX_SCANNER_UNLOCK_BLOCKER",
    version: UAOS_Y71_Y80_VERSION,
    phase: "Y73",
    status: "PASS_BLOCKED",
    blockerReason: "No explicit human approval to implement bounded prefix scanner.",
    canImplementNow: false,
    requiredApprovalText: "I approve implementing bounded read-only prefix scanner for my selected local Yamaha .STY fixtures. No full parse, no writer.",
    finalDecision: {
      prefixScannerUnlockReady: false,
      allowBoundedPrefixScannerImplementation: false,
      allowMarkerExtractionImplementation: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      blocked: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY74FullParseUnlockBlocker(y73) {
  return {
    format: "UAOS_Y74_FULL_PARSE_UNLOCK_BLOCKER",
    version: UAOS_Y71_Y80_VERSION,
    phase: "Y74",
    status: "PASS_BLOCKED",
    blockerReason: "Full binary parse is not approved and must not be inferred from prefix scan planning.",
    canFullParseNow: false,
    requiredApprovalText: "I approve full read-only parse for my selected local Yamaha .STY fixtures. No writer.",
    finalDecision: {
      fullParseUnlockReady: false,
      fullParseUnlocked: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      blocked: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY75WriterUnlockBlocker(y74) {
  return {
    format: "UAOS_Y75_WRITER_UNLOCK_BLOCKER",
    version: UAOS_Y71_Y80_VERSION,
    phase: "Y75",
    status: "PASS_BLOCKED",
    blockerReason: "Writer cannot unlock before parser, checksum/package rules, editor import, and hardware import validation.",
    blockedFormats: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
    hardRequirementsBeforeWriter: [
      "full read-only parser pass",
      "semantic roundtrip pass",
      "checksum/package rules confirmed",
      "Yamaha editor import pass",
      "Yamaha hardware import pass",
      "separate explicit writer approval"
    ],
    finalDecision: {
      writerUnlockReady: false,
      continueToWriterImplementation: false,
      allowWriterImplementation: false,
      allowRealKeyboardBinaryOutput: false,
      allowRealStyOutput: false,
      canExportRealSty: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      locked: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createY76StopContinueDecisionHandover(y71, y72, y73, y74, y75) {
  return {
    format: "UAOS_Y76_STOP_CONTINUE_DECISION_HANDOVER",
    version: UAOS_Y71_Y80_VERSION,
    phase: "Y76",
    status: "PASS_LOCKED",
    currentDecision: "STOP_LOCKED",
    safeNextOption: "Y81 bounded prefix scanner implementation only after explicit approval",
    recommendedNow: "STOP or wait for manual approval",
    handover: {
      ready: [
        "manual unlock decision gate",
        "parser unlock checklist",
        "prefix scanner blocker",
        "full parse blocker",
        "writer blocker"
      ],
      stillBlocked: [
        "bounded prefix scanner implementation",
        "marker extraction implementation",
        "full binary parse",
        "parser implementation",
        "writer implementation",
        "real .STY output",
        "deploy"
      ]
    },
    finalDecision: {
      stopContinueHandoverReady: true,
      selectedDecision: "STOP_LOCKED",
      parserUnlockReady: false,
      writerUnlockReady: false,
      allowBoundedPrefixScannerImplementation: false,
      allowMarkerExtractionImplementation: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      deployAllowed: false
    },
    safety: {
      locked: true,
      noDeploy: true,
      readOnly: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function runY71Y80ManualUnlockDecisionGate() {
  const y71 = createY71ManualUnlockDecisionGate();
  const y72 = createY72ParserUnlockRequirementsChecklist(y71);
  const y73 = createY73PrefixScannerUnlockBlocker(y72);
  const y74 = createY74FullParseUnlockBlocker(y73);
  const y75 = createY75WriterUnlockBlocker(y74);
  const y76 = createY76StopContinueDecisionHandover(y71, y72, y73, y74, y75);

  return {
    format: "UAOS_Y71_Y80_MANUAL_UNLOCK_DECISION_GATE_REPORT",
    version: UAOS_Y71_Y80_VERSION,
    phases: ["Y71", "Y72", "Y73", "Y74", "Y75", "Y76", "Y77", "Y78", "Y79", "Y80"],
    status: y71.status === "PASS_LOCKED" ? "PASS" : "FAIL",
    reports: { y71, y72, y73, y74, y75, y76 },
    finalDecision: {
      manualUnlockDecisionGateReady: y71.status === "PASS_LOCKED",
      selectedDecision: "STOP_LOCKED",
      parserUnlockReady: false,
      writerUnlockReady: false,
      allowReadOnlyAnalysis: true,
      allowBoundedPrefixScanPlanning: true,
      allowBoundedPrefixScannerImplementation: false,
      allowMarkerExtractionImplementation: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
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
      readOnly: true,
      lockedByDefault: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function validateY71Y80ManualUnlockDecisionGate(report) {
  const errors = [];

  if (report?.format !== "UAOS_Y71_Y80_MANUAL_UNLOCK_DECISION_GATE_REPORT") errors.push("Invalid report format.");
  if (report?.status !== "PASS") errors.push("Status must be PASS.");
  if (report?.finalDecision?.selectedDecision !== "STOP_LOCKED") errors.push("Default decision must be STOP_LOCKED.");
  if (report?.finalDecision?.parserUnlockReady !== false) errors.push("Parser unlock must remain false.");
  if (report?.finalDecision?.writerUnlockReady !== false) errors.push("Writer unlock must remain false.");
  if (report?.finalDecision?.allowBoundedPrefixScannerImplementation !== false) errors.push("Prefix scanner implementation must remain blocked.");
  if (report?.finalDecision?.allowMarkerExtractionImplementation !== false) errors.push("Marker extraction must remain blocked.");
  if (report?.finalDecision?.allowFullBinaryParse !== false) errors.push("Full binary parse must remain blocked.");
  if (report?.finalDecision?.allowParserImplementation !== false) errors.push("Parser implementation must remain blocked.");
  if (report?.finalDecision?.allowWriterImplementation !== false) errors.push("Writer implementation must remain blocked.");
  if (report?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (report?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (report?.finalDecision?.canExportRealSty !== false) errors.push("canExportRealSty must be false.");
  if (report?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (report?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (report?.finalDecision?.deployAllowed !== false) errors.push("Deploy must be blocked.");
  if (report?.reports?.y75?.finalDecision?.continueToWriterImplementation !== false) errors.push("Y75 must block writer implementation.");
  if (report?.safety?.noDeploy !== true) errors.push("No deploy flag must be true.");
  if (report?.safety?.copiedFiles !== false) errors.push("Must not copy files.");
  if (report?.safety?.modifiedFixtures !== false) errors.push("Must not modify fixtures.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
