/**
 * Thin program consumers — route musical intelligence through Golden Brain core.
 */
import { createGoldenBrain, GOLDEN_BRAIN_CONTRACT } from "../goldenBrain/goldenBrainCore.js";
import { runConversion, planConversion } from "../convert/conversionGraph.js";
import { runFullProductHandoffs, runArrangerGoldenChain } from "./arrangerChain.js";

export function arrangerViaGoldenBrain(input = {}) {
  const brain = createGoldenBrain();
  const arrangement = brain.suggestArrangement(input);
  const roles = brain.assignInstrumentRoles(input);
  return {
    program: "arranger-studio",
    usesGoldenBrain: true,
    capabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId,
    arrangement,
    roles,
    musicalQualityClaim: false
  };
}

export function singyViaGoldenBrain(input = {}) {
  const brain = createGoldenBrain();
  const analyzed = brain.analyzeInput(input);
  const style = brain.analyzeStyle(input);
  return {
    program: "singy",
    usesGoldenBrain: true,
    capabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId,
    analyzed,
    style,
    musicalQualityClaim: false
  };
}

export function midiToolkitViaGoldenBrain(input = {}) {
  const brain = createGoldenBrain();
  const conversion = runConversion({
    sourceFamily: input.sourceFamily || "midi",
    targetFamily: input.targetFamily || "midi",
    bytes: input.bytes,
    extension: input.extension || ".mid"
  });
  return {
    program: "midi-toolkit",
    usesGoldenBrain: true,
    capabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId,
    conversion,
    plan: planConversion({
      sourceFamily: input.sourceFamily || "midi",
      targetFamily: input.targetFamily || "korg"
    }),
    musicalQualityClaim: false
  };
}

export function creatorViaGoldenBrain(input = {}) {
  return { ...arrangerViaGoldenBrain(input), program: "creator" };
}

export function studioProViaGoldenBrain(input = {}) {
  const brain = createGoldenBrain();
  const structure = brain.understandStructure(input);
  return {
    program: "studio-pro",
    usesGoldenBrain: true,
    capabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId,
    structure,
    realtimeDsp: false,
    musicalQualityClaim: false
  };
}

export function libraryContentViaGoldenBrain(input = {}) {
  const brain = createGoldenBrain();
  const intent = brain.normalizeMusicalIntent(input);
  return {
    program: "library-factory",
    usesGoldenBrain: true,
    capabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId,
    intent,
    audioCopied: false,
    musicalQualityClaim: false
  };
}

export function keyboardProViaGoldenBrain(input = {}) {
  return midiToolkitViaGoldenBrain({ ...input, sourceFamily: input.sourceFamily || "korg" });
}

export function runCrossProgramGoldenWorkflows() {
  const chords = arrangerViaGoldenBrain({});
  const melody = creatorViaGoldenBrain({ melody: [60, 61, 64, 65, 67] });
  const midi = midiToolkitViaGoldenBrain({ sourceFamily: "midi", targetFamily: "midi" });
  const korgPlan = midiToolkitViaGoldenBrain({ sourceFamily: "midi", targetFamily: "korg" });
  const singy = singyViaGoldenBrain({});
  const studio = studioProViaGoldenBrain({});
  const library = libraryContentViaGoldenBrain({});
  const keyboard = keyboardProViaGoldenBrain({ sourceFamily: "yamaha", targetFamily: "midi" });
  const fullChain = runArrangerGoldenChain({});
  const handoffs = runFullProductHandoffs();
  const results = [
    { id: "CHORDS→GoldenBrain→Arranger", ok: chords.arrangement?.ok === true },
    { id: "MELODY→GoldenBrain→Arrangement", ok: melody.arrangement?.ok === true },
    { id: "MIDI→IR→GoldenBrain→MIDI", ok: midi.conversion?.ok === true },
    { id: "MIDI→IR→GoldenBrain→Korg(fail-closed write)", ok: korgPlan.plan?.FORMAT_CONTRACT_REQUIRED === true },
    { id: "SINGY→GoldenBrain analysis", ok: singy.analyzed?.ok === true },
    { id: "STUDIO→GoldenBrain structure", ok: studio.structure?.ok === true },
    { id: "LIBRARY→GoldenBrain intent", ok: library.intent?.ok === true },
    { id: "KEYBOARD→inspect/IR path", ok: keyboard.conversion?.ok === true },
    { id: "FULL ARRANGER CHAIN save/export", ok: fullChain.ok === true },
    { id: "PRODUCT HANDOFFS automated", ok: handoffs.ok === true }
  ];
  return {
    ok: results.every((r) => r.ok),
    total: results.length,
    pass: results.filter((r) => r.ok).length,
    results,
    capabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId,
    musicalQualityClaim: false
  };
}
