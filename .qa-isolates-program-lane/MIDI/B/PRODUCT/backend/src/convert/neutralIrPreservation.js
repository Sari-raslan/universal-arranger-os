/**
 * Safe SysEx + opaque vendor preservation for Neutral IR.
 * Unknown SysEx: preserve, do not execute or interpret without proof.
 */
import crypto from "node:crypto";

export function hashPayload(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function extractSysexBlocks(buffer) {
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  const blocks = [];
  let i = 0;
  while (i < buf.length) {
    if (buf[i] === 0xf0 || buf[i] === 0xf7) {
      const startByte = buf[i];
      let j = i + 1;
      if (startByte === 0xf0) {
        while (j < buf.length && buf[j] !== 0xf7) j += 1;
        const end = j < buf.length ? j : buf.length - 1;
        const slice = buf.subarray(i, end + 1);
        blocks.push({
          startOffset: i,
          length: slice.length,
          manufacturerId: slice.length > 1 ? slice[1] : null,
          rawHex: slice.toString("hex"),
          payloadSha256: hashPayload(slice),
          preservationStatus: "PRESERVED_OPAQUE",
          interpretationStatus: "NOT_INTERPRETED",
          execute: false
        });
        i = end + 1;
        continue;
      }
    }
    i += 1;
  }
  return blocks;
}

export function createVendorExtensions({
  vendor = "unknown",
  family = "unknown",
  generation = null,
  buffer = null,
  opaqueBlocks = [],
  sourceOffsets = [],
  metadata = {}
} = {}) {
  const buf = Buffer.isBuffer(buffer) ? buffer : null;
  const blocks =
    opaqueBlocks.length > 0
      ? opaqueBlocks
      : buf
        ? [
            {
              offset: 0,
              length: buf.length,
              sha256: hashPayload(buf),
              hexPreview: buf.subarray(0, Math.min(128, buf.length)).toString("hex"),
              preservationStatus: "PRESERVED_OPAQUE"
            }
          ]
        : [];
  return {
    schema: "uaos.neutral-ir.vendor-extensions/v1",
    vendor,
    family,
    generation,
    opaqueBlocks: blocks,
    sourceOffsets,
    checksums: blocks.map((b) => b.sha256).filter(Boolean),
    metadata: { ...metadata, preserveUnknownWhenSafe: true },
    interpretationStatus: "NOT_INTERPRETED_WITHOUT_PROOF"
  };
}

export function preserveEventsFromMidiIr(midiIr = {}) {
  const noteEvents = midiIr.noteEvents || [];
  return {
    notes: noteEvents.map((n) => ({
      midi: n.midi,
      startTick: n.startTick,
      durationTicks: n.durationTicks,
      velocity: n.velocity,
      channel: n.channel
    })),
    velocity: true,
    controllers: midiIr.controllerEvents || [],
    programChanges: midiIr.programChangeEvents || [],
    bankSelect: midiIr.bankSelectEvents || [],
    pitchBend: midiIr.pitchBendEvents || [],
    aftertouch: midiIr.aftertouchEvents || [],
    tempoEvents: midiIr.tempoEvents || [],
    timeSignatures: midiIr.timeSignatures || [],
    markers: midiIr.markers || [],
    lyrics: midiIr.lyrics || []
  };
}
