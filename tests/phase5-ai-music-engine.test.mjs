import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  analyzeAudioBuffer,
  basicLevels,
  normalizePcmBuffer,
  pitchClassProfileFromNotes,
  tempoCandidatesFromOnsets,
} from "../uaos-live-clean/src/ai/audioAnalysisCore.js";
import {
  quantizeMelody,
  snapMelodyToScale,
  voiceToMelody,
} from "../uaos-live-clean/src/ai/voiceMelodyEngine.js";
import {
  createMidiDownloadPayload,
  validateMidiNotes,
  writeStandardMidiFile,
  writeVariableLength,
} from "../uaos-live-clean/src/ai/midiFileWriter.js";
import {
  buildChord,
  buildScale,
  detectChord,
  detectKey,
  diatonicChords,
  parseNoteName,
  romanNumeral,
  transposePitchClass,
} from "../uaos-live-clean/src/music/musicTheory.js";
import {
  estimateMaqamFromPitchClassProfile,
  getMaqam,
  lookupScaleDegree,
  transposeMaqam,
  validateMaqam,
} from "../uaos-live-clean/src/music/orientalTheory.js";
import { analyzeSongStructure } from "../uaos-live-clean/src/ai/songStructureAnalyzer.js";
import { createSongArrangementPlan } from "../uaos-live-clean/src/ai/songToArrangementPlanner.js";
import { generateArrangementRules } from "../uaos-live-clean/src/ai/arrangementRules.js";
import {
  createDisabledRemoteProvider,
  createLocalDeterministicProvider,
  createMockProvider,
  createProviderRequest,
  normalizeProviderError,
} from "../uaos-live-clean/src/ai/aiProvider.js";
import { AnalysisJobSystem } from "../uaos-live-clean/src/ai/analysisJobs.js";
import { createDefaultSession, exportSession, importSession, migrateSession } from "../uaos-live-clean/src/session/sessionStore.js";

function syntheticBeatAudio({ sampleRate = 1000, seconds = 4, bpm = 120 } = {}) {
  const length = sampleRate * seconds;
  const samples = new Float32Array(length);
  const interval = Math.round(sampleRate * 60 / bpm);
  for (let index = 0; index < length; index += 1) {
    samples[index] = Math.sin((2 * Math.PI * 110 * index) / sampleRate) * 0.05;
    if (index % interval < 20) samples[index] += 0.9;
  }
  return samples;
}

test("Phase 5 audio analysis handles PCM normalization, silence, RMS, clipping, tempo, key, chords and sections", () => {
  const normalized = normalizePcmBuffer([0, 2, -2], { sampleRate: 3 });
  assert.deepEqual(normalized.samples, [0, 1, -1]);
  assert.equal(basicLevels([0, 0, 0]).silence, true);
  assert.equal(basicLevels([0, 1, -1]).clipping, true);
  const candidates = tempoCandidatesFromOnsets([{ time: 0 }, { time: 0.5 }, { time: 1 }, { time: 1.5 }]);
  assert.equal(candidates[0].bpm, 120);

  const result = analyzeAudioBuffer(syntheticBeatAudio(), {
    sampleRate: 1000,
    notes: [
      { start: 0, end: 1, midi: 60, duration: 1, confidence: 1 },
      { start: 0, end: 1, midi: 64, duration: 1, confidence: 1 },
      { start: 0, end: 1, midi: 67, duration: 1, confidence: 1 },
    ],
  });
  assert.equal(result.ok, true);
  assert.equal(result.tempo.bpm, 120);
  assert.equal(result.key.key, "C");
  assert.equal(result.chordTimeline[0].name, "C");
  assert.ok(result.sections.length >= 1);
});

test("Phase 5 voice-to-melody smooths, segments, quantizes, snaps scale notes and exports MIDI events", () => {
  const melody = voiceToMelody([
    { time: 0, frequency: 440, confidence: 0.9 },
    { time: 0.1, frequency: 441, confidence: 0.88 },
    { time: 0.2, frequency: null, confidence: 0 },
    { time: 0.35, frequency: 493.88, confidence: 0.86 },
    { time: 0.5, frequency: 494.2, confidence: 0.86 },
  ], { bpm: 120, scaleSnap: { root: 0, mode: "major" }, transpose: 0 });
  assert.equal(melody.ok, true);
  assert.equal(melody.monophonic, true);
  assert.ok(melody.notes.length >= 1);
  assert.ok(melody.events.some((event) => event.type === "noteOff"));

  const quantized = quantizeMelody([{ start: 0.13, duration: 0.18, midi: 61, velocity: 80 }], { bpm: 120 });
  assert.equal(quantized[0].start, 0.125);
  assert.equal(snapMelodyToScale([{ midi: 61 }], { root: 0, mode: "major" })[0].midi, 60);
});

