/**
 * Neutral IR arranger semantics v2 — canonical sections, tracks, drums, chords, SysEx, vendor opaque.
 */
import {
  NEUTRAL_IR_VERSION,
  NEUTRAL_IR_ARRANGER_SCHEMA,
  normalizeSectionRole,
  migrateNeutralIrV1ToV2
} from "./neutralIrSchema.js";
import { preserveEventsFromMidiIr, extractSysexBlocks, createVendorExtensions } from "./neutralIrPreservation.js";
import { buildDrumMappingFromNotes, assignTrackRolesFromChannels } from "./neutralIrDrumMapping.js";
import { buildChordStyleSemantics } from "./neutralIrChordStyle.js";

export { NEUTRAL_IR_ARRANGER_SCHEMA };

export function emptyArrangerSemantics() {
  return {
    schema: NEUTRAL_IR_ARRANGER_SCHEMA,
    tempo: null,
    timeSignatures: [],
    tracks: [],
    channels: [],
    events: preserveEventsFromMidiIr({}),
    sysexPreserved: [],
    markers: [],
    sections: [],
    sectionOrdering: [],
    introMainFillBreakEnding: {
      intro: null,
      introVariants: [],
      main: null,
      variations: [],
      fills: [],
      fillTransitions: [],
      break: null,
      ending: null,
      endingVariants: []
    },
    trackRoles: [],
    drumMapping: { mapped: [], unmappedEvents: [], lossy: false, lossReasons: [] },
    chordStyle: buildChordStyleSemantics({}),
    styleParts: [],
    bassRoles: [],
    accompanimentRoles: [],
    instrumentProgramMapping: [],
    effectsMetadata: [],
    transposition: 0,
    scaleKeyMaqam: null,
    performanceSettings: {},
    resourceReferences: [],
    vendorExtensions: null,
    preserveUnknownWhenSafe: true,
    musicalQualityClaim: false
  };
}

export function buildSectionModel(rawSections = [], { vendorName = null, vendorCode = null } = {}) {
  const sections = rawSections.map((s, index) => {
    const name = typeof s === "string" ? s : s.name || s.section || s.role || `Section${index + 1}`;
    const role = normalizeSectionRole(s.role || s.name || s.section || name);
    return {
      role,
      name,
      lengthBars: s.bars ?? s.lengthBars ?? null,
      bars: s.bars ?? null,
      timeSignature: s.timeSignature || null,
      tempo: s.tempo || null,
      tracks: s.tracks || [],
      events: s.events || [],
      chordBehavior: s.chord || s.chordBehavior || null,
      variationRelationship: s.variationRelationship || null,
      transitionIntent: s.transitionIntent || null,
      vendorName: s.vendorName || vendorName,
      vendorCode: s.vendorCode || vendorCode,
      opaqueSourceMetadata: s.opaqueSourceMetadata || null
    };
  });

  const byRole = (roles) =>
    sections.filter((s) => roles.includes(s.role));

  const ordering = sections.map((s) => s.role);

  return {
    sections,
    sectionOrdering: ordering,
    introMainFillBreakEnding: {
      intro: sections.find((s) => /^INTRO/.test(s.role)) || null,
      introVariants: byRole(["INTRO_1", "INTRO_2", "INTRO_3"]),
      main: sections.find((s) => s.role === "MAIN") || null,
      variations: byRole(["VARIATION_1", "VARIATION_2", "VARIATION_3", "VARIATION_4"]),
      fills: byRole(["FILL", "FILL_UP", "FILL_DOWN", "FILL_1", "FILL_2", "FILL_3", "FILL_4"]),
      fillTransitions: byRole(["FILL_UP", "FILL_DOWN"]),
      break: sections.find((s) => s.role === "BREAK") || null,
      ending: sections.find((s) => /^ENDING/.test(s.role)) || null,
      endingVariants: byRole(["ENDING_1", "ENDING_2", "ENDING_3"])
    }
  };
}

/**
 * Merge Golden Brain + MIDI IR into arranger-semantic Neutral IR v2.
 */
