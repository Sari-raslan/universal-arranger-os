import test from "node:test";
import assert from "node:assert/strict";
import { analyzeMonophonicWav, writePcm16MonoSine } from "../backend/src/perception/melodyAnalysis.js";

test("A440 sine is detected near MIDI 69", () => {
  const wav = writePcm16MonoSine(440, 0.4);
  const result = analyzeMonophonicWav(wav);
  assert.equal(result.ok, true);
  assert.equal(result.musicalQualityClaim, false);
  assert.ok(result.notes.length >= 1);
  assert.equal(result.notes[0].midi, 69);
});

test("silent WAV fails closed", () => {
  const frames = 4410;
  const dataSize = frames * 2;
  const b = Buffer.alloc(44 + dataSize);
  b.write("RIFF", 0);
  b.writeUInt32LE(36 + dataSize, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(44100, 24);
  b.writeUInt32LE(44100 * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(dataSize, 40);
  const result = analyzeMonophonicWav(b);
  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "SILENT_OR_EMPTY_AUDIO");
});

test("corrupt buffer fails closed", () => {
  const result = analyzeMonophonicWav(Buffer.from("not a wav"));
  assert.equal(result.ok, false);
});
