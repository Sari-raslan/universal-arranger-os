/**
 * Integrated Arranger product chain via canonical Golden Brain.
 * IDEA/CHORDS/MELODY → GOLDEN BRAIN → ARRANGER → SEQUENCER → PLAY/SAVE/EXPORT
 */
import { createGoldenBrain, GOLDEN_BRAIN_CONTRACT } from "./goldenBrainCore.js";
import { createGoldenSequencerStudio, renderGoldenSequencerSketch } from "../render/goldenSequencerStudio.js";
import { exportGoldenSequencerMidi } from "../export/goldenSequencerMidi.js";
import { createMusicalSessionMemory } from "../session/musicalSessionMemory.js";
import { createMemoryStorage } from "../session/memoryStorage.js";
import { librarySamplerFinalize } from "../library/librarySamplerFinalize.js";
import { runConversion } from "../convert/conversionGraph.js";

export function runArrangerGoldenChain({
  melody,
  style = "Oriental Pop",
  tempo = 96,
  bars = 4,
  storage,
  includeLibrary = true,
  includeConversionSample = true
} = {}) {
  const brain = createGoldenBrain();
  const analyzed = brain.analyzeInput({ melody, tasteProfile: { genres: "arabic khaleeji" } });
  const arrangement = brain.suggestArrangement({ melody: analyzed.melody, tasteProfile: { genres: "arabic khaleeji" } });
  const structure = brain.understandStructure({ style });
  const roles = brain.assignInstrumentRoles({});
  const humanized = brain.humanize(
    (melody || analyzed.melody || []).map((midi, i) => ({
      midi,
      startTick: i * 480,
      durationTicks: 480,
      velocity: 90,
      channel: 0
    }))
  );

  const studio = createGoldenSequencerStudio({ tempo, bars, style });
  const sketch = renderGoldenSequencerSketch({ tempo, bars, style });
  const midi = exportGoldenSequencerMidi({ tempo, bars, noteEvents: humanized.noteEvents });
  const mem = createMusicalSessionMemory({ storage: storage || createMemoryStorage() });
  const saved = mem.saveProject({
    projectId: `arranger-chain-${Date.now()}`,
    title: "Golden Brain Arranger Chain",
    tempo,
    melody: analyzed.melody,
    arrangement: arrangement.arrangement,
    sections: arrangement.sections
  });
  const library = includeLibrary ? librarySamplerFinalize() : { ok: true, skipped: true };
  const conversion = includeConversionSample
    ? runConversion({ sourceFamily: "midi", targetFamily: "korg", bytes: midi.bytes, extension: ".mid" })
    : null;

  const ok =
    analyzed.ok &&
    arrangement.ok &&
    structure.ok &&
    roles.ok &&
    humanized.ok &&
    studio.song?.length > 0 &&
    sketch.rendered?.ok &&
    midi.ok &&
    saved?.ok !== false &&
    library.ok &&
    (conversion ? conversion.ok || conversion.write?.ok === false : true);

  return {
    schema: "uaos.golden-brain.arranger-chain/v1",
    ok,
    capabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId,
    analyzed,
    arrangement,
    structure,
    roles,
    humanized,
    sequencer: { sections: studio.song, tempo: studio.tempo },
    sketch: { ok: sketch.rendered?.ok, voices: sketch.rendered?.analysis?.voices },
    export: { ok: midi.ok, noteCount: midi.noteEvents?.length || 0 },
    save: saved,
    library: { ok: library.ok, metadataOnly: true },
    conversion: conversion
      ? {
          ok: conversion.ok,
          lossy: conversion.LOSSY_CONVERSION,
          writeBlocked: conversion.write?.ok === false,
          errorCode: conversion.write?.errorCode
        }
      : null,
    musicalQualityClaim: false,
    ownerMusicalQualityPass: false
  };
}

export function runFullProductHandoffs() {
  const chain = runArrangerGoldenChain({});
  return {
    ok: chain.ok,
    handoffs: [
      { from: "input", to: "goldenBrain.analyzeInput", ok: chain.analyzed?.ok === true },
      { from: "goldenBrain", to: "arranger.suggestArrangement", ok: chain.arrangement?.ok === true },
      { from: "arranger", to: "goldenSequencer", ok: chain.sequencer?.sections?.length > 0 },
      { from: "sequencer", to: "play/render", ok: chain.sketch?.ok === true },
      { from: "play", to: "save", ok: Boolean(chain.save) },
      { from: "save", to: "export", ok: chain.export?.ok === true },
      { from: "library", to: "sharedContentEngine", ok: chain.library?.ok === true },
      { from: "export", to: "conversionGraph", ok: chain.conversion?.writeBlocked === true || chain.conversion?.ok === true }
    ],
    capabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId
  };
}
