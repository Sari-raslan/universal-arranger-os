/**
 * Voice / melody-to-MIDI: analysis notes → Neutral IR → SMF bytes.
 * Recovers proven melodyAnalysis + public SMF encoder.
 * Pitch estimates are not owner musical quality PASS.
 */
import { analyzeMonophonicWav } from "./melodyAnalysis.js";
import { encodeMidiSmf, parseMidiSmf } from "../convert/midiSmfAdapter.js";
import { normalizeMidiToIr } from "../convert/uaosNeutralIr.js";

export function melodyNotesToIr(notes, { ppq = 480, framesPerBeat = 4 } = {}) {
  let tick = 0;
  const noteEvents = (notes || []).map((n) => {
    const durationTicks = Math.max(1, Math.round(((n.frames || 1) / framesPerBeat) * ppq));
    const event = {
      midi: n.midi,
      startTick: tick,
      durationTicks,
      velocity: 80,
      channel: 0
    };
    tick += durationTicks;
    return event;
  });
  return {
    ok: noteEvents.length > 0,
    schema: "uaos.neutral-ir/v1",
    family: "midi",
    ppq,
    noteEvents,
    notes: noteEvents.length,
    musicalQualityClaim: false
  };
}

export function melodyNotesToMidi(notes, options = {}) {
  const ir = melodyNotesToIr(notes, options);
  if (!ir.ok) return { ok: false, errorCode: "NO_MELODY_NOTES", musicalQualityClaim: false };
  const bytes = encodeMidiSmf({ noteEvents: ir.noteEvents, ppq: ir.ppq, tempoBpm: options.tempo || 100 });
  return {
    ok: true,
    ir,
    bytes,
    parsed: parseMidiSmf(bytes),
    normalized: normalizeMidiToIr(bytes),
    musicalQualityClaim: false,
    ownerMusicalQualityPass: false
  };
}

export function wavMelodyToMidi(buffer, options = {}) {
  const analysis = analyzeMonophonicWav(buffer, options);
  if (!analysis.ok) return { ...analysis, ownerMusicalQualityPass: false };
  return {
    ...melodyNotesToMidi(analysis.notes, options),
    analysis,
    musicalQualityClaim: false,
    ownerMusicalQualityPass: false
  };
}
