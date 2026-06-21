export const UAOS_HARDWARE_EXPORT_VERSION = "28.0.0";

export const UAOS_HARDWARE_TARGETS = {
  korg: {
    id: "korg",
    name: "KORG PA Series",
    devices: ["PA3X Oriental", "PA4X", "PA5X"],
    extensions: [".uaos-korg.json"],
    supports: ["style-map", "sections", "variations", "fills", "endings", "midi-project-reference"]
  },
  yamaha: {
    id: "yamaha",
    name: "Yamaha Arranger",
    devices: ["Genos", "Genos2", "SX900"],
    extensions: [".uaos-yamaha.json"],
    supports: ["style-map", "sections", "ots-map", "midi-project-reference"]
  },
  roland: {
    id: "roland",
    name: "Roland / E-A / BK Series",
    devices: ["BK-9", "E-A7"],
    extensions: [".uaos-roland.json"],
    supports: ["style-map", "sections", "performance-map", "midi-project-reference"]
  },
  ketron: {
    id: "ketron",
    name: "Ketron Arranger",
    devices: ["SD9", "SD90", "Audya"],
    extensions: [".uaos-ketron.json"],
    supports: ["style-map", "sections", "audio-drum-reference", "midi-project-reference"]
  }
};

export function normalizeHardwareTarget(target) {
  const key = String(target || "").trim().toLowerCase();
  if (!UAOS_HARDWARE_TARGETS[key]) {
    throw new Error(`Unsupported hardware target: ${target}`);
  }
  return key;
}

export function createHardwareExportPackage(input = {}) {
  const target = normalizeHardwareTarget(input.target || "korg");
  const preset = UAOS_HARDWARE_TARGETS[target];

  const projectName = String(input.projectName || "UAOS Phase 28 Export").trim();
  const sections = Array.isArray(input.sections) && input.sections.length
    ? input.sections
    : [
        { id: "intro1", type: "intro", bars: 4, chord: "Cm" },
        { id: "mainA", type: "main", bars: 8, chord: "Cm" },
        { id: "fill1", type: "fill", bars: 1, chord: "G7" },
        { id: "mainB", type: "main", bars: 8, chord: "Fm" },
        { id: "ending1", type: "ending", bars: 4, chord: "Cm" }
      ];

  const tracks = Array.isArray(input.tracks) && input.tracks.length
    ? input.tracks
    : [
        { id: "drums", role: "drums", channel: 10, program: "standard-kit" },
        { id: "bass", role: "bass", channel: 2, program: "finger-bass" },
        { id: "chords", role: "chords", channel: 3, program: "warm-keys" },
        { id: "pad", role: "pad", channel: 4, program: "strings-pad" },
        { id: "lead", role: "lead", channel: 5, program: "oriental-violin" }
      ];

  return {
    format: "UAOS_HARDWARE_EXPORT_PACKAGE",
    version: UAOS_HARDWARE_EXPORT_VERSION,
    createdAt: new Date().toISOString(),
    target,
    targetName: preset.name,
    devices: preset.devices,
    extensions: preset.extensions,
    projectName,
    source: {
      phase: 28,
      engine: "UAOS Hardware Export Layer",
      safeLocalPrototype: true,
      realBinaryExport: false
    },
    styleMap: {
      tempo: Number(input.tempo || 96),
      meter: input.meter || "4/4",
      key: input.key || "C minor",
      sections,
      tracks
    },
    exportNotes: [
      "Safe UAOS hardware package manifest.",
      "This is not a proprietary binary .STY/.SET/.PRS exporter yet.",
      "Next phases can add real device-specific binary converters."
    ]
  };
}

export function serializeHardwareExportPackage(pkg) {
  if (!pkg || pkg.format !== "UAOS_HARDWARE_EXPORT_PACKAGE") {
    throw new Error("Invalid UAOS hardware export package.");
  }
  return JSON.stringify(pkg, null, 2);
}

export function validateHardwareExportPackage(pkg) {
  const errors = [];
  if (!pkg) errors.push("Package missing.");
  if (pkg?.format !== "UAOS_HARDWARE_EXPORT_PACKAGE") errors.push("Invalid format.");
  if (!pkg?.target) errors.push("Target missing.");
  if (!pkg?.styleMap?.sections?.length) errors.push("Sections missing.");
  if (!pkg?.styleMap?.tracks?.length) errors.push("Tracks missing.");
  if (!UAOS_HARDWARE_TARGETS[pkg?.target]) errors.push("Unknown target.");
  return {
    ok: errors.length === 0,
    errors
  };
}
