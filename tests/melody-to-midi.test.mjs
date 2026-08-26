import test from "node:test";
import assert from "node:assert/strict";
import { melodyNotesToMidi } from "../backend/src/perception/melodyToMidi.js";

test("melody notes convert to SMF through Neutral IR without claiming musical quality", () => {
  const result = melodyNotesToMidi(
    [
      { midi: 60, frames: 4 },
      { midi: 62, frames: 4 },
      { midi: 64, frames: 4 },
      { midi: 67, frames: 8 }
    ],
    { tempo: 100 }
  );
  assert.equal(result.ok, true);
  assert.equal(result.musicalQualityClaim, false);
  assert.equal(result.ownerMusicalQualityPass, false);
  assert.equal(result.parsed.validHeader, true);
  assert.ok(result.parsed.noteEvents.length >= 4);
  assert.equal(result.normalized.ok, true);
  assert.deepEqual(
    result.parsed.noteEvents.map((n) => n.midi),
    [60, 62, 64, 67]
  );
});
