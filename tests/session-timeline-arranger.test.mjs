import test from "node:test";
import assert from "node:assert/strict";
import { createArrangerState, reduceArranger } from "../uaos-live-clean/src/arranger/arrangerEngine.js";
import { createDefaultSession, exportSession, importSession, migrateSession, validateSession } from "../uaos-live-clean/src/session/sessionStore.js";
import { createTimelineStore } from "../uaos-live-clean/src/timeline/timelineStore.js";

test("session validation and migration", () => {
  const session = migrateSession({ name: "Gig", bpm: 500 });
  assert.equal(session.bpm, 260);
  assert.equal(validateSession(session).ok, true);
  assert.equal(importSession(exportSession(session)).name, "Gig");
  assert.equal(validateSession({ bpm: 2 }).ok, false);
  assert.equal(createDefaultSession().version, 7);
});

test("timeline capture throttles audio and avoids playback re-record", () => {
  const store = createTimelineStore({ captureIntervalMs: 80 });
  store.startRecording(1000);
  assert.ok(store.capture("audio.analysis", { rms: 0.1 }, 1010));
  assert.equal(store.capture("audio.analysis", { rms: 0.2 }, 1020), null);
  assert.ok(store.capture("midi", { note: 60 }, 1030));
  store.setPlayback(true);
  assert.equal(store.capture("midi", { note: 62 }, 1040), null);
  assert.equal(store.getState().events.length, 2);
});

test("arranger state transitions", () => {
  let state = createArrangerState();
  state = reduceArranger(state, { type: "start" });
  assert.equal(state.running, true);
  state = reduceArranger(state, { type: "section", section: "VAR_B" });
  assert.equal(state.section, "VAR_B");
  state = reduceArranger(state, { type: "tick" });
  assert.equal(state.beat, 2);
  state = reduceArranger(state, { type: "mute", lane: "bass" });
  assert.equal(state.muted.bass, true);
});
