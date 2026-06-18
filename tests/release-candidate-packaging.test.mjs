import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("release candidate packager creates verifiable artifacts", () => {
  const source = fs.readFileSync(
    "scripts/UAOS_BUILD_RELEASE_CANDIDATE.ps1",
    "utf8",
  );

  for (const requirement of [
    "release-candidate",
    "RELEASE_NOTES.md",
    "manifest.json",
    "SHA256SUMS.txt",
    "Compress-Archive",
    "Get-FileHash",
    "UAOS RELEASE CANDIDATE PACKAGE PASS",
  ]) {
    assert.equal(source.includes(requirement), true);
  }
});