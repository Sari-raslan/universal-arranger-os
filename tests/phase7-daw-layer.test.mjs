import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  CommandHistory,
  DEFAULT_PPQ,
  addMidiNote,
  applyHardwareTransport,
  arrangerToTracks,
  cancelAudioRecording,
  cancelExportJob,
  captureMidiRecordingEvent,
  collectMissingAssets,
  createAudioClip,
  createAutomationLane,
  createDawProject,
  createEffect,
  createExportJob,
  createMidiClip,
  createPluginHostContract,
  createRecoverySnapshot,
  createTrack,
  duplicateClip,
  evaluateAutomation,
  importAiMelody,
  linkPhase6Hardware,
  loadRecoverySnapshot,
  migrateDawProject,
  moveClip,
  placeClip,
  preventFeedbackLoop,
  quantizeMidiClip,
  reduceTransport,
  resizeClip,
  secondsToTicks,
  splitClip,
  startAudioRecording,
  startMidiRecording,
  stopAudioRecording,
  stopMidiRecording,
  ticksToMusical,
  ticksToSeconds,
  transposeMidiClip,
  updateChannelStrip,
  validateAudioClip,
  validateDawProject,
  validateEffect,
  validateMidiClip,
  validateMixerRouting,
  validatePerformance,
} from "../uaos-live-clean/src/daw/dawPhase7.js";
import { createDefaultSession, exportSession, importSession, migrateSession } from "../uaos-live-clean/src/session/sessionStore.js";

test("Phase 7 time engine converts musical ticks and seconds with tempo and signature metadata", () => {
  assert.equal(ticksToMusical(DEFAULT_PPQ * 4).bar, 2);
  assert.equal(ticksToSeconds(DEFAULT_PPQ * 2, [{ tick: 0, bpm: 120 }]), 1);
  assert.equal(secondsToTicks(1, [{ tick: 0, bpm: 120 }]), DEFAULT_PPQ * 2);
  assert.equal(ticksToMusical(DEFAULT_PPQ * 3, { numerator: 3, denominator: 4 }).bar, 2);
});

test("Phase 7 project and track model validates DAW metadata and supported tracks", () => {
  const project = createDawProject({ name: "Session" });
  assert.equal(project.tracks.some((track) => track.type === "sampler"), true);
  assert.equal(project.tracks.some((track) => track.type === "master"), true);
  assert.equal(validateDawProject(project).valid, true);
  const bus = createTrack("bus", 1, { output: "master" });
  assert.equal(bus.type, "bus");
  assert.equal(bus.freeze.enabled, false);
});

test("Phase 7 clip engine places, moves, resizes, splits, duplicates and rejects invalid clips", () => {
  let project = createDawProject();
  const trackId = project.tracks[0].id;
  const audio = createAudioClip(1, { trackId, assetId: "asset-1", startTick: 0, durationTicks: DEFAULT_PPQ });
  assert.equal(validateAudioClip(audio).valid, true);
  let placed = placeClip(project, trackId, audio, { overlapRule: "reject" });
  assert.equal(placed.ok, true);
  project = placed.project;
  assert.equal(placeClip(project, trackId, createAudioClip(2, { trackId, assetId: "asset-2", startTick: 10 }), { overlapRule: "reject" }).reason, "clip-overlap");
  assert.equal(moveClip(audio, 100, 120).startTick, 120);
  assert.equal(resizeClip(audio, 240).endTick, 240);
  assert.equal(splitClip(audio, DEFAULT_PPQ / 2).clips.length, 2);
  assert.equal(duplicateClip(audio).startTick, DEFAULT_PPQ);
  assert.equal(validateAudioClip(createAudioClip(9)).valid, false);
});

