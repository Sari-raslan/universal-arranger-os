import test from "node:test";
import assert from "node:assert/strict";
import { createSamplerMap, appendProvenance } from "../backend/src/library/samplerProvenance.js";

test("sampler map accepts cleared rights and refuses unverified commercial", () => {
  const ok = createSamplerMap({
    id: "uaos-own-map-1",
    title: "Synthetic metadata map",
    rights: "UAOS_OWNED_OR_CLEARED",
    entries: [{ name: "kick", midiNote: 36 }]
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.map.audioCopied, false);
  const bad = createSamplerMap({ id: "x", title: "y", rights: "UNVERIFIED_COMMERCIAL" });
  assert.equal(bad.ok, false);
  assert.equal(bad.errorCode, "LEGAL_OWNER_REQUIRED_DATA");
});

test("provenance ledger is tamper-evident via sha256", () => {
  const first = appendProvenance(null, { action: "create", artifactSha256: "abc" });
  const second = appendProvenance(first.ledger, { action: "inspect", artifactSha256: "abc" });
  assert.equal(second.ledger.events.length, 2);
  assert.match(second.sha256, /^[a-f0-9]{64}$/);
});
