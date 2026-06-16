import test from "node:test";
import assert from "node:assert/strict";
import {
  createUmsProject,
  addSection,
  addTrack,
  validateUmsProject,
  serializeUmsProject
} from "../packages/ums-core/src/index.mjs";

test("creates a valid private UMS project by default", () => {
  const project = createUmsProject({ title: "Demo", sourceFileName: "demo.wav" });
  assert.equal(project.schema, "uaos.music-scene");
  assert.equal(project.rights.category, "user-private-project");
  assert.equal(project.rights.trainingAllowed, false);
  assert.equal(validateUmsProject(project).valid, true);
});

test("adds editable sections and tracks without claiming AI analysis", () => {
  let project = createUmsProject({ title: "Demo" });
  project = addSection(project, { type: "intro", startMs: 0, endMs: 8000 });
  project = addTrack(project, { name: "Reference Audio", role: "reference", kind: "audio" });
  assert.equal(project.timeline.sections.length, 1);
  assert.equal(project.tracks.length, 1);
  assert.equal(project.analysis.status, "not-analyzed");
});

test("serializes a valid project", () => {
  const text = serializeUmsProject(createUmsProject({ title: "Safe Project" }));
  assert.match(text, /uaos\.music-scene/);
});
