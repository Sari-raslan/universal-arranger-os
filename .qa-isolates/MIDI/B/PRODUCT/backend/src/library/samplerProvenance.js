/**
 * Rights-cleared library / sampler metadata ledger.
 * Metadata and provenance only. No commercial sample copying.
 */
import crypto from "node:crypto";

export function createSamplerMap({ id, title, rights = "UAOS_OWNED_OR_CLEARED", entries = [] } = {}) {
  if (!id || !title) return { ok: false, errorCode: "MAP_IDENTITY_REQUIRED" };
  if (rights === "UNVERIFIED_COMMERCIAL" || rights === "UNKNOWN") {
    return { ok: false, errorCode: "LEGAL_OWNER_REQUIRED_DATA" };
  }
  const normalized = entries.map((e, i) => ({
    slot: e.slot ?? i,
    name: e.name || `slot-${i}`,
    midiNote: e.midiNote ?? null,
    source: e.source || "synthetic-metadata",
    audioCopied: false
  }));
  const body = {
    schema: "uaos.sampler-map/v1",
    id,
    title,
    rights,
    entries: normalized,
    audioCopied: false,
    commercialClaim: false
  };
  const sha256 = crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
  return { ok: true, map: body, sha256 };
}

export function appendProvenance(ledger, event) {
  const events = Array.isArray(ledger?.events) ? [...ledger.events] : [];
  const next = {
    at: event.at || new Date().toISOString(),
    action: event.action || "inspect",
    actor: event.actor || "uaos-coordinator",
    artifactSha256: event.artifactSha256 || null,
    note: event.note || ""
  };
  events.push(next);
  const record = { schema: "uaos.library-provenance/v1", events };
  const sha256 = crypto.createHash("sha256").update(JSON.stringify(record)).digest("hex");
  return { ok: true, ledger: record, sha256 };
}
