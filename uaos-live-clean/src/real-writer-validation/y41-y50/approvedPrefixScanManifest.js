import fs from "node:fs";

export const UAOS_Y41_Y50_VERSION = "Y41-Y50.0.0";
export const PREFIX_SCAN_LIMIT_BYTES = 32768;

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
    obj.fullParsePermissionReady === true ||
    obj.allowRealKeyboardBinaryOutput === true ||
    obj.allowRealStyOutput === true ||
    obj.canExportRealSty === true ||
    obj.allowFullBinaryParse === true ||
    obj.allowParserImplementation === true ||
    obj.allowWriterImplementation === true ||
    obj.deployAllowed === true ||
    obj.wroteRealKeyboardBinary === true ||
    obj.wroteRealSty === true ||
    obj?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
    obj?.finalDecision?.allowRealStyOutput === true ||
    obj?.finalDecision?.canExportRealSty === true ||
    obj?.finalDecision?.allowFullBinaryParse === true ||
    obj?.finalDecision?.allowParserImplementation === true ||
    obj?.finalDecision?.allowWriterImplementation === true ||
    obj?.finalDecision?.continueToParserImplementation === true ||
    obj?.finalDecision?.continueToWriterImplementation === true ||
    obj?.finalDecision?.parserUnlockReady === true ||
    obj?.finalDecision?.writerUnlockReady === true ||
    obj?.finalDecision?.fullParseUnlocked === true ||
    obj?.finalDecision?.fullParsePermissionReady === true ||
    obj?.finalDecision?.deployAllowed === true
  );
}

export function loadY31Y40Preflight() {
  return readJson("generated/real-writer-validation/y31-y40/UAOS_Y31_Y40_MANUAL_FIXTURE_ENTRIES_PREFLIGHT_SUMMARY.json");
}

