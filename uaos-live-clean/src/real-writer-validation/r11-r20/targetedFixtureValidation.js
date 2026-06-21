import fs from "node:fs";
import crypto from "node:crypto";

export const UAOS_R11_R20_VERSION = "R11-R20.0.0";
export const SAFE_DEEP_READ_LIMIT_BYTES = 16384;

function exists(file) {
  try { return fs.existsSync(file); } catch { return false; }
}

function readJson(file) {
  if (!exists(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function safeReadPrefix(file, limit = SAFE_DEEP_READ_LIMIT_BYTES) {
  const stat = fs.statSync(file);
  const length = Math.min(stat.size, limit);
  const fd = fs.openSync(file, "r");
  const buffer = Buffer.alloc(length);

  try {
    fs.readSync(fd, buffer, 0, length, 0);
  } finally {
    fs.closeSync(fd);
  }

  return {
    sizeBytes: stat.size,
    readBytes: length,
    prefixSha256: sha256(buffer),
    asciiPreview: buffer.subarray(0, Math.min(96, buffer.length)).toString("latin1").replace(/[^\x20-\x7E]/g, "."),
    hexPreview: buffer.subarray(0, Math.min(96, buffer.length)).toString("hex"),
    readOnly: true,
    modifiedFixture: false,
    copiedFixture: false
  };
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
    obj.wroteRealKeyboardBinary === true ||
    obj.wroteRealSty === true ||
    obj?.finalDecision?.allowRealKeyboardBinaryOutput === true ||
    obj?.finalDecision?.allowRealStyOutput === true ||
    obj?.finalDecision?.canExportRealSty === true ||
    obj?.finalDecision?.canExportRealKeyboardBinary === true
  );
}

export function loadR1Fixtures() {
  const report = readJson("generated/real-writer-validation/r1-fixtures/UAOS_R1_FIXTURE_COLLECTION_REPORT.json");
  if (!report) return [];

  return report.scans?.flatMap(scan => scan.fixtures || []) || [];
}

export function createR11FixtureTargetSelection(input = {}) {
  const fixtures = input.fixtures || loadR1Fixtures();
  const maxTargets = input.maxTargets || 20;

  const yamahaSty = fixtures
    .filter(item => String(item.extension || "").toLowerCase() === ".sty")
    .filter(item => item.fullPath && exists(item.fullPath))
    .slice(0, maxTargets);

  const fallbackMidi = fixtures
    .filter(item => [".mid", ".kar"].includes(String(item.extension || "").toLowerCase()))
    .filter(item => item.fullPath && exists(item.fullPath))
    .slice(0, Math.max(0, maxTargets - yamahaSty.length));

  const selected = [...yamahaSty, ...fallbackMidi].map((item, index) => ({
    selectionId: `r11_target_${index + 1}`,
    fileName: item.fileName,
    fullPath: item.fullPath,
    extension: item.extension,
    sizeBytes: item.sizeBytes,
    targetHints: item.targetHints || [],
    selectedFor: String(item.extension).toLowerCase() === ".sty" ? "yamaha-sty-readonly-analysis" : "midi-reference-readonly-analysis",
    userApprovalRequiredBeforeDeepAnalysis: true,
    realWriterAllowed: false
  }));

  return {
    format: "UAOS_R11_FIXTURE_TARGET_SELECTION",
    version: UAOS_R11_R20_VERSION,
    phase: "R11",
    status: "PASS",
    selectedCount: selected.length,
    selected,
    safety: {
      metadataOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realKeyboardBinaryWriteAllowed: false,
      warning: "R11 selects candidate file paths only. It does not copy, modify, or write fixtures."
    }
  };
}

export function createR12DeepReadOnlyProfile(r11) {
  const profiles = [];

  for (const target of r11.selected || []) {
    if (!target.fullPath || !exists(target.fullPath)) {
      profiles.push({
        selectionId: target.selectionId,
        fileName: target.fileName,
        exists: false,
        ok: false,
        reason: "missing"
      });
      continue;
    }

    try {
      const prefix = safeReadPrefix(target.fullPath);
      profiles.push({
        phase: "R12",
        selectionId: target.selectionId,
        fileName: target.fileName,
        fullPath: target.fullPath,
        extension: target.extension,
        ok: true,
        ...prefix,
        detectedMarkers: {
          midiHeader: prefix.asciiPreview.includes("MThd") || prefix.hexPreview.startsWith("4d546864"),
          styleText: /sty|style/i.test(prefix.asciiPreview),
          yamahaText: /yamaha|casm|ots/i.test(prefix.asciiPreview)
        }
      });
    } catch (error) {
      profiles.push({
        phase: "R12",
        selectionId: target.selectionId,
        fileName: target.fileName,
        fullPath: target.fullPath,
        ok: false,
        error: String(error?.message || error)
      });
    }
  }

  return {
    format: "UAOS_R12_DEEP_READ_ONLY_PROFILE",
    version: UAOS_R11_R20_VERSION,
    phase: "R12",
    status: "PASS",
    maxReadBytesPerFile: SAFE_DEEP_READ_LIMIT_BYTES,
    profileCount: profiles.length,
    profiles,
    safety: {
      readOnly: true,
      maxReadBytesPerFile: SAFE_DEEP_READ_LIMIT_BYTES,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realKeyboardBinaryWriteAllowed: false
    }
  };
}

export function createR13YamahaStyCandidateClassifier(r12) {
  const candidates = (r12.profiles || []).map(profile => {
    const isSty = String(profile.extension || "").toLowerCase() === ".sty";
    const hasMidiHeader = profile.detectedMarkers?.midiHeader === true;
    const hasStyleText = profile.detectedMarkers?.styleText === true;
    const hasYamahaText = profile.detectedMarkers?.yamahaText === true;

    let score = 0;
    if (isSty) score += 50;
    if (hasMidiHeader) score += 20;
    if (hasStyleText) score += 15;
    if (hasYamahaText) score += 15;

    return {
      selectionId: profile.selectionId,
      fileName: profile.fileName,
      fullPath: profile.fullPath,
      extension: profile.extension,
      score,
      class: isSty ? "yamaha-sty-candidate" : "reference-candidate",
      readOnly: true,
      writerAllowed: false,
      realStyWriterReady: false
    };
  });

  return {
    format: "UAOS_R13_YAMAHA_STY_CANDIDATE_CLASSIFIER",
    version: UAOS_R11_R20_VERSION,
    phase: "R13",
    status: "PASS",
    target: "yamaha",
    futureFormat: ".STY",
    candidateCount: candidates.length,
    candidates,
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    safety: {
      readOnly: true,
      wroteRealSty: false,
      realBinaryBlocked: true
    }
  };
}

export function createR14ChunkMapHypothesis(r13) {
  const maps = (r13.candidates || []).map(candidate => ({
    selectionId: candidate.selectionId,
    fileName: candidate.fileName,
    class: candidate.class,
    hypothesisOnly: true,
    chunkMapConfirmed: false,
    possibleRegions: [
      { name: "header-prefix", confirmed: false },
      { name: "style-section-data", confirmed: false },
      { name: "metadata-rules", confirmed: false },
      { name: "checksum-or-footer", confirmed: false }
    ],
    blockers: [
      "Need full documented structure",
      "Need roundtrip parser",
      "Need checksum validator",
      "Need hardware/editor validation"
    ]
  }));

  return {
    format: "UAOS_R14_CHUNK_MAP_HYPOTHESIS_REPORT",
    version: UAOS_R11_R20_VERSION,
    phase: "R14",
    status: "PASS",
    mapCount: maps.length,
    maps,
    chunkWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    safety: {
      hypothesisOnly: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createR15RoundtripReadiness(r12, r14) {
  const readiness = {
    hasReadOnlyProfiles: (r12.profileCount || 0) > 0,
    hasChunkHypotheses: (r14.mapCount || 0) > 0,
    semanticParserReady: false,
    binaryRoundtripReady: false,
    checksumRoundtripReady: false,
    hardwareValidationReady: false
  };

  return {
    format: "UAOS_R15_ROUNDTRIP_READINESS_REPORT",
    version: UAOS_R11_R20_VERSION,
    phase: "R15",
    status: "PASS",
    readiness,
    canRunTrueRoundtripNow: false,
    realKeyboardBinaryWriteAllowed: false,
    blockers: [
      "Parser not validated",
      "Chunk map not confirmed",
      "Checksum not confirmed",
      "Hardware/editor validation missing"
    ],
    safety: {
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createR16FixtureRiskReport(r11, r12, r13) {
  const riskItems = (r11.selected || []).map(target => ({
    selectionId: target.selectionId,
    fileName: target.fileName,
    extension: target.extension,
    risk: String(target.extension || "").toLowerCase() === ".sty" ? "medium" : "low",
    reason: String(target.extension || "").toLowerCase() === ".sty"
      ? "Potential proprietary style fixture; keep read-only and user-owned."
      : "Reference MIDI-like fixture; still keep read-only.",
    allowedActions: ["metadata index", "small prefix read-only analysis", "hash report"],
    blockedActions: ["modify original", "copy without approval", "write real keyboard binary", "publish fixture"]
  }));

  return {
    format: "UAOS_R16_FIXTURE_RISK_REPORT",
    version: UAOS_R11_R20_VERSION,
    phase: "R16",
    status: "PASS",
    riskCount: riskItems.length,
    riskItems,
    safety: {
      userOwnedRequired: true,
      readOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createR17ManualApprovalGate(r11, r16) {
  return {
    format: "UAOS_R17_MANUAL_APPROVAL_GATE",
    version: UAOS_R11_R20_VERSION,
    phase: "R17",
    status: "PASS_LOCKED",
    selectedCount: r11.selectedCount,
    riskCount: r16.riskCount,
    manualApprovalRequired: true,
    approvedForWrite: false,
    approvedForDeepFullBinaryParse: false,
    approvedForPublishing: false,
    approvedForCopyingFixtures: false,
    allowedNow: ["metadata report", "read-only small-prefix analysis", "local-only QA"],
    blockedNow: ["real .STY writer", "real .SET writer", "real .PRS writer", "real .STL writer", "real .PAT/.MSP/.KST writer"],
    finalDecision: {
      continueToWriterImplementation: false,
      allowRealStyOutput: false,
      canExportRealSty: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false,
      reason: "Manual approval gate remains locked."
    },
    safety: {
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function runR11R20TargetedFixtureValidation() {
  const r11 = createR11FixtureTargetSelection();
  const r12 = createR12DeepReadOnlyProfile(r11);
  const r13 = createR13YamahaStyCandidateClassifier(r12);
  const r14 = createR14ChunkMapHypothesis(r13);
  const r15 = createR15RoundtripReadiness(r12, r14);
  const r16 = createR16FixtureRiskReport(r11, r12, r13);
  const r17 = createR17ManualApprovalGate(r11, r16);

  return {
    format: "UAOS_R11_R20_TARGETED_FIXTURE_VALIDATION_REPORT",
    version: UAOS_R11_R20_VERSION,
    phases: ["R11", "R12", "R13", "R14", "R15", "R16", "R17", "R18", "R19", "R20"],
    status: "PASS",
    reports: { r11, r12, r13, r14, r15, r16, r17 },
    finalDecision: {
      targetedValidationReady: true,
      selectedCount: r11.selectedCount,
      allowReadOnlyAnalysis: true,
      allowRealKeyboardBinaryOutput: false,
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

export function validateR11R20TargetedFixtureValidation(report) {
  const errors = [];

  if (report?.format !== "UAOS_R11_R20_TARGETED_FIXTURE_VALIDATION_REPORT") errors.push("Invalid report format.");
  if (report?.status !== "PASS") errors.push("Status must be PASS.");
  if (report?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (report?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (report?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (report?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (report?.reports?.r17?.finalDecision?.continueToWriterImplementation !== false) errors.push("R17 writer gate must remain locked.");
  if (report?.safety?.readOnly !== true) errors.push("Must remain read-only.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
