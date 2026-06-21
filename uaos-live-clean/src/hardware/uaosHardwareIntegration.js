import {
  createHardwareExportPackage,
  validateHardwareExportPackage,
  serializeHardwareExportPackage
} from "./uaosHardwareExportLayer.js";

export const UAOS_PHASE29_VERSION = "29.0.0";

export function createPhase29StyleProject(input = {}) {
  const tempo = Number(input.tempo || 96);
  const key = input.key || "C minor";

  return {
    format: "UAOS_PHASE29_STYLE_PROJECT",
    version: UAOS_PHASE29_VERSION,
    projectName: input.projectName || "UAOS Phase 29 Integrated Style",
    tempo,
    meter: input.meter || "4/4",
    key,
    chordProgression: input.chordProgression || ["Cm", "Ab", "Fm", "G7"],
    sections: input.sections || [
      { id: "intro1", type: "intro", bars: 4, chord: "Cm" },
      { id: "mainA", type: "main", bars: 8, chord: "Cm" },
      { id: "fill1", type: "fill", bars: 1, chord: "G7" },
      { id: "mainB", type: "main", bars: 8, chord: "Fm" },
      { id: "ending1", type: "ending", bars: 4, chord: "Cm" }
    ],
    tracks: input.tracks || [
      { id: "drums", role: "drums", channel: 10, program: "standard-kit" },
      { id: "bass", role: "bass", channel: 2, program: "finger-bass" },
      { id: "chords", role: "chords", channel: 3, program: "warm-keys" },
      { id: "pad", role: "pad", channel: 4, program: "strings-pad" },
      { id: "lead", role: "lead", channel: 5, program: "oriental-violin" }
    ]
  };
}

export function createPhase29MidiReference(styleProject = {}) {
  const sections = Array.isArray(styleProject.sections) ? styleProject.sections : [];
  const tracks = Array.isArray(styleProject.tracks) ? styleProject.tracks : [];

  return {
    format: "UAOS_PHASE29_MIDI_REFERENCE",
    version: UAOS_PHASE29_VERSION,
    tempo: Number(styleProject.tempo || 96),
    meter: styleProject.meter || "4/4",
    key: styleProject.key || "C minor",
    timeline: sections.map((section, index) => ({
      index,
      sectionId: section.id,
      type: section.type,
      bars: Number(section.bars || 1),
      chord: section.chord || "Cm"
    })),
    tracks: tracks.map((track, index) => ({
      index,
      trackId: track.id,
      role: track.role,
      channel: Number(track.channel || index + 1),
      program: track.program || "default"
    }))
  };
}

export function createIntegratedHardwareExport(input = {}) {
  const styleProject = input.styleProject || createPhase29StyleProject(input);
  const midiReference = input.midiReference || createPhase29MidiReference(styleProject);

  const pkg = createHardwareExportPackage({
    target: input.target || "korg",
    projectName: styleProject.projectName,
    tempo: styleProject.tempo,
    meter: styleProject.meter,
    key: styleProject.key,
    sections: styleProject.sections,
    tracks: styleProject.tracks
  });

  pkg.integration = {
    phase: 29,
    version: UAOS_PHASE29_VERSION,
    styleProjectFormat: styleProject.format,
    midiReferenceFormat: midiReference.format,
    chordProgression: styleProject.chordProgression,
    midiReference
  };

  pkg.exportNotes = [
    ...(pkg.exportNotes || []),
    "Phase 29 links hardware export manifests with UAOS style sections and MIDI timeline references.",
    "Still safe local prototype. Proprietary binary keyboard export remains future work."
  ];

  return pkg;
}

export function validateIntegratedHardwareExport(pkg) {
  const base = validateHardwareExportPackage(pkg);
  const errors = [...base.errors];

  if (pkg?.integration?.phase !== 29) errors.push("Phase 29 integration missing.");
  if (!pkg?.integration?.midiReference?.timeline?.length) errors.push("MIDI timeline missing.");
  if (!pkg?.integration?.midiReference?.tracks?.length) errors.push("MIDI tracks missing.");
  if (!pkg?.integration?.chordProgression?.length) errors.push("Chord progression missing.");

  return {
    ok: errors.length === 0,
    errors
  };
}

export function serializeIntegratedHardwareExport(pkg) {
  const valid = validateIntegratedHardwareExport(pkg);
  if (!valid.ok) {
    throw new Error(valid.errors.join(", "));
  }
  return serializeHardwareExportPackage(pkg);
}
