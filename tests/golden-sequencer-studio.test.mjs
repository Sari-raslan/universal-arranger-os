import test from "node:test";
import assert from "node:assert/strict";
import { Sequencer } from "../backend/src/sequencer.js";
import { renderGoldenSequencerSketch } from "../backend/src/render/goldenSequencerStudio.js";

test("sequencer still toggles steps and ticks", () => {
  const seq = new Sequencer();
  seq.start();
  seq.toggle("kick", 1);
  assert.equal(seq.steps[0].kick, false);
  seq.tick();
  assert.equal(seq.position, 1);
});

test("golden sequencer renders a multi-pitch musical sketch", () => {
  const result = renderGoldenSequencerSketch({ tempo: 100, bars: 4 });
  assert.equal(result.rendered.ok, true, result.rendered.errorCode);
  assert.equal(result.musicalQualityPass, false);
  assert.equal(result.commercialReady, false);
  assert.equal(result.rendered.analysis.musicalQualityPass, false);
  assert.ok(result.rendered.analysis.uniqueMidiCount >= 4);
  assert.ok(result.rendered.analysis.voices.includes("kick"));
  assert.ok(result.rendered.analysis.voices.includes("bass"));
  assert.ok(result.rendered.analysis.voices.includes("chord"));
  assert.ok(result.song.some((s) => s.section === "Intro"));
  assert.ok(result.harmony.sections.some((s) => s.chord === "Cm"));
  assert.ok(result.harmony.sections.some((s) => s.chord === "Ab" || s.chord === "Bb"));
});
