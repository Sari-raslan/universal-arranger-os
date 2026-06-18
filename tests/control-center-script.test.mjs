import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("control center exposes the canonical UAOS actions", () => {
  const source = fs.readFileSync(
    "scripts/UAOS_CONTROL_CENTER.ps1",
    "utf8",
  );

  for (const action of [
    "launch",
    "autopilot",
    "release-gate",
    "runtime-smoke",
    "status",
    "reports",
    "stop",
  ]) {
    assert.equal(source.includes(`"${action}"`), true);
  }

  assert.match(source, /UAOS_MASTER_SEQUENTIAL_AUTOPILOT\.ps1/);
  assert.match(source, /UAOS_RELEASE_GATE\.ps1/);
  assert.match(source, /UAOS_RUNTIME_ROUTE_SMOKE\.ps1/);
  assert.match(source, /http:\/\/127\.0\.0\.1:5180/);
});

test("cmd wrapper launches the PowerShell control center", () => {
  const source = fs.readFileSync(
    "scripts/UAOS_CONTROL_CENTER.cmd",
    "utf8",
  );

  assert.match(source, /UAOS_CONTROL_CENTER\.ps1/);
  assert.match(source, /-Action menu/);
});