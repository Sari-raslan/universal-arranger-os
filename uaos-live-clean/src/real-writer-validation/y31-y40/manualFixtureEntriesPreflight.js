import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

export const UAOS_Y31_Y40_VERSION = "Y31-Y40.0.0";

function exists(file) {
  try { return fs.existsSync(file); } catch { return false; }
}

function statSafe(file) {
  try { return fs.statSync(file); } catch { return null; }
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

function normalizeExt(filePath) {
  return path.extname(String(filePath || "")).toLowerCase();
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

export function loadY21Y30ManifestBaseline() {
  return readJson("generated/real-writer-validation/y21-y30/UAOS_Y21_Y30_APPROVED_FIXTURE_MANIFEST_SUMMARY.json");
}

export function getEnvFixturePaths() {
  return [
    process.env.UAOS_YAMAHA_STY_FIXTURE_1,
    process.env.UAOS_YAMAHA_STY_FIXTURE_2,
    process.env.UAOS_YAMAHA_STY_FIXTURE_3,
    process.env.UAOS_YAMAHA_STY_FIXTURE_4,
    process.env.UAOS_YAMAHA_STY_FIXTURE_5
  ].filter(Boolean);
}

export function createY31ManualFixtureEntries() {
  const baseline = loadY21Y30ManifestBaseline();
  const baselineReady = baseline?.approvedFixtureManifestBaselineReady === true && !unsafeClaim(baseline);
  const envPaths = getEnvFixturePaths();

  const entries = envPaths.map((fixturePath, index) => {
    const ext = normalizeExt(fixturePath);
    const stat = statSafe(fixturePath);
    const isSty = ext === ".sty";

    return {
      fixtureId: `yamaha_fixture_${String(index + 1).padStart(3, "0")}`,
      redactedPath: redactedPath(fixturePath),
      pathHash: hashText(fixturePath),
      extension: ext,
      exists: exists(fixturePath),
      fileSizeBytes: stat?.isFile() ? stat.size : null,
      isFile: stat?.isFile() === true,
      isYamahaStyCandidate: isSty,
      approveMetadataOnly: true,
      approveSmallPrefixReadOnly: isSty,
      approveFullReadOnlyParse: false,
      approveCopyIntoRepo: false,
      approveWriterExperiment: false,
      approvePublishing: false,
      privateFullPathNotCommitted: true
    };
  });

  return {
    format: "UAOS_Y31_MANUAL_FIXTURE_ENTRIES",
    version: UAOS_Y31_Y40_VERSION,
    phase: "Y31",
    status: baselineReady ? "PASS" : "PASS_BASELINE_MISSING",
    sourceBaselineReady: baselineReady,
    envFixtureCount: envPaths.length,
    entryCount: entries.length,
    entries,
    instructions: [
      "Optional: set UAOS_YAMAHA_STY_FIXTURE_1..5 to local user-owned .sty paths before running.",
      "Only redacted paths and hashes are committed.",
      "Private full paths are not written to generated JSON.",
      "Full parse remains false.",
      "Writer experiment remains false."
    ],
    finalDecision: {
      manualEntriesReady: true,
      hasFullParseApprovedEntries: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      privatePathsRedacted: true,
      readOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createY32LocalPathExistenceValidator(y31) {
  const validations = (y31.entries || []).map(entry => ({
    fixtureId: entry.fixtureId,
    redactedPath: entry.redactedPath,
    pathHash: entry.pathHash,
    extension: entry.extension,
    exists: entry.exists,
    isFile: entry.isFile,
    fileSizeBytes: entry.fileSizeBytes,
    validForMetadata: entry.exists === true && entry.isFile === true && entry.isYamahaStyCandidate === true,
    validForSmallPrefixReadOnly: entry.exists === true && entry.isFile === true && entry.isYamahaStyCandidate === true,
    validForFullReadOnlyParse: false,
    reason: entry.isYamahaStyCandidate ? "Yamaha .STY candidate path metadata only." : "Not a .sty candidate or missing."
  }));

  return {
    format: "UAOS_Y32_LOCAL_PATH_EXISTENCE_VALIDATOR",
    version: UAOS_Y31_Y40_VERSION,
    phase: "Y32",
    status: "PASS",
    validationCount: validations.length,
    validations,
    finalDecision: {
      localPathValidationReady: true,
      allowMetadataOnly: true,
      allowSmallPrefixReadOnly: true,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
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

export function createY33RedactedApprovedManifestBuilder(y31, y32) {
  const approvedMetadata = (y32.validations || [])
    .filter(item => item.validForMetadata)
    .map(item => ({
      fixtureId: item.fixtureId,
      redactedPath: item.redactedPath,
      pathHash: item.pathHash,
      extension: item.extension,
      fileSizeBytes: item.fileSizeBytes,
      approvedForMetadataOnly: true,
      approvedForSmallPrefixReadOnly: true,
      approvedForFullReadOnlyParse: false,
      approvedForWriterExperiment: false
    }));

  return {
    format: "UAOS_Y33_REDACTED_APPROVED_MANIFEST_BUILDER",
    version: UAOS_Y31_Y40_VERSION,
    phase: "Y33",
    status: "PASS",
    approvedMetadataCount: approvedMetadata.length,
    approvedMetadata,
    finalDecision: {
      redactedApprovedManifestReady: true,
      allowMetadataOnly: true,
      allowSmallPrefixReadOnly: true,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false
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

export function createY34ParserPreflightReport(y31, y32, y33) {
  return {
    format: "UAOS_Y34_PARSER_PREFLIGHT_REPORT",
    version: UAOS_Y31_Y40_VERSION,
    phase: "Y34",
    status: "PASS_BLOCKED",
    target: "yamaha",
    futureFormat: ".STY",
    preflight: {
      manifestEntries: y31.entryCount,
      existingStyCandidates: (y32.validations || []).filter(v => v.validForMetadata).length,
      redactedApprovedMetadataEntries: y33.approvedMetadataCount,
      fullParseApprovedEntries: 0,
      parserImplementationAllowed: false,
      writerImplementationAllowed: false
    },
    blockers: [
      "No entry approves full read-only parse.",
      "No parser implementation approval.",
      "No full binary parse approval.",
      "Writer remains explicitly blocked."
    ],
    finalDecision: {
      parserPreflightReady: true,
      parserUnlockReady: false,
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

export function createY35FullParseGate(y34) {
  return {
    format: "UAOS_Y35_FULL_PARSE_GATE",
    version: UAOS_Y31_Y40_VERSION,
    phase: "Y35",
    status: "PASS_LOCKED",
    approvedFullParseEntries: [],
    requirementsToUnlock: [
      "explicit approveFullReadOnlyParse true for selected fixtures",
      "fixtures must be user-owned/licensed",
      "private full paths must remain local",
      "parser must output JSON only",
      "writer module must not exist in parser phase"
    ],
    finalDecision: {
      fullParseGateReady: true,
      fullParseUnlocked: false,
      allowFullBinaryParse: false,
      allowParserImplementation: false,
      allowWriterImplementation: false,
      allowRealStyOutput: false,
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

export function createY36WriterGate(y35) {
  return {
    format: "UAOS_Y36_WRITER_GATE",
    version: UAOS_Y31_Y40_VERSION,
    phase: "Y36",
    status: "PASS_LOCKED",
    target: "yamaha",
    futureFormat: ".STY",
    blockedWriterActions: [
      "write .STY",
      "write .SET",
      "write .PRS",
      "write .STL",
      "write .PAT/.MSP/.KST",
      "modify fixtures",
      "create binary patch",
      "claim hardware compatibility"
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

export function runY31Y40ManualFixtureEntriesPreflight() {
  const y31 = createY31ManualFixtureEntries();
  const y32 = createY32LocalPathExistenceValidator(y31);
  const y33 = createY33RedactedApprovedManifestBuilder(y31, y32);
  const y34 = createY34ParserPreflightReport(y31, y32, y33);
  const y35 = createY35FullParseGate(y34);
  const y36 = createY36WriterGate(y35);

  return {
    format: "UAOS_Y31_Y40_MANUAL_FIXTURE_ENTRIES_PREFLIGHT_REPORT",
    version: UAOS_Y31_Y40_VERSION,
    phases: ["Y31", "Y32", "Y33", "Y34", "Y35", "Y36", "Y37", "Y38", "Y39", "Y40"],
    status: "PASS",
    reports: { y31, y32, y33, y34, y35, y36 },
    finalDecision: {
      manualFixtureEntriesPreflightReady: true,
      parserUnlockReady: false,
      allowReadOnlyAnalysis: true,
      allowSmallPrefixReadOnly: true,
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

export function validateY31Y40ManualFixtureEntriesPreflight(report) {
  const errors = [];

  if (report?.format !== "UAOS_Y31_Y40_MANUAL_FIXTURE_ENTRIES_PREFLIGHT_REPORT") errors.push("Invalid report format.");
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
  if (report?.reports?.y34?.finalDecision?.continueToParserImplementation !== false) errors.push("Y34 must block parser implementation.");
  if (report?.reports?.y35?.finalDecision?.fullParseUnlocked !== false) errors.push("Y35 full parse must remain locked.");
  if (report?.reports?.y36?.finalDecision?.continueToWriterImplementation !== false) errors.push("Y36 must block writer implementation.");
  if (report?.safety?.noDeploy !== true) errors.push("No deploy flag must be true.");
  if (report?.safety?.copiedFiles !== false) errors.push("Must not copy files.");
  if (report?.safety?.modifiedFixtures !== false) errors.push("Must not modify fixtures.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
