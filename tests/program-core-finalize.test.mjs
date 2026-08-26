import test from "node:test";
import assert from "node:assert/strict";
import { analyzeArrangementIntelligence } from "../backend/src/arranger/arrangementIntelligence.js";
import { arrangerStudioEndToEnd } from "../backend/src/render/arrangerStudioE2e.js";
import { goldenSequencerEndToEnd, transportCommand, createTransport } from "../backend/src/render/goldenSequencerTransport.js";
import { createCreatorWorkspace } from "../backend/src/creator/creatorWorkspace.js";
import { studioProSurface } from "../backend/src/studio/studioProSurface.js";
import { createMemoryStorage } from "../backend/src/session/memoryStorage.js";

test("Musical Brain arrangement intelligence passes technical gates", () => {
  const result = analyzeArrangementIntelligence({});
  assert.equal(result.ok, true);
  assert.equal(result.gates.ok, true);
  assert.equal(result.ownerMusicalQualityPass, false);
});

test("Arranger Studio E2E leaves V13 mixer read-only", () => {
  const result = arrangerStudioEndToEnd({});
  assert.equal(result.ok, true);
  assert.equal(result.v13Mixer, "READ_ONLY_DEPENDENCY");
});

test("Golden Sequencer transport + E2E", () => {
  let t = createTransport({ tempo: 100 });
  t = transportCommand(t, "play").transport;
  assert.equal(t.state, "playing");
  const e2e = goldenSequencerEndToEnd({ tempo: 100, bars: 2 });
  assert.equal(e2e.ok, true);
  assert.equal(e2e.commercialReady, false);
});

test("Creator workspace and Studio Pro surface finalize", () => {
  const storage = createMemoryStorage();
  const creator = createCreatorWorkspace({ title: "Creator E2E", storage });
  assert.equal(creator.ok, true);
  assert.ok(creator.workspace.tracks.length >= 4);
  const studio = studioProSurface({ storage, title: "Studio Surface" });
  assert.equal(studio.ok, true);
  assert.ok(studio.panels.every((p) => p.ready));
});
