import test from "node:test";
import assert from "node:assert/strict";
import { createMemoryStorage } from "../backend/src/session/memoryStorage.js";
import {
  CAPABILITY_ID,
  createMusicalSessionMemory,
  validateMusicalProject
} from "../backend/src/session/musicalSessionMemory.js";
import { createSessionMemoryCapability } from "../backend/src/session/sessionMemoryCapabilityAdapter.js";

test("memory storage implements get/set/remove without a browser", () => {
  const storage = createMemoryStorage();
  assert.equal(storage.getItem("missing"), null);
  storage.setItem("k", "v");
  assert.equal(storage.getItem("k"), "v");
  storage.removeItem("k");
  assert.equal(storage.getItem("k"), null);
});

test("musical project round-trips tempo, key, and arrangement sections", () => {
  const memory = createMusicalSessionMemory({ now: () => "2026-08-25T00:00:00.000Z" });
  memory.saveProject({
    projectId: "singy-demo",
    title: "Singy Session",
    tempo: 112,
    keyCenter: "D",
    arrangement: { sections: [{ id: "verse", bars: 8 }] }
  });
  const loaded = memory.loadProject();
  assert.equal(loaded.projectId, "singy-demo");
  assert.equal(loaded.tempo, 112);
  assert.equal(loaded.keyCenter, "D");
  assert.equal(loaded.arrangement.sections[0].id, "verse");
});

test("invalid tempo is rejected", () => {
  assert.equal(validateMusicalProject({ tempo: 12 }).ok, false);
  const memory = createMusicalSessionMemory();
  assert.throws(() => memory.saveProject({ tempo: 900 }), /Tempo/);
});

test("corrupt JSON restore fails closed", () => {
  const storage = createMemoryStorage();
  storage.setItem("uaos.musical.project", "{not-json");
  const memory = createMusicalSessionMemory({ storage });
  assert.throws(() => memory.loadProject(), /corrupt JSON/);
});

test("session restore returns project and transport together", () => {
  const memory = createMusicalSessionMemory();
  memory.saveProject({ projectId: "p1", tempo: 90 });
  memory.saveSession({ playheadMs: 1200, transport: "playing" });
  const restored = memory.restore();
  assert.equal(restored.project.projectId, "p1");
  assert.equal(restored.session.playheadMs, 1200);
  assert.equal(restored.session.transport, "playing");
});

test("capability adapter exposes uaos.session.musical-memory", () => {
  const cap = createSessionMemoryCapability();
  assert.equal(cap.id, CAPABILITY_ID);
  cap.invoke("saveProject", { projectId: "cap-1", tempo: 100 });
  const snap = cap.invoke("snapshot");
  assert.equal(snap.capabilityId, CAPABILITY_ID);
  assert.equal(snap.projectId, "cap-1");
  assert.equal(snap.musicalQualityClaim, false);
});
