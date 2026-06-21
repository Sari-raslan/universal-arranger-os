import fs from "node:fs";

export const UAOS_Y61_Y70_VERSION = "Y61-Y70.0.0";

export const REQUIRED_YAMAHA_PARSER_DESIGN_BASELINE_FILES = [
  "generated/real-writer-validation/y1-y10/UAOS_Y1_Y10_MANUAL_APPROVED_YAMAHA_PARSER_DESIGN_SUMMARY.json",
  "generated/real-writer-validation/y11-y20/UAOS_Y11_Y20_MANUAL_FIXTURE_APPROVAL_REGISTRY_SUMMARY.json",
  "generated/real-writer-validation/y21-y30/UAOS_Y21_Y30_APPROVED_FIXTURE_MANIFEST_SUMMARY.json",
  "generated/real-writer-validation/y31-y40/UAOS_Y31_Y40_MANUAL_FIXTURE_ENTRIES_PREFLIGHT_SUMMARY.json",
  "generated/real-writer-validation/y41-y50/UAOS_Y41_Y50_APPROVED_PREFIX_SCAN_MANIFEST_SUMMARY.json",
  "generated/real-writer-validation/y51-y60/UAOS_Y51_Y60_BOUNDED_PREFIX_SCANNER_GATE_SUMMARY.json"
];

function exists(file) {
  try { return fs.existsSync(file); } catch { return false; }
}

function unsafeClaim(json) {
  if (!json || typeof json !== "object") return false;
  return Boolean(
    json.realKeyboardBinaryWriteAllowed === true ||
    json.realWriterReady === true ||
    json.realBinaryReady === true ||
    json.realStyWriterReady === true ||
    json.writerUnlockReady === true ||
    json.parserUnlockReady === true ||
    json.fullParseUnlocked === true ||
    json.allowRealKeyboardBinaryOutput === true ||
    json.allowRealStyOutput === true ||
    json.canExportRealSty === true ||
    json.allowFullBinaryParse === true ||
    json.allowParserImplementation === true ||
    json.allowWriterImplementation === true ||
    json.allowBoundedPrefixScannerImplementation === true ||
    json.allowMarkerExtractionImplementation === true ||
    json.deployAllowed === true ||
    json.wroteRealKeyboardBinary === true ||
    json.wroteRealSty === true ||
    json?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
    json?.finalDecision?.allowRealStyOutput === true ||
    json?.finalDecision?.canExportRealSty === true ||
    json?.finalDecision?.allowFullBinaryParse === true ||
    json?.finalDecision?.allowParserImplementation === true ||
    json?.finalDecision?.allowWriterImplementation === true ||
    json?.finalDecision?.allowBoundedPrefixScannerImplementation === true ||
    json?.finalDecision?.allowMarkerExtractionImplementation === true ||
    json?.finalDecision?.continueToParserImplementation === true ||
    json?.finalDecision?.continueToWriterImplementation === true ||
    json?.finalDecision?.parserUnlockReady === true ||
    json?.finalDecision?.writerUnlockReady === true ||
    json?.finalDecision?.fullParseUnlocked === true ||
    json?.finalDecision?.deployAllowed === true
  );
}

function readJsonCheck(file) {
  if (!exists(file)) {
    return { file, exists: false, ok: false, error: "missing" };
  }

  try {
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    const unsafe = unsafeClaim(json);

    return {
      file,
      exists: true,
      ok: !unsafe,
      format: json.format || "unknown",
      status: json.status || "unknown",
      unsafeClaim: unsafe,
      error: unsafe ? "unsafe parser/writer/deploy permission" : null
    };
  } catch (error) {
    return { file, exists: true, ok: false, error: String(error?.message || error) };
  }
}

