import test from "node:test";
import assert from "node:assert/strict";
import { estimateChordFromMidiNotes, frequencyToMidi, midiToNoteName } from "../uaos-live-clean/src/core/music.js";
import { createAllNotesOffMessages, parseMidiMessage, transformMidiEvent } from "../uaos-live-clean/src/midi/midiEngine.js";

test("music helpers convert frequency and note names", () => {
  assert.equal(frequencyToMidi(440), 69);
  assert.equal(midiToNoteName(60), "C4");
  assert.deepEqual(estimateChordFromMidiNotes([60, 64, 67]), { name: "C", confidence: 0.75 });
});

test("midi parser handles channel events", () => {
  assert.equal(parseMidiMessage([0x90, 60, 100]).type, "noteon");
  assert.equal(parseMidiMessage([0x90, 60, 0]).type, "noteoff");
  assert.equal(parseMidiMessage([0xb1, 7, 88]).channel, 2);
  assert.equal(parseMidiMessage([0xe0, 0, 64]).value, 0);
});

test("midi transforms transpose and panic", () => {
  const event = parseMidiMessage([0x90, 60, 100]);
  assert.equal(transformMidiEvent(event, { transpose: 2, outputChannel: 3 }).note, 62);
  assert.equal(transformMidiEvent(event, { split: { enabled: true, zone: "lower", note: 50 } }), null);
  assert.equal(createAllNotesOffMessages().length, 16);
  assert.deepEqual(createAllNotesOffMessages(1), [[0xb0, 123, 0]]);
});
