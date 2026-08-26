import test from "node:test";
import assert from "node:assert/strict";
import { validateRequestedPath, assertSafeAction, ALLOWED_PATHS } from "../backend/src/governance/allowedPath.js";

test("NONE is the current safe selection", () => {
  const r = validateRequestedPath("NONE");
  assert.equal(r.ok, true);
  assert.equal(r.selectedPath, "NONE");
  assert.equal(r.writer, false);
});

test("three planning paths are allowed and writer stays off", () => {
  assert.equal(ALLOWED_PATHS.length, 3);
  for (const id of ALLOWED_PATHS) {
    const r = validateRequestedPath(id);
    assert.equal(r.ok, true);
    assert.equal(r.writer, false);
    assert.equal(r.deploy, false);
  }
});

test("writer and deploy actions fail closed", () => {
  assert.equal(validateRequestedPath("PATH-REAL-WRITER").ok, false);
  assert.equal(assertSafeAction("deploy/public release").ok, false);
  assert.equal(assertSafeAction("korg write").ok, false);
});
