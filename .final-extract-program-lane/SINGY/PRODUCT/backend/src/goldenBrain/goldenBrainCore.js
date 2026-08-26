/**
 * UAOS Golden Brain — CANONICAL shared musical intelligence core.
 * All products must consume this module (or thin re-exports of it).
 * Does NOT claim owner musical taste PASS or proprietary WRITE.
 */
import { ChordEngine } from "../chord-engine.js";
import { SongArranger } from "../song-arranger.js";
import { buildArrangementPlan } from "../arranger/personalized-arranger.js";
import { runMusicalBrainGates } from "../arranger/musicalBrainGates.js";
import {
  detectHarmonyFamily,
  scoreAlternative,
  pitchClasses
} from "../arranger/tonalContext.js";
import { analyzeArrangementIntelligence } from "../arranger/arrangementIntelligence.js";
import { createSessionMemoryCapability } from "../session/sessionMemoryCapabilityAdapter.js";
import { HIJAZ_MELODY_MIDI } from "../render/uaosOriginalSketch.js";

export const GOLDEN_BRAIN_CONTRACT = Object.freeze({
  schema: "uaos.golden-brain.contract/v1",
  capabilityId: "uaos.golden-brain.core/v1",
  musicalQualityClaim: false,
  ownerMusicalQualityPass: false,
  methods: [
    "analyzeInput",
    "detectKey",
    "detectScale",
    "detectMaqam",
    "analyzeChords",
    "analyzeMelody",
    "analyzeRhythm",
    "analyzeStyle",
    "understandStructure",
    "suggestArrangement",
    "scoreArrangement",
    "chooseVariation",
    "chooseFill",
    "chooseIntro",
    "chooseEnding",
    "assignInstrumentRoles",
    "normalizeMusicalIntent",
    "humanize",
    "validateMusicalConsistency",
    "learnTaste",
    "loadMemory",
    "saveMemory",
    "explainDecision",
    "enrichNeutralIr"
  ]
});

const chordEngine = new ChordEngine();

function asMidiList(input) {
  if (Array.isArray(input)) return input.map(Number).filter((n) => Number.isFinite(n));
  if (input?.noteEvents) return input.noteEvents.map((e) => Number(e.midi)).filter((n) => Number.isFinite(n));
  if (input?.notes && Array.isArray(input.notes)) return input.notes.map(Number);
  if (typeof input?.melody === "string") {
    return input.melody.split(/[,\s]+/).map(Number).filter((n) => Number.isFinite(n));
  }
  return [...HIJAZ_MELODY_MIDI];
}

export function analyzeInput(input = {}) {
  const melody = asMidiList(input.melody || input);
  const chords = chordEngine.detect(melody);
  const pcs = pitchClasses(melody);
  const family = input.harmonyFamily || detectHarmonyFamily(pcs) || "unknown";
  return {
    schema: "uaos.golden-brain.analyze-input/v1",
    ok: true,
    melody,
    detectedChord: chords.chord,
    harmonyFamily: family,
    melodyAnalysis: { ok: true, noteCount: melody.length, pitchClasses: pcs },
    musicalQualityClaim: false
  };
}

export function detectKey(input = {}) {
  const melody = asMidiList(input);
  const pcs = pitchClasses(melody);
  return { ok: true, pitchClasses: pcs, tonicHint: pcs[0] ?? null, musicalQualityClaim: false };
}

export function detectScale(input = {}) {
  const family = detectHarmonyFamily(pitchClasses(asMidiList(input))) || "unknown";
  return { ok: true, scaleFamily: family, musicalQualityClaim: false };
}

export function detectMaqam(input = {}) {
  const family = detectHarmonyFamily(pitchClasses(asMidiList(input))) || "unknown";
  const maqam = String(family).startsWith("maqam-") ? family.replace(/^maqam-/, "") : null;
  return {
    ok: true,
    maqam: maqam || (family.includes("hijaz") ? "hijaz" : "unspecified"),
    harmonyFamily: family,
    musicalQualityClaim: false
  };
}

export function analyzeChords(input = {}) {
  const melody = asMidiList(input);
  const detected = chordEngine.detect(melody);
  return { ok: true, chord: detected.chord, raw: detected, musicalQualityClaim: false };
}

export function analyzeMelody(input = {}) {
  const melody = asMidiList(input);
  return {
    ok: true,
    noteCount: melody.length,
    notes: melody,
    pitchClasses: pitchClasses(melody),
    musicalQualityClaim: false
  };
}

