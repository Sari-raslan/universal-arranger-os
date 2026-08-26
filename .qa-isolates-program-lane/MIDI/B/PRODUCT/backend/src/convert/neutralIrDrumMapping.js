/**
 * Drum semantics with explicit loss reporting — never silent remap.
 */
import { normalizeTrackRole } from "./neutralIrSchema.js";

const GM_KICK = 36;
const GM_SNARE = 38;
const GM_CLOSED_HAT = 42;

export function inferCanonicalDrumRole(sourceNote) {
  const n = Number(sourceNote);
  if (n === GM_KICK) return { canonicalRole: "KICK", confidence: "GM_STANDARD" };
  if (n === GM_SNARE) return { canonicalRole: "SNARE", confidence: "GM_STANDARD" };
  if (n === GM_CLOSED_HAT) return { canonicalRole: "CLOSED_HAT", confidence: "GM_STANDARD" };
  if (n >= 35 && n <= 81) return { canonicalRole: "PERCUSSION_GM_RANGE", confidence: "PARTIAL_GM" };
  return { canonicalRole: "UNKNOWN", confidence: "NONE" };
}

export function buildDrumMappingFromNotes(noteEvents = [], { kitId = null, vendorDrumMapId = null } = {}) {
  const drumChannel = 9;
  const drumNotes = noteEvents.filter((e) => (e.channel ?? drumChannel) === drumChannel);
  const seen = new Map();
  const unmapped = [];
  const mapped = [];

  for (const ev of drumNotes) {
    const key = ev.midi;
    if (seen.has(key)) continue;
    seen.set(key, true);
    const role = inferCanonicalDrumRole(key);
    if (role.canonicalRole === "UNKNOWN") {
      unmapped.push({
        sourceNote: key,
        targetNote: null,
        kitIdentity: kitId,
        vendorDrumMapId,
        gmMapping: false,
        fallbackMapping: false,
        lossReason: "UNKNOWN_PERCUSSION_ARTICULATION_NOT_REMAPPED"
      });
    } else {
      mapped.push({
        canonicalDrumRole: role.canonicalRole,
        sourceNote: key,
        targetNote: key,
        kitIdentity: kitId,
        vendorDrumMapId,
        gmMapping: role.confidence.startsWith("GM"),
        gm2Mapping: role.confidence === "GM_STANDARD",
        fallbackMapping: false,
        lossReason: null
      });
    }
  }

  return {
    schema: "uaos.neutral-ir.drum-mapping/v1",
    mapped,
    unmappedEvents: unmapped,
    lossy: unmapped.length > 0,
    lossReasons: [...new Set(unmapped.map((u) => u.lossReason))],
    preserveUnknown: true
  };
}

export function assignTrackRolesFromChannels(channels = [], noteEvents = []) {
  return channels.map((ch) => {
    const channelNotes = noteEvents.filter((n) => n.channel === ch);
    const role =
      ch === 9
        ? "DRUM"
        : channelNotes.some((n) => n.midi < 48)
          ? "BASS"
          : ch === 0
            ? "MELODY"
            : "ACC1";
    return {
      sourceChannel: ch,
      sourceTrack: ch,
      canonicalRole: normalizeTrackRole(role, ch),
      program: null,
      bank: null,
      drumKit: ch === 9 ? "GM_DEFAULT" : null,
      volume: null,
      pan: null,
      transpose: 0,
      octave: 0,
      mute: false,
      vendorAttributes: {}
    };
  });
}
