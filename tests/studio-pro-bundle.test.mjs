import test from "node:test";
import assert from "node:assert/strict";
import { buildStudioProBundle } from "../backend/src/studio/studioProBundle.js";
import { createMemoryStorage } from "../backend/src/session/memoryStorage.js";

test("Studio Pro bundle packs project + MIDI draft without commercial claim", () => {
  const result = buildStudioProBundle({
    title: "Offline Studio Draft",
    tempo: 96,
    storage: createMemoryStorage()
  });
  assert.equal(result.ok, true);
  assert.equal(result.bundle.project.title, "Offline Studio Draft");
  assert.ok(result.bundle.midiDraft.noteCount >= 4);
  assert.match(result.sha256, /^[a-f0-9]{64}$/);
  assert.equal(result.bundle.commercialReady, false);
  assert.equal(result.bundle.musicalQualityPass, false);
});
