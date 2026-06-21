import {
  createYamahaStyIntermediateSchema,
  validateYamahaStyIntermediateSchema
} from "./yamahaStyIntermediateSchema.js";

export const UAOS_PHASE58_VERSION = "58.0.0";

function noteOn(tick, note, velocity, channel) {
  return { type: "noteOn", tick, note, velocity, channel };
}

function noteOff(tick, note, channel) {
  return { type: "noteOff", tick, note, channel };
}

function cc(tick, controller, value, channel) {
  return { type: "cc", tick, controller, value, channel };
}

function program(tick, programNumber, channel) {
  return { type: "program", tick, programNumber, channel };
}

export function createSafePhraseEventsForTrack(track, section) {
  const channel = track.midiChannel;
  const bars = section.bars || 4;
  const ticksPerBeat = 480;
  const beatsPerBar = 4;
  const totalTicks = bars * beatsPerBar * ticksPerBeat;

  const baseNoteByRole = {
    drums: 36,
    percussion: 42,
    bass: 38,
    chords: 50,
    pad: 57,
    phrase: 62
  };

  const baseNote = baseNoteByRole[track.role] || 60;
  const events = [
    program(0, track.role === "bass" ? 33 : 0, channel),
    cc(0, 7, 96, channel),
    cc(0, 10, 64, channel)
  ];

  for (let tick = 0; tick < totalTicks; tick += ticksPerBeat) {
    const note = baseNote + ((tick / ticksPerBeat) % 4);
    const velocity = track.role === "drums" ? 100 : 82;
    events.push(noteOn(tick, note, velocity, channel));
    events.push(noteOff(tick + Math.floor(ticksPerBeat * 0.75), note, channel));
  }

  return events;
}

export function buildYamahaStyPhraseEventSchema(input = {}) {
  const schema = createYamahaStyIntermediateSchema(input);
  const valid = validateYamahaStyIntermediateSchema(schema);
  if (!valid.ok) throw new Error(valid.errors.join(", "));

  const sections = schema.sections.map((section) => ({
    ...section,
    phraseEventsReady: true,
    binaryChunkReady: false,
    tracks: section.tracks.map((track) => ({
      ...track,
      phraseEvents: createSafePhraseEventsForTrack(track, section),
      eventEncodingReady: true,
      binarySerializationReady: false
    }))
  }));

  return {
    ...schema,
    format: "UAOS_YAMAHA_STY_PHRASE_EVENT_SCHEMA",
    version: UAOS_PHASE58_VERSION,
    phase: 58,
    sections,
    phraseEventSummary: {
      sectionCount: sections.length,
      trackCount: sections.reduce((sum, section) => sum + section.tracks.length, 0),
      eventCount: sections.reduce(
        (sum, section) => sum + section.tracks.reduce((inner, track) => inner + track.phraseEvents.length, 0),
        0
      )
    },
    realStyWriterReady: false,
    realKeyboardBinaryWriteAllowed: false,
    safety: {
      status: "PHRASE_EVENTS_READY_SAFE_JSON_ONLY",
      realBinaryBlocked: true,
      warning: "Phase 58 creates safe phrase events only. It does not create Yamaha STY binary output."
    }
  };
}

export function validateYamahaStyPhraseEventSchema(schema) {
  const errors = [];

  if (schema?.format !== "UAOS_YAMAHA_STY_PHRASE_EVENT_SCHEMA") errors.push("Invalid phrase event schema format.");
  if (schema?.target !== "yamaha") errors.push("Target must be yamaha.");
  if (schema?.futureFormat !== ".STY") errors.push("Future format must be .STY.");
  if (schema?.realStyWriterReady !== false) errors.push("Must not claim real STY writer ready.");
  if (schema?.realKeyboardBinaryWriteAllowed !== false) errors.push("Real keyboard binary writing must remain blocked.");
  if (!schema?.sections?.length) errors.push("Missing sections.");
  if (!schema?.phraseEventSummary?.eventCount) errors.push("Missing phrase events.");
  if (!schema?.sections?.every(s => s.binaryChunkReady === false)) errors.push("Every section must keep binaryChunkReady false.");
  if (!schema?.sections?.every(s => s.tracks.every(t => t.binarySerializationReady === false))) {
    errors.push("Every track must keep binarySerializationReady false.");
  }
  if (schema?.safety?.realBinaryBlocked !== true) errors.push("Safety realBinaryBlocked must be true.");

  return { ok: errors.length === 0, errors };
}
