import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("release gate validates the complete UAOS release path", () => {
  const source = fs.readFileSync(
    "scripts/UAOS_RELEASE_GATE.ps1",
    "utf8",
  );

  for (const requirement of [
    "npm test",
    "npm run check",
    "npm run build",
    "UAOS_RUNTIME_ROUTE_SMOKE.ps1",
    "UAOS_RELEASE_MANIFEST_",
    "UAOS RELEASE GATE PASS",
  ]) {
    assert.equal(source.includes(requirement), true);
  }

  assert.match(source, /backend\/data\/projects\.json/);
  assert.match(source, /ConvertTo-Json/);
  assert.match(source, /distTotalBytes/);
  assert.match(source, /allowedSelfTestChanges/);
});