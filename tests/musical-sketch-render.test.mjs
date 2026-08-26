import test from "node:test";
import assert from "node:assert/strict";
import { renderMusicalSketch } from "../backend/src/render/musicalSketchRenderer.js";
import { runPipeline, rawMelodyScore, HIJAZ_MELODY_MIDI } from "../backend/src/render/musicalListeningPipeline.js";
import { melodyEvents } from "../backend/src/render/uaosOriginalSketch.js";

test("single sine fixture is refused", () => {
  const r = renderMusicalSketch([
    { midi: 69, startSec: 0, durationSec: 4, voice: "lead", wave: "sine", velocity: 0.8 }
  ]);
  assert.equal(r.ok, false);
  assert.ok(["SINE_FIXTURE_REFUSED", "NOT_MUSICAL_SKETCH"].includes(r.errorCode));
});

test("raw Hijaz melody is a multi-pitch musical sketch", () => {
  const score = rawMelodyScore(HIJAZ_MELODY_MIDI, 96);
  const r = renderMusicalSketch(score.events);
  assert.equal(r.ok, true, r.errorCode);
  assert.equal(r.analysis.musicalQualityPass, false);
  assert.equal(r.analysis.testTone, false);
  assert.ok(r.analysis.uniqueMidiCount >= 4);
  assert.ok(r.analysis.uniqueOnsetCount >= 8);
  assert.ok(r.durationSec >= 4);
});

test("arranged hijaz pipeline understand-decide-arrange-render", () => {
  const p = runPipeline({ variant: "hijaz", includeArrangement: true });
  assert.equal(p.understood.noteCount, 16);
  assert.equal(p.decision.musicalQualityPass, false);
  assert.equal(p.decision.groove, "arabic-khaleeji");
  assert.equal(p.rendered.ok, true, p.rendered.errorCode);
  assert.ok(p.rendered.analysis.voices.includes("lead"));
  assert.ok(p.rendered.analysis.voices.includes("kick"));
  assert.ok(p.rendered.analysis.voices.includes("bass"));
  assert.equal(p.project.project.tempo, 96);
});

test("unrequested major-pop rewrite is rejected by tonal scoring", () => {
  const b = runPipeline({ variant: "major-pop", includeArrangement: true });
  assert.equal(b.decision.rejected, true);
  assert.equal(b.decision.errorCode, "UNREQUESTED_REHARMONIZATION");
  assert.equal(b.decision.scoring.unrequestedReharmonization, true);
  assert.equal(b.rendered.ok, false);
});

test("in-context alternative keeps Hijaz pitches and still renders", () => {
  const a = runPipeline({ variant: "hijaz", includeArrangement: true });
  const b = runPipeline({ variant: "alternative-in-context", includeArrangement: true });
  assert.equal(b.rendered.ok, true, b.rendered.errorCode);
  assert.equal(b.decision.scoring.ok, true);
  assert.equal(b.decision.scoring.unrequestedReharmonization, false);
  assert.deepEqual(a.understood.midiList, b.understood.midiList);
  assert.equal(b.decision.groove, "arabic-khaleeji-fill");
  assert.notEqual(a.decision.tempo, b.decision.tempo);
});

test("empty score fails closed", () => {
  assert.equal(renderMusicalSketch([]).ok, false);
  assert.equal(melodyEvents([]).length, 0);
});
