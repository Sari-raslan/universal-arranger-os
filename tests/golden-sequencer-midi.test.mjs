import test from "node:test";
import assert from "node:assert/strict";
import { exportGoldenSequencerMidi } from "../backend/src/export/goldenSequencerMidi.js";

test("golden sequencer exports SMF draft through Neutral IR", () => {
  const result = exportGoldenSequencerMidi({ tempo: 100, bars: 2 });
  assert.equal(result.ok, true);
  assert.equal(result.draft.format, "uaos-midi-draft-json");
  assert.ok(result.noteEvents.length >= 4);
  assert.equal(result.parsed.validHeader, true);
  assert.equal(result.ir.ok, true);
  assert.equal(result.commercialReady, false);
  assert.equal(result.hardwareVerified, false);
  assert.equal(result.musicalQualityPass, false);
});
