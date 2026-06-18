import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("runtime smoke script covers lazy routes safely", () => {
  const source = fs.readFileSync(
    "scripts/UAOS_RUNTIME_ROUTE_SMOKE.ps1",
    "utf8",
  );

  for (const route of [
    "studio",
    "sampler",
    "ai",
    "hardware",
    "arranger",
    "pro",
    "sounds",
  ]) {
    assert.match(source, new RegExp(`"${route}"`));
  }

  assert.match(source, /System\.Diagnostics\.ProcessStartInfo/);
  assert.match(source, /RedirectStandardError = \$true/);
  assert.match(source, /psi\.Arguments/);
  assert.doesNotMatch(source, /ArgumentList\.Add/);
  assert.match(source, /--disable-background-networking/);
  assert.match(source, /UAOS could not render this screen/);
  assert.match(source, /Loading UAOS module/);
  assert.match(source, /RUNTIME ROUTE SMOKE PASS/);
});