export function buildArrangerNeutralIr({
  midiIr = {},
  golden = {},
  opaqueVendor = null,
  sourceBuffer = null,
  vendor = null,
  family = null
} = {}) {
  const noteEvents = midiIr.noteEvents || [];
  const rawSections = golden.intent?.sections || golden.sections || [];
  const sectionModel = buildSectionModel(rawSections, {
    vendorName: vendor || opaqueVendor?.vendor || null
  });
  const semantics = emptyArrangerSemantics();
  const channels = [...new Set(noteEvents.map((n) => n.channel).filter((c) => c != null))];
  const events = preserveEventsFromMidiIr(midiIr);

  semantics.tempo = midiIr.tempoEvents?.[0]?.bpm || null;
  semantics.timeSignatures = events.timeSignatures;
  semantics.channels = channels;
  semantics.events = events;
  semantics.tracks = channels.map((ch) => ({ channel: ch, role: ch === 9 ? "DRUM" : "UNKNOWN_VENDOR_ROLE" }));
  semantics.sections = sectionModel.sections;
  semantics.sectionOrdering = sectionModel.sectionOrdering;
  semantics.introMainFillBreakEnding = sectionModel.introMainFillBreakEnding;
  semantics.trackRoles = assignTrackRolesFromChannels(channels.length ? channels : [0, 9], noteEvents);
  semantics.drumMapping = buildDrumMappingFromNotes(noteEvents, {
    kitId: opaqueVendor?.drumKitId || null,
    vendorDrumMapId: opaqueVendor?.vendorDrumMapId || null
  });
  semantics.chordStyle = buildChordStyleSemantics({ golden, midiIr });
  semantics.chords = golden.detectedChord ? [{ symbol: golden.detectedChord }] : [];
  semantics.instrumentProgramMapping = golden.roles || [];
  semantics.scaleKeyMaqam = golden.harmonyFamily || golden.intent?.harmonyFamily || semantics.chordStyle.maqamContext;
  semantics.bassRoles = semantics.trackRoles.filter((t) => t.canonicalRole === "BASS");
  semantics.accompanimentRoles = semantics.trackRoles.filter((t) => /^ACC/.test(t.canonicalRole));

  if (sourceBuffer) {
    semantics.sysexPreserved = extractSysexBlocks(sourceBuffer);
  }

  if (opaqueVendor) {
    semantics.vendorExtensions =
      opaqueVendor.schema === "uaos.neutral-ir.vendor-extensions/v1"
        ? opaqueVendor
        : createVendorExtensions({
            vendor: vendor || opaqueVendor.vendor || family || "unknown",
            family: family || opaqueVendor.family || "unknown",
            buffer: sourceBuffer,
            opaqueBlocks: opaqueVendor.opaqueBlocks,
            metadata: opaqueVendor
          });
  }

  const ir = {
    schema: NEUTRAL_IR_VERSION,
    neutralIrVersion: NEUTRAL_IR_VERSION,
    family: midiIr.family || family || "midi",
    ppq: midiIr.ppq || 480,
    noteEvents,
    tempoEvents: midiIr.tempoEvents || [],
    controllers: midiIr.controllers || 0,
    programChanges: midiIr.programChanges || 0,
    arrangerSemantics: semantics,
    goldenBrain: golden.capabilityId
      ? { capabilityId: golden.capabilityId, harmonyFamily: semantics.scaleKeyMaqam, musicalQualityClaim: false }
      : midiIr.goldenBrain || null,
    musicalQualityClaim: false
  };

  return ir;
}

export function validateArrangerNeutralIr(ir) {
  if (!ir) return { ok: false, errorCode: "IR_MISSING" };
  const migrated = migrateNeutralIrV1ToV2(ir);
  const doc = migrated.ir;
  if (!doc.schema?.includes("neutral-ir")) return { ok: false, errorCode: "IR_SCHEMA" };
  if (!doc.arrangerSemantics || doc.arrangerSemantics.schema !== NEUTRAL_IR_ARRANGER_SCHEMA) {
    return { ok: false, errorCode: "ARRANGER_SEMANTICS_REQUIRED" };
  }
  const sem = doc.arrangerSemantics;
  const checks = {
    sectionModel: Array.isArray(sem.sections),
    trackRoles: Array.isArray(sem.trackRoles),
    drumMapping: sem.drumMapping && Array.isArray(sem.drumMapping.mapped),
    sysexSafe: (sem.sysexPreserved || []).every((b) => b.execute === false || b.execute == null),
    vendorOpaque: sem.preserveUnknownWhenSafe === true
  };
  const ok = Object.values(checks).every(Boolean);
  return {
    ok,
    sectionCount: sem.sections.length,
    checks,
    neutralIrVersion: doc.neutralIrVersion || doc.schema
  };
}

export function defaultArrangerSectionsFromGoldenBrain() {
  return buildSectionModel([
    { name: "Intro", role: "INTRO", bars: 2 },
    { name: "Main", role: "MAIN", bars: 4 },
    { name: "Variation 1", role: "VARIATION_1", bars: 4 },
    { name: "Fill", role: "FILL", bars: 1 },
    { name: "Break", role: "BREAK", bars: 2 },
    { name: "Ending", role: "ENDING", bars: 2 }
  ]);
}