export function analyzeRhythm(input = {}) {
  const ppq = Number(input.ppq) || 480;
  const events = input.noteEvents || [];
  const durations = events.map((e) => Number(e.durationTicks) || ppq);
  const avg = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : ppq;
  return { ok: true, ppq, averageDurationTicks: avg, eventCount: events.length, musicalQualityClaim: false };
}

export function analyzeStyle(input = {}) {
  const taste = input.tasteProfile || { genres: "arabic khaleeji" };
  return { ok: true, styleHint: taste.genres || taste.favoriteGenres || "unspecified", tasteProfile: taste, musicalQualityClaim: false };
}

export function understandStructure(input = {}) {
  const song = new SongArranger().generate(input.style || "Oriental Pop");
  const sections = song.song.map((s) => ({
    name: s.section,
    role: String(s.section || "").toLowerCase(),
    bars: s.bars,
    chord: s.chord
  }));
  return { ok: true, sections, musicalQualityClaim: false };
}

export function suggestArrangement(input = {}) {
  const intel = analyzeArrangementIntelligence({
    melody: asMidiList(input.melody || input),
    tasteProfile: input.tasteProfile || { genres: "arabic khaleeji" }
  });
  return {
    ok: intel.ok,
    arrangement: intel.plan,
    sections: intel.sections,
    detectedChord: intel.detectedChord,
    scoring: intel.scoring,
    gates: intel.gates,
    musicalQualityClaim: false,
    ownerMusicalQualityPass: false,
    capabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId
  };
}

export function scoreArrangement(source, candidate, opts = {}) {
  return {
    ...scoreAlternative(source || {}, candidate || {}, opts),
    musicalQualityClaim: false
  };
}

export function chooseVariation(structure) {
  const sections = structure?.sections || understandStructure().sections;
  const mains = sections.filter((s) => /main/i.test(s.name || s.role || ""));
  return { ok: true, choice: mains[0] || sections[0] || null, musicalQualityClaim: false };
}

export function chooseFill(structure) {
  const sections = structure?.sections || understandStructure().sections;
  const fill = sections.find((s) => /fill|break/i.test(s.name || s.role || ""));
  return { ok: true, choice: fill || { name: "Fill", role: "fill", bars: 1 }, musicalQualityClaim: false };
}

export function chooseIntro(structure) {
  const sections = structure?.sections || understandStructure().sections;
  const intro = sections.find((s) => /intro/i.test(s.name || s.role || ""));
  return { ok: true, choice: intro || { name: "Intro", role: "intro", bars: 2 }, musicalQualityClaim: false };
}

export function chooseEnding(structure) {
  const sections = structure?.sections || understandStructure().sections;
  const ending = sections.find((s) => /end|ending|outro/i.test(s.name || s.role || ""));
  return { ok: true, choice: ending || { name: "Ending", role: "ending", bars: 2 }, musicalQualityClaim: false };
}

export function assignInstrumentRoles(input = {}) {
  const roles = [
    { role: "melody", channel: 0, programHint: input.melodyProgram ?? 0 },
    { role: "chords", channel: 1, programHint: input.chordProgram ?? 48 },
    { role: "bass", channel: 2, programHint: input.bassProgram ?? 32 },
    { role: "drums", channel: 9, programHint: 0 }
  ];
  return { ok: true, roles, musicalQualityClaim: false };
}

export function normalizeMusicalIntent(input = {}) {
  const analyzed = analyzeInput(input);
  const structure = understandStructure(input);
  return {
    ok: true,
    intent: {
      harmonyFamily: analyzed.harmonyFamily,
      chord: analyzed.detectedChord,
      sections: structure.sections.map((s) => s.role || s.name),
      taste: input.tasteProfile || null
    },
    musicalQualityClaim: false
  };
}

export function humanize(noteEvents = [], { velocityJitter = 4, timingJitter = 0 } = {}) {
  const out = noteEvents.map((e, i) => ({
    ...e,
    velocity: Math.max(1, Math.min(127, (Number(e.velocity) || 90) + ((i % 3) - 1) * Math.min(velocityJitter, 6))),
    startTick: Math.max(0, (Number(e.startTick) || 0) + ((i % 2) * timingJitter))
  }));
  return { ok: true, noteEvents: out, deterministic: timingJitter === 0, musicalQualityClaim: false };
}

