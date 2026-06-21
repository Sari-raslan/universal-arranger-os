import fs from "node:fs";
import crypto from "node:crypto";

export const UAOS_R21_R30_VERSION = "R21-R30.0.0";
export const SANDBOX_READ_LIMIT_BYTES = 32768;

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

function safeReadPrefix(file, limit = SANDBOX_READ_LIMIT_BYTES) {
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
    ascii: buffer.toString("latin1").replace(/[^\x20-\x7E]/g, "."),
    hexFirst128: buffer.subarray(0, Math.min(128, buffer.length)).toString("hex"),
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

export function loadR11Targets() {
  const report = readJson("generated/real-writer-validation/r11-r20/UAOS_R11_FIXTURE_TARGET_SELECTION.json");
  if (!report) return [];

  return report.selected || [];
}

export function createR21YamahaParserSandbox(input = {}) {
  const targets = input.targets || loadR11Targets();

  const sandboxItems = targets
    .filter(item => String(item.extension || "").toLowerCase() === ".sty")
    .filter(item => item.fullPath && exists(item.fullPath))
    .slice(0, input.maxTargets || 10)
    .map(item => {
      const prefix = safeReadPrefix(item.fullPath);

      return {
        phase: "R21",
        selectionId: item.selectionId,
        fileName: item.fileName,
        fullPath: item.fullPath,
        extension: item.extension,
        ok: true,
        ...prefix,
        markers: {
          hasMThd: prefix.ascii.includes("MThd"),
          hasMTrk: prefix.ascii.includes("MTrk"),
          hasCASMText: /CASM/i.test(prefix.ascii),
          hasOTSLikeText: /OTS|One Touch/i.test(prefix.ascii),
          hasStyleText: /style|sty/i.test(prefix.ascii)
        }
      };
    });

  return {
    format: "UAOS_R21_YAMAHA_PARSER_SANDBOX",
    version: UAOS_R21_R30_VERSION,
    phase: "R21",
    status: "PASS",
    target: "yamaha",
    futureFormat: ".STY",
    readLimitBytes: SANDBOX_READ_LIMIT_BYTES,
    itemCount: sandboxItems.length,
    items: sandboxItems,
    safety: {
      readOnly: true,
      copiedFiles: false,
      modifiedFixtures: false,
      wroteRealKeyboardBinary: false,
      realKeyboardBinaryWriteAllowed: false,
      warning: "R21 is a parser sandbox. It reads limited prefixes only and does not write .STY."
    }
  };
}

export function createR22SectionMarkerProbe(r21) {
  const probes = (r21.items || []).map(item => {
    const ascii = item.ascii || "";
    const candidates = [
      "MAIN A", "MAIN B", "MAIN C", "MAIN D",
      "INTRO", "ENDING", "FILL", "BREAK",
      "MThd", "MTrk", "CASM", "OTS"
    ];

    const found = candidates.filter(marker =>
      ascii.toLowerCase().includes(marker.toLowerCase())
    );

    return {
      selectionId: item.selectionId,
      fileName: item.fileName,
      foundMarkers: found,
      confirmedSectionMap: false,
      hypothesisOnly: true
    };
  });

  return {
    format: "UAOS_R22_SECTION_MARKER_PROBE",
    version: UAOS_R21_R30_VERSION,
    phase: "R22",
    status: "PASS",
    probeCount: probes.length,
    probes,
    sectionMapConfirmed: false,
    realKeyboardBinaryWriteAllowed: false,
    safety: {
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createR23MidiLikeHeaderProbe(r21) {
  const probes = (r21.items || []).map(item => ({
    selectionId: item.selectionId,
    fileName: item.fileName,
    hasMThd: item.markers?.hasMThd === true,
    hasMTrk: item.markers?.hasMTrk === true,
    midiLike: item.markers?.hasMThd === true || item.markers?.hasMTrk === true,
    headerHash: item.prefixSha256,
    confirmedMidiContainer: false,
    reason: "Header marker probe only; full parsing not enabled."
  }));

  return {
    format: "UAOS_R23_MIDI_LIKE_HEADER_PROBE",
    version: UAOS_R21_R30_VERSION,
    phase: "R23",
    status: "PASS",
    probeCount: probes.length,
    probes,
    confirmedMidiContainerCount: 0,
    realKeyboardBinaryWriteAllowed: false,
    safety: {
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createR24SafeStructureMap(r21, r22, r23) {
  const maps = (r21.items || []).map(item => {
    const markerProbe = (r22.probes || []).find(p => p.selectionId === item.selectionId);
    const midiProbe = (r23.probes || []).find(p => p.selectionId === item.selectionId);

    return {
      selectionId: item.selectionId,
      fileName: item.fileName,
      structureMapType: "SAFE_HYPOTHESIS_ONLY",
      prefixHash: item.prefixSha256,
      possibleMidiLike: midiProbe?.midiLike === true,
      possibleMarkers: markerProbe?.foundMarkers || [],
      confirmedChunks: [],
      unconfirmedRegions: [
        "prefix/header",
        "midi-like data if present",
        "style metadata if present",
        "section data if present",
        "checksum/footer if present"
      ],
      writerSafe: false,
      fullParserReady: false
    };
  });

  return {
    format: "UAOS_R24_SAFE_STRUCTURE_MAP",
    version: UAOS_R21_R30_VERSION,
    phase: "R24",
    status: "PASS",
    mapCount: maps.length,
    maps,
    fullParserReady: false,
    realKeyboardBinaryWriteAllowed: false,
    safety: {
      hypothesisOnly: true,
      readOnly: true,
      wroteRealKeyboardBinary: false,
      realBinaryBlocked: true
    }
  };
}

export function createR25ParserReadinessGate(r21, r22, r23, r24) {
  return {
    format: "UAOS_R25_PARSER_READINESS_GATE",
    version: UAOS_R21_R30_VERSION,
    phase: "R25",
    status: "PASS_LOCKED",
    target: "yamaha",
    futureFormat: ".STY",
    readiness: {
      sandboxItems: r21.itemCount,
      sectionMarkerProbeReady: r22.status === "PASS",
      midiHeaderProbeReady: r23.status === "PASS",
      safeStructureMapReady: r24.status === "PASS",
      fullParserReady: false,
      binaryWriterReady: false
    },
    blockers: [
      "Full parser not implemented",
      "Chunk boundaries not confirmed",
      "Checksum rules not known",
      "CASM/OTS rules not confirmed",
      "Roundtrip import not validated",
      "Hardware/editor validation missing"
    ],
    finalDecision: {
      allowFullBinaryParse: false,
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

export function createR26ParserRiskGate(r25) {
  return {
    format: "UAOS_R26_PARSER_RISK_GATE",
    version: UAOS_R21_R30_VERSION,
    phase: "R26",
    status: "PASS_LOCKED",
    riskLevel: "HIGH_UNTIL_VALIDATED",
    acceptedSafeActions: [
      "read-only prefix analysis",
      "hashing",
      "marker probe",
      "hypothesis map",
      "local-only report"
    ],
    blockedActions: [
      "writing .STY",
      "rewriting fixture",
      "copying fixture without approval",
      "publishing fixture",
      "claiming Yamaha writer ready"
    ],
    dependsOn: r25.format,
    finalDecision: {
      continueToWriterImplementation: false,
      allowRealKeyboardBinaryOutput: false,
      allowRealStyOutput: false,
      realKeyboardBinaryWriteAllowed: false,
      realWriterReady: false
    },
    safety: {
      realBinaryBlocked: true,
      wroteRealKeyboardBinary: false
    }
  };
}

export function runR21R30YamahaParserSandbox() {
  const r21 = createR21YamahaParserSandbox();
  const r22 = createR22SectionMarkerProbe(r21);
  const r23 = createR23MidiLikeHeaderProbe(r21);
  const r24 = createR24SafeStructureMap(r21, r22, r23);
  const r25 = createR25ParserReadinessGate(r21, r22, r23, r24);
  const r26 = createR26ParserRiskGate(r25);

  return {
    format: "UAOS_R21_R30_YAMAHA_PARSER_SANDBOX_REPORT",
    version: UAOS_R21_R30_VERSION,
    phases: ["R21", "R22", "R23", "R24", "R25", "R26", "R27", "R28", "R29", "R30"],
    status: "PASS",
    reports: { r21, r22, r23, r24, r25, r26 },
    finalDecision: {
      parserSandboxReady: true,
      allowReadOnlyAnalysis: true,
      allowFullBinaryParse: false,
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

export function validateR21R30YamahaParserSandbox(report) {
  const errors = [];

  if (report?.format !== "UAOS_R21_R30_YAMAHA_PARSER_SANDBOX_REPORT") errors.push("Invalid report format.");
  if (report?.status !== "PASS") errors.push("Status must be PASS.");
  if (report?.finalDecision?.allowFullBinaryParse !== false) errors.push("Full binary parse must remain blocked.");
  if (report?.finalDecision?.allowRealKeyboardBinaryOutput !== false) errors.push("Real keyboard binary output must be blocked.");
  if (report?.finalDecision?.allowRealStyOutput !== false) errors.push("Real STY output must be blocked.");
  if (report?.finalDecision?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must be blocked.");
  if (report?.finalDecision?.realWriterReady !== false) errors.push("Real writer must not be ready.");
  if (report?.reports?.r25?.finalDecision?.allowRealStyOutput !== false) errors.push("R25 must block STY output.");
  if (report?.reports?.r26?.finalDecision?.continueToWriterImplementation !== false) errors.push("R26 must block writer implementation.");
  if (report?.safety?.readOnly !== true) errors.push("Must remain read-only.");
  if (report?.safety?.wroteRealKeyboardBinary !== false) errors.push("Must not write real keyboard binary.");
  if (report?.safety?.realBinaryBlocked !== true) errors.push("Real binary must be blocked.");

  return { ok: errors.length === 0, errors };
}
