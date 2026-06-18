import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("final launcher contains all canonical UAOS stages", () => {
  const source = fs.readFileSync(
    "scripts/UAOS_FINAL_SEQUENTIAL_LAUNCHER.ps1",
    "utf8",
  );

  for (const requirement of [
    "UAOS_MASTER_SEQUENTIAL_AUTOPILOT.ps1",
    "UAOS_RUNTIME_ROUTE_SMOKE.ps1",
    "UAOS_RELEASE_GATE.ps1",
    "UAOS_BUILD_RELEASE_CANDIDATE.ps1",
    "npm test",
    "npm run check",
    "npm run build",
    "UAOS FINAL SEQUENTIAL LAUNCHER PASS",
  ]) {
    assert.equal(source.includes(requirement), true);
  }
});