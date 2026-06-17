import test from "node:test";
import assert from "node:assert/strict";
import {
  MIDI_REALTIME,
  createExternalClockPlan,
  sendAllNotesOff,
  stopExternalClockTransport,
} from "../uaos-live-clean/src/hardware/safeMidiTransport.js";

test("creates a one-bar 24 PPQN plan", () => {
  const plan = createExternalClockPlan({ bpm: 100, bars: 1, beatsPerBar: 4 });
  assert.equal(plan.pulseCount, 96);
  assert.equal(plan.pulsesPerQuarter, 24);
  assert.ok(Math.abs(plan.pulseIntervalMs - 25) < 0.001);
});

test("clamps unsafe clock values", () => {
  const plan = createExternalClockPlan({ bpm: 9999, bars: 0, beatsPerBar: 0 });
  assert.equal(plan.bpm, 240);
  assert.equal(plan.bars, 1);
  assert.equal(plan.beatsPerBar, 1);
  assert.equal(plan.pulseCount, 24);
});

test("panic covers all 16 channels", () => {
  const messages = [];
  sendAllNotesOff({ send: (bytes) => messages.push(bytes) });
  assert.equal(messages.length, 48);
  assert.deepEqual(messages[0], [0xb0, 120, 0]);
  assert.deepEqual(messages[2], [0xb0, 123, 0]);
  assert.deepEqual(messages.at(-1), [0xbf, 123, 0]);
});

test("stop helper sends STOP and cleanup", () => {
  const messages = [];
  let cleared = false;
  stopExternalClockTransport({
    send: (bytes) => messages.push(bytes),
    clear: () => { cleared = true; },
  });
  assert.deepEqual(messages[0], [MIDI_REALTIME.STOP]);
  assert.equal(messages.length, 49);
  assert.equal(cleared, true);
});