import fs from "node:fs";
import crypto from "node:crypto";

export const UAOS_Y21_Y30_VERSION = "Y21-Y30.0.0";

function exists(file) {
  try { return fs.existsSync(file); } catch { return false; }
}

function readJson(file) {
  if (!exists(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function hashText(text) {
  return crypto.createHash("sha256").update(String(text || "")).digest("hex");
}

function redactedPath(filePath) {
  if (!filePath) return "";
  const parts = String(filePath).split(/[\\/]+/);
  const file = parts[parts.length - 1] || "";
  const drive = /^[A-Za-z]:/.test(parts[0] || "") ? parts[0] : "";
  return drive ? `${drive}\\...\\${file}` : `...\\${file}`;
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
    obj?.finalDecision?.fullParsePermissionReady === true ||
    obj?.finalDecision?.deployAllowed === true
  );
}

export function loadY11Y20Registry() {
  return readJson("generated/real-writer-validation/y11-y20/UAOS_Y11_Y20_MANUAL_FIXTURE_APPROVAL_REGISTRY_SUMMARY.json");
}

export function createY21ApprovedFixtureManifest() {
  const registry = loadY11Y20Registry();
  const registryReady = registry?.approvalRegistryReady === true && !unsafeClaim(registry);

  return {
    format: "UAOS_Y21_APPROVED_FIXTURE_MANIFEST",
    version: UAOS_Y21_Y30_VERSION,
    phase: "Y21",
    status: registryReady ? "PASS_LOCKED" : "PASS_EMPTY_LOCKED",
    sourceRegistryReady: registryReady,
    target: "yamaha",
    futureFormat: ".STY",
    approvedFixtureManifest: [],
    manifestRules: [
      "Only user-owned Yamaha .STY local paths may be listed.",
      "Only path hash and redacted path may be committed.",
      "No fixture file content is copied into repo.",
      "No full parse until explicit approval entry is complete.",
      "No writer test in this phase."
    ],
    exampleManifestEntry: {
      fixtureId: "yamaha_fixture_001",
      redactedPath: "D:\\...\\example.sty",
      pathHash: hashText("D:\\YourFolder\\example.sty"),
      extension: ".sty",
      approveMetadataOnly: true,
      approveSmallPrefixReadOnly: true,
      approveFullReadOnlyParse: false,
      approveCopyIntoRepo: false,
      approveWriterExperiment: false,
      approvePublishing: false
    },
    finalDecision: {
      manifestReady: true,
      hasApprovedFullParseFixtures: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      redactedPathsOnly: true,
      readOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY22ParserSafeInputModel(y21) {
  return {
    format: "UAOS_Y22_PARSER_SAFE_INPUT_MODEL",
    version: UAOS_Y21_Y30_VERSION,
    phase: "Y22",
    status: "PASS_LOCKED",
    inputModel: {
      fixtureId: "",
      redactedPath: "",
      pathHash: "",
      extension: ".sty",
      fileSizeBytes: null,
      metadataHash: "",
      allowedReadBytes: 0,
      allowFullReadOnlyParse: false,
      allowBinaryWrite: false,
      allowOutputSty: false
    },
    allowedFields: [
      "fixtureId",
      "redactedPath",
      "pathHash",
      "extension",
      "fileSizeBytes",
      "metadataHash",
      "allowedReadBytes"
    ],
    blockedFields: [
      "rawBinary",
      "fullFileContent",
      "privateFullPathForPublicReport",
      "outputStyBytes",
      "writerPatchBytes"
    ],
    finalDecision: {
      parserSafeInputModelReady: true,
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

export function createY23RedactedFixtureReport(y21, y22) {
  return {
    format: "UAOS_Y23_REDACTED_FIXTURE_REPORT",
    version: UAOS_Y21_Y30_VERSION,
    phase: "Y23",
    status: "PASS",
    reportPolicy: {
      includeRedactedPath: true,
      includePathHash: true,
      includeFileName: true,
      includeFullPath: false,
      includeBinaryContent: false,
      includePrivateFixtureContent: false,
      includeStyOutput: false
    },
    sampleRedaction: {
      originalExample: "D:\\YourPrivateFolder\\Styles\\example.sty",
      redacted: redactedPath("D:\\YourPrivateFolder\\Styles\\example.sty"),
      pathHash: hashText("D:\\YourPrivateFolder\\Styles\\example.sty")
    },
    finalDecision: {
      redactedReportReady: true,
      allowPrivatePathPublishing: false,
      allowBinaryContentPublishing: false,
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

export function createY24LocalOnlyAnalysisPolicy(y23) {
  return {
    format: "UAOS_Y24_LOCAL_ONLY_ANALYSIS_POLICY",
    version: UAOS_Y21_Y30_VERSION,
    phase: "Y24",
    status: "PASS",
    policy: {
      analysisLocation: "local-machine-only",
      networkUploadAllowed: false,
      deployAllowed: false,
      publishReportsAllowed: true,
      publishBinaryContentAllowed: false,
      copyFixturesAllowed: false,
      modifyFixturesAllowed: false
    },
    finalDecision: {
      localOnlyPolicyReady: true,
      allowNetworkUploadOfFixtures: false,
      deployAllowed: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      localOnly: true,
      noDeploy: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY25ParserUnlockBlocker(y21, y22, y23, y24) {
  return {
    format: "UAOS_Y25_PARSER_UNLOCK_BLOCKER",
    version: UAOS_Y21_Y30_VERSION,
    phase: "Y25",
    status: "PASS_BLOCKED",
    blockers: [
      { item: "no approved fixture entries yet", blocksParser: true },
      { item: "full read-only parse not approved", blocksParser: true },
      { item: "parser safe input model is schema-only", blocksParser: true },
      { item: "local-only policy does not unlock full parse", blocksParser: true },
      { item: "no semantic parser implementation approval", blocksParser: true }
    ],
    finalDecision: {
      parserUnlockReady: false,
      continueToParserImplementation: false,
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

export function createY26NextParserRoadmap(y25) {
  return {
    format: "UAOS_Y26_NEXT_PARSER_ROADMAP",
    version: UAOS_Y21_Y30_VERSION,
    phase: "Y26",
    status: "PASS",
    nextProgram: "Y31 Manual Fixture Entry + Read-only Parser Preflight",
    nextSteps: [
      {
        id: "Y31",
        name: "Add real approved fixture manifest entries",
        allowed: true,
        requiresUserInput: true,
        writesBinary: false
      },
      {
        id: "Y32",
        name: "Validate fixture paths exist locally",
        allowed: true,
        requiresUserInput: true,
        writesBinary: false
      },
      {
        id: "Y33",
        name: "Create parser preflight report",
        allowed: true,
        writesBinary: false
      },
      {
        id: "Y34",
        name: "Unlock read-only full parse only if explicitly approved",
        allowed: false,
        writesBinary: false
      },
      {
        id: "Y35",
        name: "Real writer remains blocked",
        allowed: false,
        writesBinary: true
      }
    ],
    finalDecision: {
      roadmapReady: true,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
    },
    safety: {
      planningOnly: true,
      readOnly: true,
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function runY21Y30ApprovedFixtureManifest() {
  const y21 = createY21ApprovedFixtureManifest();
  const y22 = createY22ParserSafeInputModel(y21);
  const y23 = createY23RedactedFixtureReport(y21, y22);
  const y24 = createY24LocalOnlyAnalysisPolicy(y23);
  const y25 = createY25ParserUnlockBlocker(y21, y22, y23, y24);
  const y26 = createY26NextParserRoadmap(y25);

  return {
    format: "UAOS_Y21_Y30_APPROVED_FIXTURE_MANIFEST_REPORT",
    version: UAOS_Y21_Y30_VERSION,
    phases: ["Y21", "Y22", "Y23", "Y24", "Y25", "Y26", "Y27", "Y28", "Y29", "Y30"],
    status: "PASS",
    reports: { y21, y22, y23, y24, y25, y26 },
    finalDecision: {
      approvedFixtureManifestBaselineReady: true,
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
      redactedReportsOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function validateY21Y30ApprovedFixtureManifest(report) {
  const errors = [];

  if (report?.format !== "UAOS_Y21_Y30_APPROVED_FIXTURE_MANIFEST_REPORT") errors.push("Invalid report format.");
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
  if (report?.reports?.y25?.finalDecision?.continueToParserImplementation !== false) errors.push("Y25 must block parser implementation.");
  if (report?.safety?.noDeploy !== true) errors.push("No deploy flag must be true.");
  if (report?.safety?.copiedFiles !== false) errors.push("Must not copy files.");
  if (report?.safety?.modifiedFixtures !== false) errors.push("Must not modify fixtures.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
