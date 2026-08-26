'use strict';
/**
 * Creator Phase4 — Arrangement draft + Golden Sequencer foundation
 */
const crypto = require('crypto');
const phase3 = require('./phase3.cjs');

const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const FUNCTIONS = ['tonic', 'predominant', 'dominant', 'return'];

function createMusicalContext({ key = 'C', scale = 'major', mode = 'ionian', tempo = 120, numerator = 4, denominator = 4 } = {}) {
  if (!SCALES[scale]) throw Object.assign(new Error('INVALID_SCALE'), { code: 'INVALID_SCALE' });
  return { key, scale, mode, tempo, timeSignature: { numerator, denominator } };
}

function validateChordSymbol(symbol) {
  if (!/^[A-G](#|b)?(m|maj|min|dim|aug|7|maj7|m7)?$/.test(symbol)) {
    throw Object.assign(new Error('INVALID_CHORD'), { code: 'INVALID_CHORD' });
  }
  return true;
}

function createProgression(chords) {
  for (const c of chords) {
    validateChordSymbol(c.symbol);
    if (!FUNCTIONS.includes(c.function)) throw Object.assign(new Error('INVALID_FUNCTION'), { code: 'INVALID_FUNCTION' });
    if (!(c.durationBeats > 0)) throw Object.assign(new Error('INVALID_CHORD_DURATION'), { code: 'INVALID_CHORD_DURATION' });
  }
  return { schemaVersion: 'uaos.creator.progression/v4', chords };
}

function validateProgression(prog) {
  const fns = prog.chords.map((c) => c.function);
  if (fns.includes('dominant') && !fns.includes('tonic') && !fns.includes('return')) {
    return { ok: false, warning: 'DOMINANT_WITHOUT_RESOLUTION' };
  }
  return { ok: true };
}

function createArrangementDraft(project, draft = {}) {
  const c = phase3.ensureComposition(project);
  c.arrangementDraft = {
    schemaVersion: 'uaos.creator.arrangement-draft/v4',
    intent: draft.intent || 'draft',
    sectionGraph: draft.sectionGraph || { nodes: [], edges: [] },
    trackRoles: draft.trackRoles || {},
    densityProfile: draft.densityProfile || { intro: 0.3, verse: 0.5, chorus: 0.8 },
    registerPlan: draft.registerPlan || { melody: 'mid', bass: 'low', drum: 'full' },
    instrumentPlaceholders: draft.instrumentPlaceholders || [],
    entryExit: draft.entryExit || { entry: 'intro', exit: 'outro' },
    repetitionPolicy: draft.repetitionPolicy || { maxRepeats: 2 },
    variationPolicy: draft.variationPolicy || { enabled: true },
    dynamicProfile: draft.dynamicProfile || { verse: 'mf', chorus: 'f' },
    warnings: []
  };
  return c.arrangementDraft;
}

function createGoldenSequence(events = []) {
  const ordered = [...events].sort((a, b) => (a.tick - b.tick) || String(a.priority || 0) - String(b.priority || 0) || String(a.type).localeCompare(String(b.type)));
  return {
    schemaVersion: 'uaos.creator.golden-sequence/v4',
    sequenceId: crypto.randomUUID(),
    version: 1,
    events: ordered,
    quantizationPlan: { gridBeats: 0.25 },
    humanization: { enabled: false, timingMs: 0, velocityJitter: 0 },
    status: 'FOUNDATION_ONLY'
  };
}

function mapTickToBeats(tick, ppq = 480) { return tick / ppq; }

function validateHumanizationConfig(cfg) {
  if (cfg.enabled && (cfg.timingMs < 0 || cfg.velocityJitter < 0)) {
    throw Object.assign(new Error('INVALID_HUMANIZATION'), { code: 'INVALID_HUMANIZATION' });
  }
  return { ok: true, dryRunOnly: true };
}

function attachPhase4(project, { context, progression, sequence } = {}) {
  const c = phase3.ensureComposition(project);
  c.musicalContext = context || createMusicalContext();
  if (progression) c.progression = progression;
  if (sequence) c.goldenSequence = sequence;
  c.claims = {
    professionalAutomaticArrangement: false,
    humanMusicalTasteProven: false,
    advancedHarmonyComplete: false,
    musicalBrainComplete: false,
    voiceToMidiProductionAccuracy: false,
    goldenSequencerCommercialReady: false
  };
  return project;
}

module.exports = {
  SCALES,
  FUNCTIONS,
  createMusicalContext,
  validateChordSymbol,
  createProgression,
  validateProgression,
  createArrangementDraft,
  createGoldenSequence,
  mapTickToBeats,
  validateHumanizationConfig,
  attachPhase4,
  phase3
};