test("Phase 7 MIDI clip engine orders notes, protects ranges, quantizes and transposes", () => {
  let clip = createMidiClip(1);
  clip = addMidiNote(clip, { tick: 500, pitch: 60, velocity: 90, durationTicks: 120 });
  clip = addMidiNote(clip, { tick: 100, pitch: 64, velocity: 80, durationTicks: 120 });
  assert.equal(clip.notes[0].pitch, 64);
  assert.equal(validateMidiClip(clip).valid, true);
  assert.equal(validateMidiClip({ ...clip, notes: [{ pitch: 200, velocity: 1, durationTicks: 1 }] }).valid, false);
  assert.equal(quantizeMidiClip(clip, 240).notes[0].tick, 0);
  assert.equal(transposeMidiClip(clip, 12).notes[0].pitch, 76);
});

test("Phase 7 transport supports play, pause, record, loop metadata, seeking and panic", () => {
  let state = reduceTransport(null, { type: "start" });
  assert.equal(state.state, "playing");
  state = reduceTransport(state, { type: "pause" });
  assert.equal(state.paused, true);
  state = reduceTransport(state, { type: "record" });
  assert.equal(state.recording, true);
  state = reduceTransport(state, { type: "locate", tick: 1234 });
  assert.equal(state.playheadTick, 1234);
  state = reduceTransport(state, { type: "panic" });
  assert.equal(state.panicIssued, true);
});

test("Phase 7 audio and MIDI recording mocks create clips and protect stuck notes", () => {
  let project = createDawProject();
  const audioStart = startAudioRecording(project.recording, "audio-001", { tick: 0, time: 0 });
  assert.equal(audioStart.ok, true);
  const audioStop = stopAudioRecording(audioStart.recording, { durationSeconds: 1, durationTicks: DEFAULT_PPQ, assetId: "take-asset" });
  assert.equal(audioStop.clip.type, "audio");
  assert.equal(cancelAudioRecording(audioStart.recording).audio.activeTake, null);

  let recording = startMidiRecording(project.recording, "midi-001", { tick: 0 });
  recording = captureMidiRecordingEvent(recording, { type: "noteOn", note: 60, velocity: 96, channel: 0 }, 0);
  const midiStop = stopMidiRecording(recording, "midi-001", { durationTicks: DEFAULT_PPQ });
  assert.equal(midiStop.clip.notes[0].protectedByAllNotesOff, true);
});

test("Phase 7 mixer handles gain, pan, mute, solo, routing and feedback prevention", () => {
  const project = createDawProject();
  const stripId = project.mixer.strips[0].id;
  const mixer = updateChannelStrip(project.mixer, stripId, { gain: 3, pan: -2, mute: true, solo: true });
  assert.equal(mixer.strips[0].gain, 2);
  assert.equal(mixer.strips[0].pan, -1);
  assert.equal(validateMixerRouting(mixer).valid, true);
  assert.equal(preventFeedbackLoop(mixer, stripId, stripId).ok, false);
});

test("Phase 7 effects and plugin host keep VST claims disabled", () => {
  const effect = createEffect("compressor", { wetDry: 0.5 });
  assert.equal(validateEffect(effect).valid, true);
  assert.equal(validateEffect(createEffect("vst3")).valid, false);
  const host = createPluginHostContract();
  assert.equal(host.vstHostingClaimed, false);
  assert.equal(host.arbitraryDllLoading, false);
});

test("Phase 7 automation evaluates step and linear lanes deterministically", () => {
  const linear = createAutomationLane("audio-001", "gain", [{ tick: 0, value: 0 }, { tick: 100, value: 1 }]);
  assert.equal(evaluateAutomation(linear, 50), 0.5);
  const step = createAutomationLane("audio-001", "mute", [{ tick: 0, value: 0 }, { tick: 100, value: 1 }], { interpolation: "step" });
  assert.equal(evaluateAutomation(step, 50), 0);
});