export function validateMusicalConsistency(payload = {}) {
  return {
    ...runMusicalBrainGates(payload),
    musicalQualityClaim: false,
    ownerMusicalQualityPass: false
  };
}

const tasteStore = { profile: { genres: "arabic khaleeji", samples: 0 } };

export function learnTaste(observation = {}) {
  tasteStore.profile = {
    ...tasteStore.profile,
    ...observation,
    samples: (tasteStore.profile.samples || 0) + 1,
    updatedAt: new Date().toISOString()
  };
  return { ok: true, profile: { ...tasteStore.profile }, ownerMusicalQualityPass: false };
}

export function loadMemory(opts = {}) {
  const cap = createSessionMemoryCapability(opts);
  return cap.invoke("snapshot");
}

export function saveMemory(payload = {}, opts = {}) {
  const cap = createSessionMemoryCapability(opts);
  if (payload.project) return cap.invoke("saveProject", payload.project);
  if (payload.session) return cap.invoke("saveSession", payload.session);
  return { ok: false, errorCode: "MEMORY_PAYLOAD_REQUIRED" };
}

export function explainDecision(decision = {}) {
  return {
    ok: true,
    summary: decision.summary || "Technical Golden Brain decision; owner taste PASS not claimed.",
    reasons: decision.reasons || ["tonal-context", "section-continuity", "fail-closed-quality-claim"],
    musicalQualityClaim: false,
    ownerMusicalQualityPass: false
  };
}

/**
 * Enrich Neutral IR with Golden Brain musical context (does not invent WRITE).
 */
export function enrichNeutralIr(ir = {}) {
  const notes = ir.noteEvents || ir.notes || [];
  const midiList = Array.isArray(notes)
    ? notes.map((n) => (typeof n === "number" ? n : n.midi)).filter((n) => Number.isFinite(n))
    : [];
  const analyzed = analyzeInput({ melody: midiList.length ? midiList : HIJAZ_MELODY_MIDI });
  const roles = assignInstrumentRoles(ir);
  const intent = normalizeMusicalIntent({ melody: analyzed.melody, tasteProfile: ir.tasteProfile });
  return {
    ok: true,
    ir: {
      ...ir,
      schema: ir.schema || "uaos.neutral-ir/v1",
      goldenBrain: {
        capabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId,
        harmonyFamily: analyzed.harmonyFamily,
        detectedChord: analyzed.detectedChord,
        roles: roles.roles,
        intent: intent.intent,
        musicalQualityClaim: false
      }
    },
    musicalQualityClaim: false
  };
}

export function createGoldenBrain() {
  return {
    contract: GOLDEN_BRAIN_CONTRACT,
    analyzeInput,
    detectKey,
    detectScale,
    detectMaqam,
    analyzeChords,
    analyzeMelody,
    analyzeRhythm,
    analyzeStyle,
    understandStructure,
    suggestArrangement,
    scoreArrangement,
    chooseVariation,
    chooseFill,
    chooseIntro,
    chooseEnding,
    assignInstrumentRoles,
    normalizeMusicalIntent,
    humanize,
    validateMusicalConsistency,
    learnTaste,
    loadMemory,
    saveMemory,
    explainDecision,
    enrichNeutralIr
  };
}

export function runGoldenBrainSelfTest() {
  const brain = createGoldenBrain();
  const arrangement = brain.suggestArrangement({});
  const enriched = brain.enrichNeutralIr({
    schema: "uaos.neutral-ir/v1",
    family: "midi",
    noteEvents: [
      { midi: 60, startTick: 0, durationTicks: 480, velocity: 90, channel: 0 }
    ]
  });
  const gates = brain.validateMusicalConsistency({
    source: { melody: HIJAZ_MELODY_MIDI, harmonyFamily: "maqam-hijaz" },
    candidate: { melody: HIJAZ_MELODY_MIDI, harmonyFamily: "maqam-hijaz" },
    sections: arrangement.sections?.slice(0, 3)
  });
  return {
    ok: arrangement.ok && enriched.ok && gates.ok === true,
    capabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId,
    arrangementOk: arrangement.ok,
    enrichOk: enriched.ok,
    gatesOk: gates.ok,
    musicalQualityClaim: false
  };
}

// Compatibility re-export for existing call sites
export { analyzeArrangementIntelligence };