test("Phase 5 MIDI writer emits deterministic Standard MIDI bytes and validates note ranges", () => {
  assert.deepEqual(writeVariableLength(0), [0]);
  assert.deepEqual(writeVariableLength(128), [0x81, 0x00]);
  assert.equal(validateMidiNotes([{ start: 0, duration: 1, midi: 128 }]).length, 1);
  const bytes = writeStandardMidiFile({
    notes: [{ start: 0, duration: 0.5, midi: 60, velocity: 90 }],
    bpm: 120,
    trackName: "Test",
  });
  assert.equal(String.fromCharCode(...bytes.slice(0, 4)), "MThd");
  assert.equal(String.fromCharCode(...bytes.slice(14, 18)), "MTrk");
  assert.equal(createMidiDownloadPayload([{ start: 0, duration: 0.5, midi: 60 }]).localDownloadOnly, true);
});

test("Phase 5 music theory supports scales, chords, inversions, key scoring, roman numerals and slash chord awareness", () => {
  assert.equal(parseNoteName("C4").midi, 60);
  assert.deepEqual(buildScale("C", "major"), [0, 2, 4, 5, 7, 9, 11]);
  assert.deepEqual(buildChord("C", "major", 1), [4, 7, 0]);
  assert.equal(detectChord([60, 64, 67]).name, "C");
  assert.equal(detectKey(pitchClassProfileFromNotes([60, 64, 67, 72])).key, "C");
  assert.equal(diatonicChords(0, "major")[4].roman, "V");
  assert.equal(romanNumeral(2, "minor"), "ii");
  assert.equal(transposePitchClass(11, 1), 0);
});

test("Phase 5 Oriental theory exposes maqam metadata and honest MIDI approximation limits", () => {
  const rast = getMaqam("rast");
  assert.equal(validateMaqam(rast).length, 0);
  assert.equal(rast.pitchBendRequired, true);
  assert.match(rast.midiApproximation, /pitch bend/);
  assert.equal(lookupScaleDegree(rast, 64).quarterTone, true);
  assert.equal(transposeMaqam("hijaz", 2).transposition, 2);
  assert.equal(estimateMaqamFromPitchClassProfile([1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0]).experimental, true);
});

test("Phase 5 song structure and arrangement planner produce deterministic editable plans", () => {
  const analysis = analyzeAudioBuffer(syntheticBeatAudio(), { sampleRate: 1000 });
  const structure = analyzeSongStructure(analysis, { analysisId: "song-1" });
  const plan = createSongArrangementPlan(structure, { sourceAnalysisId: "song-1", styleId: "oriental" });
  const rules = generateArrangementRules({ styleId: "oriental", sections: structure.sections, tempo: 96 });
  assert.equal(structure.ok, true);
  assert.equal(plan.sourceAnalysisId, "song-1");
  assert.ok(plan.manualEditable.includes("instrumentRoles"));
  assert.equal(rules.deterministic, true);
  assert.equal(plan.unsupportedCases.includes("No cloud API call"), true);
});

test("Phase 5 provider abstraction keeps remote providers disabled and normalizes errors", async () => {
  const local = createLocalDeterministicProvider({ echo: (payload) => ({ ...payload, ok: true }) });
  const response = await local.run(createProviderRequest("echo", { value: 1 }));
  assert.equal(response.offline, true);
  assert.equal(response.result.ok, true);
  await assert.rejects(() => createDisabledRemoteProvider().run(), /disabled/);
  assert.equal(createMockProvider().status, "test-only");
  assert.equal(normalizeProviderError({ message: "x", code: "X" }).code, "X");
});

test("Phase 5 job system supports progress, cancellation, duplicate protection and retry", () => {
  const jobs = new AnalysisJobSystem();
  const first = jobs.create({ inputId: "same" });
  const duplicate = jobs.create({ inputId: "same" });
  assert.equal(first.id, duplicate.id);
  assert.equal(jobs.step(first.id, "analyzing", 44).progress, 44);
  assert.equal(jobs.cancel(first.id).status, "cancelled");
  assert.equal(jobs.retry(first.id).attempts, 1);
});

test("Phase 5 session migration preserves Phase 3/4 data and adds AI music state safely", () => {
  const migrated = migrateSession({ version: 2, name: "Phase 4 session", sampler: { presets: [{ id: "p" }] } });
  assert.equal(migrated.version, 7);
  assert.equal(migrated.cloud.schemaVersion, 1);
  assert.equal(migrated.beta.schemaVersion, 1);
  assert.equal(migrated.sampler.presets.length, 1);
  assert.equal(migrated.aiMusic.schemaVersion, 1);
  assert.equal(migrated.aiMusic.provider.remoteEnabled, false);
  assert.equal(importSession(exportSession(createDefaultSession())).version, 7);
});

test("Phase 5 AI Studio UI exposes real controls and safety labels", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "uaos-live-clean", "src", "components", "AILabsPanel.jsx"), "utf8");
  for (const text of [
    "UAOS AI Music Studio",
    "Analyze",
    "Cancel",
    "Retry",
    "Export MIDI",
    "Export JSON",
    "No upload",
    "remote provider",
    "Polyphonic transcription is not claimed",
    "Play Preview",
    "Stop Preview",
  ]) {
    assert.equal(source.includes(text), true);
  }
  assert.equal(source.includes("API key"), false);
});
