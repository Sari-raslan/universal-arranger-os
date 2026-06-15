import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  createInstrumentPreset,
  inferRootNoteFromFileName,
  noteNameToMidi,
  parseInstrumentPreset,
  playbackRateForNotes,
  selectSampleZone,
} from "../uaos-live-clean/src/sampler/instrumentPreset.js";

test("note names and file names infer MIDI roots", () => {
  assert.equal(noteNameToMidi("C4"), 60);
  assert.equal(noteNameToMidi("F#3"), 54);
  assert.equal(inferRootNoteFromFileName("Oud_C4.wav"), 60);
  assert.equal(inferRootNoteFromFileName("Piano_root72.wav"), 72);
});

test("playback rates transpose samples by semitones", () => {
  assert.equal(playbackRateForNotes(60, 60), 1);
  assert.ok(Math.abs(playbackRateForNotes(72, 60) - 2) < 0.000001);
  assert.ok(Math.abs(playbackRateForNotes(48, 60) - 0.5) < 0.000001);
});

test("sample selection honors key and velocity zones", () => {
  const samples = [
    {
      id: "soft",
      loaded: true,
      keyLow: 36,
      keyHigh: 84,
      velocityLow: 1,
      velocityHigh: 64,
    },
    {
      id: "hard",
      loaded: true,
      keyLow: 36,
      keyHigh: 84,
      velocityLow: 65,
      velocityHigh: 127,
    },
  ];

  assert.equal(selectSampleZone(samples, 60, 40, 0).item.id, "soft");
  assert.equal(selectSampleZone(samples, 60, 100, 0).item.id, "hard");
  assert.equal(selectSampleZone(samples, 10, 100, 0).item, null);
});

test("preset export and import preserves normalized mappings", () => {
  const preset = createInstrumentPreset({
    name: "Test Oud",
    samples: [
      {
        id: "oud",
        fileName: "Oud_C4.wav",
        rootNote: 60,
        loaded: true,
      },
    ],
  });

  const parsed = parseInstrumentPreset(JSON.stringify(preset));

  assert.equal(parsed.name, "Test Oud");
  assert.equal(parsed.samples[0].rootNote, 60);
  assert.equal(parsed.samples[0].loaded, false);
});

test("sampler UI exposes local WAV and preset controls", () => {
  const source = fs.readFileSync(
    path.join(
      process.cwd(),
      "uaos-live-clean",
      "src",
      "components",
      "SamplerWorkbench.jsx",
    ),
    "utf8",
  );

  assert.equal(source.includes("Import WAV files"), true);
  assert.equal(source.includes("Export preset"), true);
  assert.equal(source.includes("ADSR"), true);
  assert.equal(source.includes("Panic / All Notes Off"), true);
  assert.equal(source.includes("Math.random"), false);
});