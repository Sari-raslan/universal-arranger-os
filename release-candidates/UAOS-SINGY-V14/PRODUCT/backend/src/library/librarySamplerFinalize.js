/**
 * Library / Sampler / Golden Set Factory finalize — metadata + provenance only.
 */
import { createSamplerMap, appendProvenance } from "./samplerProvenance.js";
import { loadArticulationEngine } from "./articulationEngine.js";

export function librarySamplerFinalize() {
  const map = createSamplerMap({
    id: "uaos-golden-meta-pack-1",
    title: "UAOS cleared metadata pack",
    rights: "UAOS_OWNED_OR_CLEARED",
    entries: [
      { name: "kick", midiNote: 36 },
      { name: "snare", midiNote: 38 },
      { name: "hat", midiNote: 42 }
    ]
  });
  const unverified = createSamplerMap({
    id: "bad",
    title: "bad",
    rights: "UNVERIFIED_COMMERCIAL"
  });
  let ledger = appendProvenance(null, { action: "create-map", artifactSha256: map.sha256 });
  ledger = appendProvenance(ledger.ledger, { action: "qa-pass-metadata", artifactSha256: map.sha256 });
  const articulations = loadArticulationEngine({
    engine: "UAOS Articulation Engine",
    version: "1",
    rules: [
      { name: "legato", trigger: "overlap" },
      { name: "slide", trigger: "velocity>105" }
    ]
  });
  return {
    ok: map.ok && !unverified.ok && ledger.ok && articulations.rules.length >= 2,
    map: map.map,
    mapSha256: map.sha256,
    provenanceSha256: ledger.sha256,
    unverifiedBlocked: unverified.errorCode,
    articulations: articulations.rules.map((r) => r.name),
    audioCopied: false,
    BLOCKED_EXTERNAL_GATES: ["LEGAL_OWNER_REQUIRED_DATA for unverified commercial"],
    commercialReady: false,
    capabilityId: "uaos.library.sampler-finalize/v1"
  };
}
