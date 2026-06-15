import test from "node:test";
import assert from "node:assert/strict";
import { VoiceAllocator } from "../uaos-live-clean/src/sampler/voiceAllocator.js";

test("voice allocator enforces polyphony and steals the oldest voice", () => {
  const allocator = new VoiceAllocator({ maxVoices: 2 });

  allocator.noteOn({ note: 60, velocity: 100, sampleId: "a", startedAt: 10 });
  allocator.noteOn({ note: 62, velocity: 100, sampleId: "b", startedAt: 20 });
  const result = allocator.noteOn({ note: 64, velocity: 100, sampleId: "c", startedAt: 30 });

  assert.equal(result.stolenVoice.sampleId, "a");
  assert.deepEqual(
    allocator.getActiveVoices().map((voice) => voice.sampleId),
    ["b", "c"],
  );
});

test("choke groups release earlier voices in the same group", () => {
  const allocator = new VoiceAllocator({ maxVoices: 8 });

  allocator.noteOn({
    note: 42,
    velocity: 100,
    sampleId: "closed-hat",
    chokeGroup: "hat",
  });

  const result = allocator.noteOn({
    note: 46,
    velocity: 100,
    sampleId: "open-hat",
    chokeGroup: "hat",
  });

  assert.equal(result.chokedVoices.length, 1);
  assert.equal(result.chokedVoices[0].sampleId, "closed-hat");
  assert.equal(allocator.getActiveVoices().length, 1);
});

test("note-off and panic release active voices", () => {
  const allocator = new VoiceAllocator({ maxVoices: 8 });
  allocator.noteOn({ note: 60, velocity: 100, sampleId: "one" });
  allocator.noteOn({ note: 62, velocity: 100, sampleId: "two" });

  assert.equal(allocator.noteOff(60).length, 1);
  assert.equal(allocator.getActiveVoices().length, 1);
  assert.equal(allocator.panic().length, 1);
  assert.equal(allocator.getActiveVoices().length, 0);
});