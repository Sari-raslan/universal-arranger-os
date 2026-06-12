import test from "node:test";
import assert from "node:assert/strict";
import { applySwing, deterministicHumanize, positionFromTick, quantizeTick, reduceClock, scheduleWindow } from "../uaos-live-clean/src/timing/proClock.js";
import { activeLanes, createProArrangerState, reduceProArranger, V2_LANES } from "../uaos-live-clean/src/arranger/proArranger.js";
import { createPattern, createPatternEditor, patternToPlaybackEvents, validatePattern } from "../uaos-live-clean/src/pattern/patternEditor.js";
import { recognizeChord } from "../uaos-live-clean/src/chords/chordRecognition.js";
import { addSongSection, addSongToSetlist, createSetlist, createSong, nextSong, previousSong, validateSongProject } from "../uaos-live-clean/src/song/songSetlist.js";
import { DEVICE_PROFILES, exportProfile, importProfile } from "../uaos-live-clean/src/devices/deviceProfiles.js";
import { createMixer, mixerPanic, recallMixerScene, saveMixerScene, updateMixerLane } from "../uaos-live-clean/src/mixer/mixerStore.js";
import { createDesktopProjectStore } from "../uaos-live-clean/src/desktop/desktopProjectStore.js";

test("professional clock schedules and transforms timing", () => {
  assert.deepEqual(positionFromTick(480), { bar: 1, beat: 2, tick: 0 });
  assert.equal(quantizeTick(119, 120), 120);
  assert.equal(applySwing(240, 240, 0.5), 300);
  assert.equal(deterministicHumanize(100, 0), 100);
  assert.equal(scheduleWindow([{ tick: 10 }, { tick: 2000 }], { nowTick: 0, lookAheadTicks: 960 }).length, 1);
  assert.equal(reduceClock(undefined, { type: "tempo", bpm: 500 }).bpm, 260);
});

test("nine-lane arranger transitions at boundaries", () => {
  let state = createProArrangerState();
  assert.equal(Object.keys(state.lanes).length, V2_LANES.length);
  state = reduceProArranger(state, { type: "requestSection", section: "FILL_3", boundary: "bar" });
  assert.equal(state.section, "VARIATION_A");
  state = reduceProArranger(state, { type: "commitBoundary", boundary: "bar" });
  assert.equal(state.section, "FILL_3");
  state = reduceProArranger(state, { type: "lane", lane: "bass", patch: { mute: true } });
  assert.equal(activeLanes(state).some((lane) => lane.id === "bass"), false);
});

test("pattern editor supports create modify save reopen undo redo", () => {
  const editor = createPatternEditor(createPattern("demo"));
  editor.addNote({ tick: 0, note: 60, duration: 120, lane: "lead" });
  editor.updateNote(0, { velocity: 80 });
  assert.equal(editor.get().notes[0].velocity, 80);
  editor.undo();
  assert.equal(editor.get().notes[0].velocity, 100);
  editor.redo();
  assert.equal(editor.get().notes[0].velocity, 80);
  const exported = editor.exportJson();
  const reopened = createPatternEditor().importJson(exported);
  assert.equal(validatePattern(reopened).ok, true);
  assert.deepEqual(patternToPlaybackEvents(reopened).map((event) => event.type), ["noteon", "noteoff"]);
});

test("chord recognition covers common qualities", () => {
  assert.equal(recognizeChord([60, 64, 67]).symbol, "C");
  assert.equal(recognizeChord([60, 63, 67]).symbol, "Cm");
  assert.equal(recognizeChord([60, 64, 67, 70]).symbol, "C7");
  assert.equal(recognizeChord([62, 67, 69]).symbol, "Dsus4");
});

test("song setlist saves and navigates", () => {
  const song = addSongSection(createSong("A"), { name: "INTRO_1" });
  let setlist = addSongToSetlist(createSetlist("Gig"), song);
  setlist = addSongToSetlist(setlist, createSong("B"));
  assert.equal(validateSongProject(setlist).ok, true);
  assert.equal(nextSong(setlist).currentIndex, 1);
  assert.equal(previousSong(nextSong(setlist)).currentIndex, 0);
});

test("device profiles and mixer scenes are honest and restorable", () => {
  const profile = importProfile(exportProfile(DEVICE_PROFILES[0]));
  assert.equal(profile.verified, true);
  assert.equal(DEVICE_PROFILES.find((item) => item.id.includes("korg")).verified, false);
  let mixer = createMixer(["drums", "bass"]);
  mixer = updateMixerLane(mixer, "bass", { volume: 80 });
  mixer = saveMixerScene(mixer, "Verse");
  mixer = updateMixerLane(mixer, "bass", { volume: 20 });
  assert.equal(recallMixerScene(mixer, 0).lanes.bass.volume, 80);
  assert.equal(mixerPanic().length, 16);
});

test("desktop project store works with an adapter", async () => {
  const files = new Map();
  const store = createDesktopProjectStore({ read: async (path) => files.get(path), write: async (path, text) => files.set(path, text) });
  await store.save("song.uaos.json", { name: "Offline" });
  assert.equal((await store.load("song.uaos.json")).name, "Offline");
});