test("Phase 7 undo, redo, transaction rollback and autosave recovery work without audio buffers", () => {
  const history = new CommandHistory({ maxSize: 5 });
  const project = createDawProject();
  const result = history.execute(project, { do: (current) => ({ ...current, name: "Edited" }) });
  assert.equal(result.project.name, "Edited");
  assert.equal(history.undo(result.project).project.name, project.name);
  assert.equal(history.redo(project).project.name, "Edited");
  assert.equal(history.transaction(project, [{ do: () => ({ error: "boom" }) }]).ok, false);

  const autosave = createRecoverySnapshot(project, project.autosave, "2026-06-14T00:00:00.000Z");
  assert.equal(autosave.recoverySnapshots[0].project.audioAssets.some((asset) => asset.rawBuffer), false);
  assert.equal(loadRecoverySnapshot(autosave.recoverySnapshots[0]).ok, true);
  assert.equal(loadRecoverySnapshot({}).reason, "corrupted-snapshot");
});

test("Phase 7 Arranger, AI, sampler and hardware integration contracts preserve manual safety", () => {
  const converted = arrangerToTracks({ section: "VAR_A", chord: "Cm", channels: { drum: 10 }, patterns: { drum: "basic" } });
  assert.equal(converted.tracks.some((track) => track.id === "arranger-drum"), true);
  assert.equal(converted.regions[0].preserveManualEdits, true);
  const aiClip = importAiMelody({ notes: [{ start: 0, duration: 0.5, midi: 61, velocity: 80 }] }, "midi-001");
  assert.equal(aiClip.notes[0].pitch, 61);
  const linked = linkPhase6Hardware(createDawProject(), { selectedProfileId: "korg-pa5x-foundation", sysexConsent: { enabled: true } });
  assert.equal(linked.hardwareLink.sysexEnabled, false);
  assert.equal(applyHardwareTransport(linked.transport, { command: "transport.start" }).state, "playing");
});

test("Phase 7 export contract reports limitations, missing assets and cancellation", () => {
  const project = createDawProject({ tracks: [createTrack("audio", 1, { clips: [createAudioClip(1, { assetId: "missing" })] })] });
  assert.equal(collectMissingAssets(project).length, 1);
  const job = createExportJob(project);
  assert.equal(job.cloudUpload, false);
  assert.equal(job.bitDepth, "browser-supported");
  assert.equal(cancelExportJob(job).cancelled, true);
});

test("Phase 7 session migration preserves Phase 3/4/5/6 data and adds DAW project", () => {
  const migrated = migrateSession({ version: 4, hardware: { selectedProfileId: "korg-pa5x-foundation" }, aiMusic: { provider: { remoteEnabled: true } } });
  assert.equal(migrated.version, 7);
  assert.equal(migrated.cloud.schemaVersion, 1);
  assert.equal(migrated.beta.schemaVersion, 1);
  assert.equal(migrated.hardware.sysexConsent.enabled, false);
  assert.equal(migrated.aiMusic.provider.remoteEnabled, false);
  assert.equal(migrated.dawProject.schemaVersion, 1);
  assert.equal(importSession(exportSession(createDefaultSession())).dawProject.pluginHost.vstHostingClaimed, false);
  assert.equal(migrateDawProject({ hardwareLink: { sysexEnabled: true } }).hardwareLink.sysexEnabled, false);
});

test("Phase 7 performance limits and UI expose DAW workstation without fake production claims", () => {
  const project = createDawProject({ tracks: Array.from({ length: 100 }, (_, index) => createTrack("audio", index + 1)) });
  assert.equal(validatePerformance(project).ok, false);
  const source = fs.readFileSync(path.join(process.cwd(), "uaos-live-clean", "src", "components", "DAWStudioPanel.jsx"), "utf8");
  for (const text of ["UAOS DAW Studio", "Piano Roll", "Automation", "Export Foundation", "Record Audio", "Record MIDI", "Arranger to Tracks", "Import AI Melody", "SysEx disabled by default"]) {
    assert.equal(source.includes(text), true);
  }
  const app = fs.readFileSync(path.join(process.cwd(), "uaos-live-clean", "src", "App.jsx"), "utf8");
  assert.equal(app.includes("DAWStudioPanel"), true);
});
