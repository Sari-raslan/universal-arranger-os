import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("completion audit covers security, mock paths, desktop, and Android", () => {
  const source = fs.readFileSync(
    "scripts/UAOS_TRUE_COMPLETION_AUDIT.ps1",
    "utf8",
  );

  for (const token of [
    "placeholder",
    "mockMode",
    "demoMode",
    "npm audit --json",
    "npm outdated --json",
    "ANDROID_HOME",
    "electronMain",
    "UAOS TRUE COMPLETION AUDIT PASS",
  ]) {
    assert.equal(source.includes(token), true);
  }
});