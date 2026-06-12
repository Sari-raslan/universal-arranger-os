import test from "node:test";
import assert from "node:assert/strict";
import { analyzeSignal } from "../uaos-live-clean/src/ai/analysisPipeline.js";
import { quantizeNotes, segmentPitchContour } from "../uaos-live-clean/src/ai/voiceToMidi.js";
import { createArrangementPlan, validateArrangementPlan } from "../uaos-live-clean/src/ai/arrangementPlanner.js";
import { createRuleBasedGenerator, validateGeneratedMidi } from "../uaos-live-clean/src/ai/generators.js";
import { getRhythm } from "../uaos-live-clean/src/ai/rhythmFramework.js";
import { evaluateArrangement } from "../uaos-live-clean/src/ai/evaluation.js";
import { MODEL_REGISTRY, createJobQueue } from "../uaos-live-clean/src/ai/aiServices.js";

test("analysis output includes confidence and version", () => {
  const result = analyzeSignal(new Float32Array([0, 0.1, 0.3, 0.1]), 1000);
  assert.ok(result.version);
  assert.ok(result.dynamics.confidence > 0);
});

test("voice to midi segments editable notes from synthetic contour", () => {
  const notes = quantizeNotes(segmentPitchContour([
    { time: 0, frequency: 440, confidence: 0.9 },
    { time: 0.1, frequency: 441, confidence: 0.9 },
    { time: 0.2, frequency: null, confidence: 0 }
  ]));
  assert.equal(notes[0].midi, 69);
  assert.ok(notes[0].duration >= 0.125);
});

test("planner and rule-based generator validate ranges", () => {
  const plan = createArrangementPlan({ tempo: 100, key: "Cm" });
  assert.equal(validateArrangementPlan(plan).ok, true);
  const generator = createRuleBasedGenerator();
  const all = generator.generate(plan);
  const bassOnly = generator.generate(plan, { lane: "bass" });
  assert.ok(all.length > bassOnly.length);
  assert.equal(validateGeneratedMidi(all, plan).ok, true);
  assert.equal(evaluateArrangement(all, plan).rangeValidity, true);
});

test("rhythm framework and AI services remain local and explicit", () => {
  assert.equal(getRhythm("seven-eight").meter, "7/8");
  assert.equal(MODEL_REGISTRY.find((model) => model.id === "cloud-adapter").status, "not-configured");
  const queue = createJobQueue();
  const job = queue.create("analysis", { file: "local" });
  queue.cancel(job.id);
  assert.equal(queue.get(job.id).status, "cancelled");
  queue.deleteUserData();
  assert.equal(queue.get(job.id), undefined);
});