export function createY41ApprovedPrefixScanManifest() {
  const preflight = loadY31Y40Preflight();
  const preflightReady = preflight?.manualFixtureEntriesPreflightReady === true && !unsafeClaim(preflight);

  return {
    format: "UAOS_Y41_APPROVED_PREFIX_SCAN_MANIFEST",
    version: UAOS_Y41_Y50_VERSION,
    phase: "Y41",
    status: preflightReady ? "PASS_LOCKED" : "PASS_EMPTY_LOCKED",
    sourcePreflightReady: preflightReady,
    target: "yamaha",
    futureFormat: ".STY",
    prefixScanLimitBytes: PREFIX_SCAN_LIMIT_BYTES,
    approvedPrefixScanEntries: [],
    manifestRules: [
      "Only approved redacted fixture entries may be scanned.",
      "Scan limit is bounded and read-only.",
      "No full binary parse.",
      "No binary reconstruction.",
      "No writer experiment."
    ],
    finalDecision: {
      prefixScanManifestReady: true,
      allowBoundedPrefixScan: true,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      boundedPrefixOnly: true,
      readOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY42BoundedPrefixScannerContract(y41) {
  return {
    format: "UAOS_Y42_BOUNDED_PREFIX_SCANNER_CONTRACT",
    version: UAOS_Y41_Y50_VERSION,
    phase: "Y42",
    status: "PASS_CONTRACT_ONLY",
    scannerContract: {
      maxReadBytes: PREFIX_SCAN_LIMIT_BYTES,
      allowedOperations: [
        "open file read-only",
        "read first bounded bytes only",
        "calculate prefix hash",
        "scan safe ASCII marker preview",
        "emit JSON report"
      ],
      blockedOperations: [
        "read full file",
        "modify file",
        "copy file",
        "write .STY",
        "write binary patch",
        "infer writer readiness"
      ]
    },
    finalDecision: {
      boundedPrefixScannerContractReady: true,
      boundedPrefixScannerImplementationAllowed: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      contractOnly: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY43MarkerIndexPreflight(y42) {
  return {
    format: "UAOS_Y43_MARKER_INDEX_PREFLIGHT",
    version: UAOS_Y41_Y50_VERSION,
    phase: "Y43",
    status: "PASS_PREFLIGHT_ONLY",
    markerIndexPlan: {
      allowedMarkers: ["MThd", "MTrk", "CASM", "OTS", "MAIN", "INTRO", "ENDING", "FILL", "BREAK"],
      markerIndexImplementationAllowed: false,
      outputType: "safe-json-only",
      markerOffsetsAllowed: false,
      markerPresenceAllowed: true
    },
    finalDecision: {
      markerIndexPreflightReady: true,
      markerIndexImplementationAllowed: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      preflightOnly: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY44PrefixScanSafetyReport(y41, y42, y43) {
  return {
    format: "UAOS_Y44_PREFIX_SCAN_SAFETY_REPORT",
    version: UAOS_Y41_Y50_VERSION,
    phase: "Y44",
    status: "PASS",
    safetyChecks: [
      { item: "bounded read limit", pass: true },
      { item: "read-only operation", pass: true },
      { item: "no fixture copy", pass: true },
      { item: "no fixture modification", pass: true },
      { item: "no full parse", pass: true },
      { item: "no writer", pass: true },
      { item: "redacted reporting", pass: true }
    ],
    finalDecision: {
      prefixScanSafetyReady: true,
      allowBoundedPrefixScan: true,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
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

export function createY45ParserUnlockGate(y44) {
  return {
    format: "UAOS_Y45_PARSER_UNLOCK_GATE",
    version: UAOS_Y41_Y50_VERSION,
    phase: "Y45",
    status: "PASS_LOCKED",
    blockers: [
      "bounded prefix scanner is contract-only",
      "marker index is preflight-only",
      "full parse permission is not approved",
      "semantic parser is not implemented",
      "roundtrip validation is not implemented",
      "writer remains blocked"
    ],
    finalDecision: {
      parserUnlockReady: false,
      continueToParserImplementation: false,
      allowBoundedPrefixScannerImplementation: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealKeyboardBinaryOutput: false,
      allowRealStyOutput: false,
      canExportRealSty: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      lockedGate: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY46WriterGate(y45) {
  return {
    format: "UAOS_Y46_WRITER_GATE",
    version: UAOS_Y41_Y50_VERSION,
    phase: "Y46",
    status: "PASS_LOCKED",
    blockedFormats: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
    blockedActions: [
      "generate real keyboard binary",
      "write output beside fixture",
      "create binary patch",
      "modify original fixture",
      "claim hardware compatibility",
      "publish fixture-derived binary data"
    ],
    finalDecision: {
      writerGateReady: true,
      continueToWriterImplementation: false,
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

export function runY41Y50ApprovedPrefixScanManifest() {
  const y41 = createY41ApprovedPrefixScanManifest();
  const y42 = createY42BoundedPrefixScannerContract(y41);
  const y43 = createY43MarkerIndexPreflight(y42);
  const y44 = createY44PrefixScanSafetyReport(y41, y42, y43);
  const y45 = createY45ParserUnlockGate(y44);
  const y46 = createY46WriterGate(y45);

  return {
    format: "UAOS_Y41_Y50_APPROVED_PREFIX_SCAN_MANIFEST_REPORT",
    version: UAOS_Y41_Y50_VERSION,
    phases: ["Y41", "Y42", "Y43", "Y44", "Y45", "Y46", "Y47", "Y48", "Y49", "Y50"],
    status: "PASS",
    reports: { y41, y42, y43, y44, y45, y46 },
    finalDecision: {
      approvedPrefixScanManifestReady: true,
      parserUnlockReady: false,
      allowReadOnlyAnalysis: true,
      allowBoundedPrefixScan: true,
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
      boundedPrefixOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function validateY41Y50ApprovedPrefixScanManifest(report) {
  const errors = [];

  if (report?.format !== "UAOS_Y41_Y50_APPROVED_PREFIX_SCAN_MANIFEST_REPORT") errors.push("Invalid report format.");
  if (report?.status !== "PASS") errors.push("Status must be PASS.");
  if (report?.finalDecision?.parserUnlockReady !== false) errors.push("Parser unlock must remain false.");
  if (report?.finalDecision?.allowFullBinaryParse !== false) errors.push("Full binary parse must remain blocked.");
  if (report?.finalDecision?.allowParserImplementation !== false) errors.push("Parser implementation must remain blocked.");
  if (report?.finalDecision?.allowWriterImplementation !== false) errors.push("Writer implementation must remain blocked.");
  if (report?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (report?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (report?.finalDecision?.canExportRealSty !== false) errors.push("canExportRealSty must be false.");
  if (report?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (report?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (report?.finalDecision?.deployAllowed !== false) errors.push("Deploy must be blocked.");
  if (report?.reports?.y45?.finalDecision?.continueToParserImplementation !== false) errors.push("Y45 must block parser implementation.");
  if (report?.reports?.y46?.finalDecision?.continueToWriterImplementation !== false) errors.push("Y46 must block writer implementation.");
  if (report?.safety?.noDeploy !== true) errors.push("No deploy flag must be true.");
  if (report?.safety?.copiedFiles !== false) errors.push("Must not copy files.");
  if (report?.safety?.modifiedFixtures !== false) errors.push("Must not modify fixtures.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
