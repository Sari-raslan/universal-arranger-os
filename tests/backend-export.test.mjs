import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { makePattern, toMidi } = require("../backend/server.js");

test("backend deterministic pattern and midi export", () => {
  const pattern = makePattern({ tempo: 96, chord: "Cm", structure: ["INTRO", "FILL_1"] });
  assert.equal(pattern.generator, "deterministic-v1-pattern");
  assert.ok(pattern.notes.length > 0);
  const midi = toMidi(pattern);
  assert.equal(midi.subarray(0, 4).toString(), "MThd");
});