export function createY61FinalParserDesignAudit() {
  const checks = REQUIRED_YAMAHA_PARSER_DESIGN_BASELINE_FILES.map(readJsonCheck);
  const failed = checks.filter(item => !item.ok);

  return {
    format: "UAOS_Y61_FINAL_PARSER_DESIGN_AUDIT",
    version: UAOS_Y61_Y70_VERSION,
    phase: "Y61",
    status: failed.length === 0 ? "PASS" : "FAIL",
    requiredCount: checks.length,
    passedCount: checks.filter(item => item.ok).length,
    failedCount: failed.length,
    checks,
    finalDecision: {
      finalParserDesignAuditPass: failed.length === 0,
      parserDesignBaselineReady: failed.length === 0,
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
      noDeploy: true,
      readOnly: true,
      planningOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY62YamahaParserDesignMasterIndex(y61) {
  return {
    format: "UAOS_Y62_YAMAHA_PARSER_DESIGN_MASTER_INDEX",
    version: UAOS_Y61_Y70_VERSION,
    phase: "Y62",
    status: y61.status === "PASS" ? "PASS" : "FAIL",
    target: "yamaha",
    futureFormat: ".STY",
    completedDesignBlocks: [
      "Y1-Y10 manual approved parser design",
      "Y11-Y20 manual fixture approval registry",
      "Y21-Y30 approved fixture manifest",
      "Y31-Y40 manual fixture entries preflight",
      "Y41-Y50 approved prefix scan manifest",
      "Y51-Y60 bounded prefix scanner gate",
      "Y61-Y70 final parser design closure"
    ],
    safeCapabilities: [
      "approval templates",
      "redacted manifest schema",
      "parser-safe input schema",
      "local-only policy",
      "bounded prefix scan planning",
      "marker extraction contract",
      "safe prefix result schema",
      "final audit"
    ],
    blockedCapabilities: [
      "bounded prefix scanner implementation",
      "marker extraction implementation",
      "full binary parse",
      "parser implementation",
      "writer implementation",
      "real .STY output",
      "hardware validation",
      "editor validation",
      "deploy"
    ],
    finalDecision: {
      masterIndexReady: y61.status === "PASS",
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
      readOnly: true,
      planningOnly: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createY63ParserBlockedSafetyCertificate(y62) {
  return {
    format: "UAOS_Y63_PARSER_BLOCKED_SAFETY_CERTIFICATE",
    version: UAOS_Y61_Y70_VERSION,
    phase: "Y63",
    status: "PASS_LOCKED",
    certificate: {
      parserState: "LOCKED",
      implementationState: "NOT_ENABLED",
      fullParseState: "BLOCKED",
      reason: "Design contracts exist, but no explicit full parse approval and no implementation unlock."
    },
    falseClaimsBlocked: [
      "parser implemented",
      "full binary parser ready",
      "semantic parser ready",
      "roundtrip validator ready",
      "Yamaha .STY parser complete"
    ],
    finalDecision: {
      parserBlockedCertificateReady: true,
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
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY64WriterBlockedSafetyCertificate(y63) {
  return {
    format: "UAOS_Y64_WRITER_BLOCKED_SAFETY_CERTIFICATE",
    version: UAOS_Y61_Y70_VERSION,
    phase: "Y64",
    status: "PASS_LOCKED",
    certificate: {
      writerState: "LOCKED",
      target: "yamaha",
      futureFormat: ".STY",
      reason: "No parser implementation, no full parse, no checksum/package rules, no editor/hardware validation."
    },
    blockedFormats: [".STY", ".SET", ".PRS", ".STL", ".PAT", ".MSP", ".KST"],
    falseClaimsBlocked: [
      "real writer ready",
      "real .STY export ready",
      "keyboard binary output ready",
      "hardware compatible output ready",
      "production arranger file export ready"
    ],
    finalDecision: {
      writerBlockedCertificateReady: true,
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

export function createY65FinalParserDesignHandover(y61, y62, y63, y64) {
  return {
    format: "UAOS_Y65_FINAL_PARSER_DESIGN_HANDOVER",
    version: UAOS_Y61_Y70_VERSION,
    phase: "Y65",
    status: y61.status === "PASS" ? "PASS" : "FAIL",
    handover: {
      currentStatus: "YAMAHA_PARSER_DESIGN_BASELINE_CLOSED",
      targetPriority: "Yamaha .STY",
      ready: [
        "manual approval structure",
        "fixture manifest schema",
        "redacted reporting",
        "bounded prefix scan plan",
        "marker extraction contract",
        "safe prefix result schema",
        "locked parser and writer gates"
      ],
      stillBlocked: [
        "full binary parse",
        "parser implementation",
        "writer implementation",
        "real .STY output",
        "deploy"
      ],
      nextProgram: "Y71 Manual Unlock Decision Gate or stop"
    },
    finalDecision: {
      handoverReady: y61.status === "PASS",
      parserDesignBaselineClosed: y61.status === "PASS",
      allowBoundedPrefixScannerImplementation: false,
      allowMarkerExtractionImplementation: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false,
      deployAllowed: false
    },
    safety: {
      noDeploy: true,
      readOnly: true,
      planningOnly: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function createY66FinalDashboardData(y61, y62, y63, y64, y65) {
  return {
    format: "UAOS_Y66_FINAL_DASHBOARD_DATA",
    version: UAOS_Y61_Y70_VERSION,
    phase: "Y66",
    status: y61.status === "PASS" ? "PASS" : "FAIL",
    dashboard: {
      title: "UAOS Yamaha Parser Design Final Dashboard",
      finalStatus: "YAMAHA_PARSER_DESIGN_BASELINE_CLOSED",
      target: "Yamaha .STY",
      cards: [
        { title: "Design", value: "Closed", state: "pass" },
        { title: "Prefix scanner", value: "Planned only", state: "warn" },
        { title: "Parser", value: "Locked", state: "warn" },
        { title: "Writer", value: "Locked", state: "warn" },
        { title: "Deploy", value: "Not executed", state: "warn" }
      ]
    },
    finalDecision: {
      dashboardReady: y61.status === "PASS",
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

export function runY61Y70YamahaParserDesignFinalClosure() {
  const y61 = createY61FinalParserDesignAudit();
  const y62 = createY62YamahaParserDesignMasterIndex(y61);
  const y63 = createY63ParserBlockedSafetyCertificate(y62);
  const y64 = createY64WriterBlockedSafetyCertificate(y63);
  const y65 = createY65FinalParserDesignHandover(y61, y62, y63, y64);
  const y66 = createY66FinalDashboardData(y61, y62, y63, y64, y65);

  return {
    format: "UAOS_Y61_Y70_YAMAHA_PARSER_DESIGN_FINAL_CLOSURE_REPORT",
    version: UAOS_Y61_Y70_VERSION,
    phases: ["Y61", "Y62", "Y63", "Y64", "Y65", "Y66", "Y67", "Y68", "Y69", "Y70"],
    status: y61.status === "PASS" ? "PASS" : "FAIL",
    reports: { y61, y62, y63, y64, y65, y66 },
    finalDecision: {
      yamahaParserDesignBaselineClosed: y61.status === "PASS",
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
      planningOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function validateY61Y70YamahaParserDesignFinalClosure(report) {
  const errors = [];

  if (report?.format !== "UAOS_Y61_Y70_YAMAHA_PARSER_DESIGN_FINAL_CLOSURE_REPORT") errors.push("Invalid report format.");
  if (report?.status !== "PASS") errors.push("Status must be PASS.");
  if (report?.finalDecision?.yamahaParserDesignBaselineClosed !== true) errors.push("Yamaha parser design baseline must close.");
  if (report?.finalDecision?.parserUnlockReady !== false) errors.push("Parser unlock must remain false.");
  if (report?.finalDecision?.writerUnlockReady !== false) errors.push("Writer unlock must remain false.");
  if (report?.finalDecision?.allowBoundedPrefixScannerImplementation !== false) errors.push("Scanner implementation must remain blocked.");
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
  if (report?.reports?.y63?.finalDecision?.continueToParserImplementation !== false) errors.push("Y63 must block parser implementation.");
  if (report?.reports?.y64?.finalDecision?.continueToWriterImplementation !== false) errors.push("Y64 must block writer implementation.");
  if (report?.safety?.noDeploy !== true) errors.push("No deploy flag must be true.");
  if (report?.safety?.copiedFiles !== false) errors.push("Must not copy files.");
  if (report?.safety?.modifiedFixtures !== false) errors.push("Must not modify fixtures.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
