import test from "node:test";
import assert from "node:assert/strict";

import {
  addTrackToProject,
  createProject,
  parseProject,
  serializeProject,
} from "../uaos-live-clean/src/daw/projectModel.js";

import {
  createDeviceExportPlan,
  validateProjectForDevice,
} from "../uaos-live-clean/src/arranger/deviceExportPlanner.js";

test("UAOS project serializes and parses", () => {
  let project = createProject({
    name: "Test Project",
    tempo: 100,
  });

  project = addTrackToProject(project, {
    id: "track-1",
    name: "Drums",
    role: "drums",
  });

  const parsed = parseProject(serializeProject(project));

  assert.equal(parsed.name, "Test Project");
  assert.equal(parsed.tracks.length, 1);
});

test("device validation rejects unsupported devices", () => {
  const project = createProject({ name: "Test" });
  const result = validateProjectForDevice(project, "unknown-device");

  assert.equal(result.ok, false);
  assert.equal(result.device, null);
});

test("KORG export plan maps tracks to slots", () => {
  let project = createProject({
    name: "Oriental Style",
    tempo: 96,
  });

  project = addTrackToProject(project, {
    id: "drums",
    name: "Drums",
    role: "drums",
  });

  project = addTrackToProject(project, {
    id: "bass",
    name: "Bass",
    role: "bass",
  });

  const result = createDeviceExportPlan(project, "korg-pa5x");

  assert.equal(result.ok, true);
  assert.equal(result.plan.format, "KORG_STYLE");
  assert.equal(result.plan.tracks[0].slot, 1);
  assert.equal(result.plan.tracks[1].slot, 2);
});
