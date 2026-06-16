import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  createProjectRecord,
  normalizeProjectId,
  sanitizeProjectName,
  sanitizeProjectRecord,
} = require("../backend/server.js");

test("project id normalization rejects path traversal and control characters", () => {
  assert.equal(normalizeProjectId("project-1"), "project-1");
  assert.equal(normalizeProjectId("  session 42  "), "session 42");
  assert.equal(normalizeProjectId("../secret"), "");
  assert.equal(normalizeProjectId("folder\\escape"), "");
  assert.equal(normalizeProjectId("line\nbreak"), "");
});

test("project names are trimmed and bounded", () => {
  assert.equal(sanitizeProjectName("  My Project  "), "My Project");
  assert.equal(sanitizeProjectName("\t\n", "Fallback"), "Fallback");
  assert.equal(sanitizeProjectName("x".repeat(200)).length, 120);
});

test("project records are sanitized before persistence", () => {
  const record = createProjectRecord({
    id: "../unsafe id",
    name: "  Demo Project  ",
    description: "  Line 1\nLine 2\t",
    timeline: [{ id: "a", name: "clip" }],
    session: { mode: "local" },
    metadata: { source: "ui" },
  });

  assert.equal(record.id.startsWith("unsafe"), false);
  assert.equal(record.name, "Demo Project");
  assert.equal(record.description, "Line 1 Line 2");
  assert.equal(record.timeline.length, 1);
  assert.deepEqual(record.session, { mode: "local" });
  assert.deepEqual(record.metadata, { source: "ui" });
});

test("project record sanitization falls back cleanly for empty input", () => {
  const record = sanitizeProjectRecord({});
  assert.equal(typeof record.id, "string");
  assert.equal(record.name, "Untitled Project");
  assert.deepEqual(record.timeline, []);
});
