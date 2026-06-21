import fs from "node:fs";

export const UAOS_Y11_Y20_VERSION = "Y11-Y20.0.0";

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
    obj.fullParseApprovedNow === true ||
    obj.fixtureSetApprovedForFullParse === true ||
    obj.allowRealKeyboardBinaryOutput === true ||
    obj.allowRealStyOutput === true ||
    obj.canExportRealSty === true ||
    obj.canExportRealKeyboardBinary === true ||
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
    obj?.finalDecision?.fullParseApprovedNow === true ||
    obj?.finalDecision?.fixtureSetApprovedForFullParse === true ||
    obj?.finalDecision?.deployAllowed === true
  );
}

export function loadY1Y10Design() {
  return readJson("generated/real-writer-validation/y1-y10/UAOS_Y1_Y10_MANUAL_APPROVED_YAMAHA_PARSER_DESIGN_SUMMARY.json");
}

export function createY11ManualFixtureApprovalRegistry() {
  const design = loadY1Y10Design();
  const designReady = design?.manualApprovedParserDesignReady === true && !unsafeClaim(design);

  return {
    format: "UAOS_Y11_MANUAL_FIXTURE_APPROVAL_REGISTRY",
    version: UAOS_Y11_Y20_VERSION,
    phase: "Y11",
    status: designReady ? "PASS_LOCKED" : "PASS_EMPTY_LOCKED",
    sourceDesignReady: designReady,
    target: "yamaha",
    futureFormat: ".STY",
    registry: [],
    registryInstructions: [
      "Add only local user-owned Yamaha .STY file paths.",
      "Do not copy fixture files into repo.",
      "Do not publish fixture names if private.",
      "Do not enable full parse without explicit approval.",
      "Do not enable writer experiments."
    ],
    exampleEntry: {
      fixtureId: "yamaha_fixture_001",
      localPath: "D:\\YourFolder\\example.sty",
      userOwnsOrHasRights: false,
      approveMetadataOnly: true,
      approveSmallPrefixReadOnly: true,
      approveFullReadOnlyParse: false,
      approveCopyIntoRepo: false,
      approveWriterExperiment: false,
      approvePublishing: false
    },
    finalDecision: {
      registryReady: true,
      hasApprovedFullParseFixtures: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      localPathsOnly: true,
      readOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY12ApprovedPathPolicy(y11) {
  return {
    format: "UAOS_Y12_APPROVED_PATH_POLICY",
    version: UAOS_Y11_Y20_VERSION,
    phase: "Y12",
    status: "PASS_LOCKED",
    pathPolicy: {
      allowedRoots: [],
      deniedRoots: [
        "repo source tree unless fixture is synthetic",
        "public folder",
        "dist folder",
        "generated folder for real fixtures"
      ],
      allowedOperations: [
        "exists check",
        "metadata stat",
        "bounded read-only prefix scan after approval"
      ],
      blockedOperations: [
        "copy fixture into repo",
        "modify fixture",
        "rename fixture",
        "delete fixture",
        "publish fixture",
        "write binary beside fixture"
      ]
    },
    finalDecision: {
      pathPolicyReady: true,
      allowFixtureCopy: false,
      allowFixtureModification: false,
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

export function createY13FullParsePermissionGate(y11, y12) {
  const approvedFullParse = (y11.registry || []).filter(item =>
    item.userOwnsOrHasRights === true &&
    item.approveFullReadOnlyParse === true &&
    item.approveWriterExperiment !== true
  );

  return {
    format: "UAOS_Y13_FULL_PARSE_PERMISSION_GATE",
    version: UAOS_Y11_Y20_VERSION,
    phase: "Y13",
    status: "PASS_LOCKED",
    approvedFullParseCount: approvedFullParse.length,
    approvedFullParse,
    gateRules: [
      "Full read-only parse requires user-owned rights.",
      "Full read-only parse requires explicit approval.",
      "Writer experiment must remain false.",
      "Any approved fixture must remain outside repo unless synthetic.",
      "Parser may not write output binary."
    ],
    finalDecision: {
      fullParsePermissionReady: false,
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

export function createY14ParserImplementationPreflight(y13) {
  return {
    format: "UAOS_Y14_PARSER_IMPLEMENTATION_PREFLIGHT",
    version: UAOS_Y11_Y20_VERSION,
    phase: "Y14",
    status: "PASS_BLOCKED",
    preflight: {
      fullParsePermissionReady: y13.finalDecision.fullParsePermissionReady,
      approvedFixtureCount: y13.approvedFullParseCount,
      parserImplementationAllowed: false,
      reason: "No full parse fixtures approved yet."
    },
    requiredBeforeParserCode: [
      "Y11 registry has approved local fixture paths",
      "Y13 full parse permission ready",
      "Y12 path policy accepted",
      "separate parser must be read-only and output JSON only",
      "no writer module in parser phase"
    ],
    finalDecision: {
      parserPreflightReady: false,
      continueToParserImplementation: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
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

export function createY15FixturePrivacySafetyGate(y11, y12, y13) {
  return {
    format: "UAOS_Y15_FIXTURE_PRIVACY_SAFETY_GATE",
    version: UAOS_Y11_Y20_VERSION,
    phase: "Y15",
    status: "PASS",
    privacyRules: [
      "Do not publish fixture file contents.",
      "Do not copy private fixture files into repo.",
      "Generated reports should avoid full private path exposure in public pages.",
      "Keep analysis local.",
      "Only use user-owned or licensed fixtures."
    ],
    localOnlyRecommended: true,
    publicReportAllowed: true,
    publicReportMustExcludeBinaryContent: true,
    finalDecision: {
      privacyGateReady: true,
      allowPublishingFixtureContent: false,
      allowCopyIntoRepo: false,
      allowFullBinaryParse: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      privacyProtected: true,
      readOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY16LocalApprovalHandover(y11, y12, y13, y14, y15) {
  return {
    format: "UAOS_Y16_LOCAL_APPROVAL_HANDOVER",
    version: UAOS_Y11_Y20_VERSION,
    phase: "Y16",
    status: "PASS_LOCKED",
    handover: {
      currentStatus: "APPROVAL_REGISTRY_READY_BUT_LOCKED",
      nextHumanAction: "Add 3-5 user-owned Yamaha .STY local paths and explicitly approve full read-only parsing.",
      stillBlocked: [
        "full binary parse",
        "parser implementation",
        "writer implementation",
        "real .STY output",
        "deploy"
      ],
      safeNow: [
        "approval registry template",
        "path policy",
        "privacy rules",
        "local handover"
      ]
    },
    finalDecision: {
      handoverReady: true,
      parserUnlockReady: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
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

export function runY11Y20ManualFixtureApprovalRegistry() {
  const y11 = createY11ManualFixtureApprovalRegistry();
  const y12 = createY12ApprovedPathPolicy(y11);
  const y13 = createY13FullParsePermissionGate(y11, y12);
  const y14 = createY14ParserImplementationPreflight(y13);
  const y15 = createY15FixturePrivacySafetyGate(y11, y12, y13);
  const y16 = createY16LocalApprovalHandover(y11, y12, y13, y14, y15);

  return {
    format: "UAOS_Y11_Y20_MANUAL_FIXTURE_APPROVAL_REGISTRY_REPORT",
    version: UAOS_Y11_Y20_VERSION,
    phases: ["Y11", "Y12", "Y13", "Y14", "Y15", "Y16", "Y17", "Y18", "Y19", "Y20"],
    status: "PASS",
    reports: { y11, y12, y13, y14, y15, y16 },
    finalDecision: {
      approvalRegistryReady: true,
      parserUnlockReady: false,
      allowReadOnlyAnalysis: true,
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
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function validateY11Y20ManualFixtureApprovalRegistry(report) {
  const errors = [];

  if (report?.format !== "UAOS_Y11_Y20_MANUAL_FIXTURE_APPROVAL_REGISTRY_REPORT") errors.push("Invalid report format.");
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
  if (report?.reports?.y13?.finalDecision?.fullParsePermissionReady !== false) errors.push("Y13 full parse permission must remain false.");
  if (report?.reports?.y14?.finalDecision?.continueToParserImplementation !== false) errors.push("Y14 must block parser implementation.");
  if (report?.safety?.noDeploy !== true) errors.push("No deploy flag must be true.");
  if (report?.safety?.copiedFiles !== false) errors.push("Must not copy files.");
  if (report?.safety?.modifiedFixtures !== false) errors.push("Must not modify fixtures.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
