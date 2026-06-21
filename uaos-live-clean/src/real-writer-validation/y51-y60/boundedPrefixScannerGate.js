import fs from "node:fs";

export const UAOS_Y51_Y60_VERSION = "Y51-Y60.0.0";
export const SAFE_PREFIX_LIMIT_BYTES = 32768;

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
    obj?.finalDecision?.deployAllowed === true
  );
}

export function loadY41Y50PrefixManifest() {
  return readJson("generated/real-writer-validation/y41-y50/UAOS_Y41_Y50_APPROVED_PREFIX_SCAN_MANIFEST_SUMMARY.json");
}

export function createY51BoundedPrefixScannerImplementationGate() {
  const manifest = loadY41Y50PrefixManifest();
  const manifestReady = manifest?.approvedPrefixScanManifestReady === true && !unsafeClaim(manifest);

  return {
    format: "UAOS_Y51_BOUNDED_PREFIX_SCANNER_IMPLEMENTATION_GATE",
    version: UAOS_Y51_Y60_VERSION,
    phase: "Y51",
    status: manifestReady ? "PASS_LOCKED" : "PASS_EMPTY_LOCKED",
    sourceManifestReady: manifestReady,
    target: "yamaha",
    futureFormat: ".STY",
    scannerGate: {
      implementationRequested: false,
      implementationAllowed: false,
      maxReadBytes: SAFE_PREFIX_LIMIT_BYTES,
      inputSource: "approved redacted manifest entries only",
      outputType: "safe-json-report-only"
    },
    allowedFutureImplementationRules: [
      "open only approved local paths",
      "read at most SAFE_PREFIX_LIMIT_BYTES",
      "emit hash and marker presence only",
      "never copy fixture content",
      "never output binary payload"
    ],
    finalDecision: {
      boundedPrefixScannerGateReady: true,
      allowBoundedPrefixScannerImplementation: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      gateOnly: true,
      readOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY52PrefixScanExecutionPlan(y51) {
  return {
    format: "UAOS_Y52_PREFIX_SCAN_EXECUTION_PLAN",
    version: UAOS_Y51_Y60_VERSION,
    phase: "Y52",
    status: "PASS_PLAN_ONLY",
    executionPlan: {
      enabledNow: false,
      maxReadBytes: SAFE_PREFIX_LIMIT_BYTES,
      steps: [
        "load approved redacted manifest",
        "resolve private path only at runtime from user environment",
        "verify extension .sty",
        "read bounded prefix only",
        "calculate prefix hash",
        "detect allowed marker presence",
        "write safe JSON report"
      ]
    },
    blockedSteps: [
      "full file read",
      "binary parse",
      "chunk reconstruction",
      "checksum writing",
      "real .STY output"
    ],
    finalDecision: {
      prefixScanExecutionPlanReady: true,
      prefixScanExecutionEnabledNow: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      planOnly: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY53MarkerExtractionContract(y52) {
  return {
    format: "UAOS_Y53_MARKER_EXTRACTION_CONTRACT",
    version: UAOS_Y51_Y60_VERSION,
    phase: "Y53",
    status: "PASS_CONTRACT_ONLY",
    markerContract: {
      allowedMarkers: ["MThd", "MTrk", "CASM", "OTS", "MAIN", "INTRO", "ENDING", "FILL", "BREAK"],
      allowedOutput: ["present", "count", "prefix-relative-offset-if-approved-later"],
      currentAllowedOutput: ["present", "count"],
      offsetOutputAllowedNow: false,
      rawBytesOutputAllowed: false
    },
    finalDecision: {
      markerExtractionContractReady: true,
      markerExtractionImplementationAllowed: false,
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

export function createY54SafePrefixScanResultSchema(y53) {
  return {
    format: "UAOS_Y54_SAFE_PREFIX_SCAN_RESULT_SCHEMA",
    version: UAOS_Y51_Y60_VERSION,
    phase: "Y54",
    status: "PASS_SCHEMA_ONLY",
    resultSchema: {
      fixtureId: "string",
      redactedPath: "string",
      pathHash: "string",
      extension: ".sty",
      prefixReadBytes: "number",
      prefixHash: "sha256",
      markers: {
        MThd: "boolean",
        MTrk: "boolean",
        CASM: "boolean",
        OTS: "boolean",
        MAIN: "boolean",
        INTRO: "boolean",
        ENDING: "boolean",
        FILL: "boolean",
        BREAK: "boolean"
      },
      rawBinaryIncluded: false,
      fullParseIncluded: false,
      writerOutputIncluded: false
    },
    blockedSchemaFields: [
      "rawBinary",
      "fullFileBytes",
      "outputStyBytes",
      "patchBytes",
      "privateFullPathInPublicReport"
    ],
    finalDecision: {
      safePrefixScanResultSchemaReady: true,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      schemaOnly: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY55ParserUnlockBlocker(y51, y52, y53, y54) {
  return {
    format: "UAOS_Y55_PARSER_UNLOCK_BLOCKER",
    version: UAOS_Y51_Y60_VERSION,
    phase: "Y55",
    status: "PASS_BLOCKED",
    blockers: [
      "bounded prefix scanner implementation not enabled",
      "marker extraction implementation not enabled",
      "full parse permission not approved",
      "semantic parser not implemented",
      "roundtrip validator not implemented",
      "writer remains blocked"
    ],
    finalDecision: {
      parserUnlockReady: false,
      continueToParserImplementation: false,
      allowBoundedPrefixScannerImplementation: false,
      allowMarkerExtractionImplementation: false,
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
      blocked: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY56WriterLockCertificate(y55) {
  return {
    format: "UAOS_Y56_WRITER_LOCK_CERTIFICATE",
    version: UAOS_Y51_Y60_VERSION,
    phase: "Y56",
    status: "PASS_LOCKED",
    certificate: {
      writerState: "LOCKED",
      target: "yamaha",
      futureFormat: ".STY",
      reason: "No parser unlock, no full parse, no checksum validation, no editor/hardware validation."
    },
    blockedFormats: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
    finalDecision: {
      writerLockCertified: true,
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

export function runY51Y60BoundedPrefixScannerGate() {
  const y51 = createY51BoundedPrefixScannerImplementationGate();
  const y52 = createY52PrefixScanExecutionPlan(y51);
  const y53 = createY53MarkerExtractionContract(y52);
  const y54 = createY54SafePrefixScanResultSchema(y53);
  const y55 = createY55ParserUnlockBlocker(y51, y52, y53, y54);
  const y56 = createY56WriterLockCertificate(y55);

  return {
    format: "UAOS_Y51_Y60_BOUNDED_PREFIX_SCANNER_GATE_REPORT",
    version: UAOS_Y51_Y60_VERSION,
    phases: ["Y51", "Y52", "Y53", "Y54", "Y55", "Y56", "Y57", "Y58", "Y59", "Y60"],
    status: "PASS",
    reports: { y51, y52, y53, y54, y55, y56 },
    finalDecision: {
      boundedPrefixScannerGateReady: true,
      parserUnlockReady: false,
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
      planningOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function validateY51Y60BoundedPrefixScannerGate(report) {
  const errors = [];

  if (report?.format !== "UAOS_Y51_Y60_BOUNDED_PREFIX_SCANNER_GATE_REPORT") errors.push("Invalid report format.");
  if (report?.status !== "PASS") errors.push("Status must be PASS.");
  if (report?.finalDecision?.parserUnlockReady !== false) errors.push("Parser unlock must remain false.");
  if (report?.finalDecision?.allowBoundedPrefixScannerImplementation !== false) errors.push("Scanner implementation must remain blocked.");
  if (report?.finalDecision?.allowMarkerExtractionImplementation !== false) errors.push("Marker extraction implementation must remain blocked.");
  if (report?.finalDecision?.allowFullBinaryParse !== false) errors.push("Full binary parse must remain blocked.");
  if (report?.finalDecision?.allowParserImplementation !== false) errors.push("Parser implementation must remain blocked.");
  if (report?.finalDecision?.allowWriterImplementation !== false) errors.push("Writer implementation must remain blocked.");
  if (report?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (report?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (report?.finalDecision?.canExportRealSty !== false) errors.push("canExportRealSty must be false.");
  if (report?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (report?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (report?.finalDecision?.deployAllowed !== false) errors.push("Deploy must be blocked.");
  if (report?.reports?.y55?.finalDecision?.continueToParserImplementation !== false) errors.push("Y55 must block parser implementation.");
  if (report?.reports?.y56?.finalDecision?.continueToWriterImplementation !== false) errors.push("Y56 must block writer implementation.");
  if (report?.safety?.noDeploy !== true) errors.push("No deploy flag must be true.");
  if (report?.safety?.copiedFiles !== false) errors.push("Must not copy files.");
  if (report?.safety?.modifiedFixtures !== false) errors.push("Must not modify fixtures.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
