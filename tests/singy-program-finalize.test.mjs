import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryStorage } from "../backend/src/session/memoryStorage.js";
import { completeKidsLesson, recordedSingyA11yMatrix, createExercise, runExerciseStep } from "../backend/src/singy/exerciseRunner.js";
import { teenStudioFundamentals } from "../backend/src/singy/teenStudio.js";

test("Singy Kids completes exercises and recorded a11y matrix", () => {
  const result = completeKidsLesson({ storage: createMemoryStorage() });
  assert.equal(result.ok, true);
  assert.equal(result.session.progress, 100);
  const a11y = recordedSingyA11yMatrix();
  assert.equal(a11y.ok, true);
  assert.equal(a11y.liveBrowserProof, false);
});

test("Singy Teen studio fundamentals arrange and export", () => {
  const result = teenStudioFundamentals({ storage: createMemoryStorage(), tempo: 104 });
  assert.equal(result.ok, true);
  assert.equal(result.draft.ok, true);
  assert.ok(result.song.length >= 3);
  const badTempo = runExerciseStep(createExercise("teen-tempo", "teen"), "set-tempo", { tempo: 40 });
  assert.equal(badTempo.ok, false);
});
