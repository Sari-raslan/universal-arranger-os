import fs from "node:fs";

export const UAOS_Y81_Y90_VERSION = "Y81-Y90.0.0";

export const EXACT_APPROVAL_PHRASE =
  "I approve implementing bounded read-only prefix scanner for my selected local Yamaha .STY fixtures. No full parse, no writer.";

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
    obj.prefixScannerImplementationUnlocked === true ||
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
    obj?.finalDecision?.prefixScannerImplementationUnlocked === true ||
    obj?.finalDecision?.deployAllowed === true
  );
}

export function loadY71Y80DecisionGate() {
  return readJson("generated/real-writer-validation/y71-y80/UAOS_Y71_Y80_MANUAL_UNLOCK_DECISION_GATE_SUMMARY.json");
}

export function createY81ApprovalRequiredGate() {
  const previous = loadY71Y80DecisionGate();
  const previousReady = previous?.manualUnlockDecisionGateReady === true && !unsafeClaim(previous);

  return {
    format: "UAOS_Y81_APPROVAL_REQUIRED_GATE",
    version: UAOS_Y81_Y90_VERSION,
    phase: "Y81",
    status: previousReady ? "PASS_LOCKED" : "FAIL_PREVIOUS_GATE_MISSING",
    target: "yamaha",
    futureFormat: ".STY",
    previousReady,
    requiredApprovalPhrase: EXACT_APPROVAL_PHRASE,
    approvalProvidedInThisLauncher: false,
    decision: "STOP_LOCKED",
    reason: "Exact approval phrase was not provided as a launcher variable or separate explicit instruction.",
    finalDecision: {
      approvalRequiredGateReady: previousReady,
      selectedDecision: "STOP_LOCKED",
      prefixScannerImplementationUnlocked: false,
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

export function createY82ExactApprovalPhraseValidator(y81) {
  const phraseFromEnv = process.env.UAOS_YAMAHA_PREFIX_SCANNER_APPROVAL || "";
  const exactMatch = phraseFromEnv.trim() === EXACT_APPROVAL_PHRASE;

  return {
    format: "UAOS_Y82_EXACT_APPROVAL_PHRASE_VALIDATOR",
    version: UAOS_Y81_Y90_VERSION,
    phase: "Y82",
    status: "PASS_LOCKED",
    approvalSource: "UAOS_YAMAHA_PREFIX_SCANNER_APPROVAL",
    exactApprovalPhrase: EXACT_APPROVAL_PHRASE,
    envProvided: phraseFromEnv.length > 0,
    exactMatch,
    acceptedForUnlock: false,
    reason: exactMatch
      ? "Phrase exists, but this launcher is intentionally stop-gate only and does not implement scanner."
      : "Exact phrase missing; scanner implementation remains locked.",
    finalDecision: {
      approvalPhraseValidatorReady: true,
      approvalAcceptedForImplementationNow: false,
      prefixScannerImplementationUnlocked: false,
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
      stopGateOnly: true,
      readOnly: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createY83PrefixScannerImplementationBlocker(y82) {
  return {
    format: "UAOS_Y83_PREFIX_SCANNER_IMPLEMENTATION_BLOCKER",
    version: UAOS_Y81_Y90_VERSION,
    phase: "Y83",
    status: "PASS_BLOCKED",
    blocker: {
      implementationBlocked: true,
      reason: "Implementation requires a separate dedicated launcher after explicit approval. This launcher only records stop/approval state.",
      safeNextPhase: "Y91 bounded prefix scanner implementation, only after explicit approval"
    },
    finalDecision: {
      prefixScannerImplementationBlocked: true,
      prefixScannerImplementationUnlocked: false,
      continueToPrefixScannerImplementation: false,
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

export function createY84FullParseBlocker(y83) {
  return {
    format: "UAOS_Y84_FULL_PARSE_BLOCKER",
    version: UAOS_Y81_Y90_VERSION,
    phase: "Y84",
    status: "PASS_BLOCKED",
    blocker: {
      fullParseBlocked: true,
      reason: "Prefix scanning, even if later approved, must not unlock full binary parse.",
      requiredFutureApproval: "Separate explicit full read-only parse approval."
    },
    finalDecision: {
      fullParseBlocked: true,
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

export function createY85WriterBlocker(y84) {
  return {
    format: "UAOS_Y85_WRITER_BLOCKER",
    version: UAOS_Y81_Y90_VERSION,
    phase: "Y85",
    status: "PASS_BLOCKED",
    blockedFormats: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
    blocker: {
      writerBlocked: true,
      reason: "Writer cannot unlock from prefix scan approval. Requires parser, checksum, editor import, hardware import, and separate writer approval."
    },
    finalDecision: {
      writerBlocked: true,
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

export function createY86FinalStopDashboard(y81, y82, y83, y84, y85) {
  return {
    format: "UAOS_Y86_FINAL_STOP_DASHBOARD",
    version: UAOS_Y81_Y90_VERSION,
    phase: "Y86",
    status: "PASS_LOCKED",
    dashboard: {
      title: "UAOS Yamaha Parser Approval Required Stop Gate",
      finalStatus: "STOP_LOCKED",
      cards: [
        { title: "Approval gate", value: "Ready", state: "pass" },
        { title: "Exact approval", value: y82.exactMatch ? "Detected but not executed" : "Missing", state: "warn" },
        { title: "Prefix scanner", value: "Blocked", state: "warn" },
        { title: "Full parse", value: "Blocked", state: "warn" },
        { title: "Writer", value: "Blocked", state: "warn" },
        { title: "Deploy", value: "Not executed", state: "warn" }
      ],
      requiredApprovalPhrase: EXACT_APPROVAL_PHRASE
    },
    finalDecision: {
      finalStopDashboardReady: true,
      selectedDecision: "STOP_LOCKED",
      prefixScannerImplementationUnlocked: false,
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
      noDeploy: true,
      readOnly: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function runY81Y90ApprovalRequiredStopGate() {
  const y81 = createY81ApprovalRequiredGate();
  const y82 = createY82ExactApprovalPhraseValidator(y81);
  const y83 = createY83PrefixScannerImplementationBlocker(y82);
  const y84 = createY84FullParseBlocker(y83);
  const y85 = createY85WriterBlocker(y84);
  const y86 = createY86FinalStopDashboard(y81, y82, y83, y84, y85);

  return {
    format: "UAOS_Y81_Y90_APPROVAL_REQUIRED_STOP_GATE_REPORT",
    version: UAOS_Y81_Y90_VERSION,
    phases: ["Y81", "Y82", "Y83", "Y84", "Y85", "Y86", "Y87", "Y88", "Y89", "Y90"],
    status: y81.status === "PASS_LOCKED" ? "PASS" : "FAIL",
    reports: { y81, y82, y83, y84, y85, y86 },
    finalDecision: {
      approvalRequiredStopGateReady: y81.status === "PASS_LOCKED",
      selectedDecision: "STOP_LOCKED",
      prefixScannerImplementationUnlocked: false,
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

export function validateY81Y90ApprovalRequiredStopGate(report) {
  const errors = [];

  if (report?.format !== "UAOS_Y81_Y90_APPROVAL_REQUIRED_STOP_GATE_REPORT") errors.push("Invalid report format.");
  if (report?.status !== "PASS") errors.push("Status must be PASS.");
  if (report?.finalDecision?.selectedDecision !== "STOP_LOCKED") errors.push("Default decision must be STOP_LOCKED.");
  if (report?.finalDecision?.prefixScannerImplementationUnlocked !== false) errors.push("Prefix scanner implementation must remain locked.");
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
  if (report?.reports?.y83?.finalDecision?.continueToPrefixScannerImplementation !== false) errors.push("Y83 must block scanner implementation.");
  if (report?.reports?.y85?.finalDecision?.continueToWriterImplementation !== false) errors.push("Y85 must block writer implementation.");
  if (report?.safety?.noDeploy !== true) errors.push("No deploy flag must be true.");
  if (report?.safety?.copiedFiles !== false) errors.push("Must not copy files.");
  if (report?.safety?.modifiedFixtures !== false) errors.push("Must not modify fixtures.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
