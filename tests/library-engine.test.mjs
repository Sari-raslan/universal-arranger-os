import test from "node:test";
import assert from "node:assert/strict";
import {
  createLibraryManifest,
  matchesZone,
  normalizeLibraryPath,
  selectRoundRobin,
  selectZone,
  validateManifest,
} from "../uaos-live-clean/src/library/libraryManifest.js";

function manifest(overrides = {}) {
  return createLibraryManifest({
    libraryId: "uaos-oud-001",
    name: "UAOS Oud",
    vendor: "UAOS",
    licenseStatus: "original-uaos",
    instrumentFamily: "oud",
    rootNote: 60,
    keyRange: { low: 36, high: 84 },
    velocityRange: { low: 1, high: 127 },
    tags: ["oriental", "plucked"],
    filePath: "original/oud/oud-c4.wav",
    ...overrides,
  });
}

test("library manifest validates required fields and relative paths", () => {
  const value = manifest();
  assert.equal(value.filePath, "original/oud/oud-c4.wav");
  assert.equal(validateManifest(value).length, 0);
  assert.throws(() => normalizeLibraryPath("../outside.wav"));
  assert.throws(() => normalizeLibraryPath("C:\\Samples\\outside.wav"));
});

test("key and velocity zones are matched deterministically", () => {
  const zone = manifest();
  assert.equal(matchesZone(zone, 60, 100), true);
  assert.equal(matchesZone(zone, 20, 100), false);
});

test("round robin selection advances and wraps", () => {
  const values = ["a", "b", "c"];
  const first = selectRoundRobin(values, 0);
  const third = selectRoundRobin(values, 2);
  assert.deepEqual(first, { item: "a", index: 0, nextCursor: 1 });
  assert.deepEqual(third, { item: "c", index: 2, nextCursor: 0 });
});

test("zone selection returns matching candidates", () => {
  const zones = [
    manifest({ libraryId: "soft", velocityRange: { low: 1, high: 70 } }),
    manifest({ libraryId: "hard", velocityRange: { low: 71, high: 127 } }),
  ];

  const result = selectZone(zones, 60, 100, 0);
  assert.equal(result.item.libraryId, "hard");
  assert.equal(result.candidates, 1);
});