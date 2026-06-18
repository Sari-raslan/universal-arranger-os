import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("master sequential autopilot contains all canonical stages", () => {
  const source = fs.readFileSync(
    "scripts/UAOS_MASTER_SEQUENTIAL_AUTOPILOT.ps1",
    "utf8",
  );

  for (const stage of [
    "00-preflight.ps1",
    "10-quality.ps1",
    "20-runtime.ps1",
    "30-release-gate.ps1",
    "40-inventory.ps1",
    "50-final-status.ps1",
  ]) {
    assert.equal(source.includes(stage), true);
  }

  assert.match(
    source,
    /UAOS MASTER SEQUENTIAL AUTOPILOT COMPLETED/,
  );
});