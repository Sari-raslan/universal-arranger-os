/**
 * UAOS Neutral IR schema version + canonical enums + safe v1 migration.
 */
export const NEUTRAL_IR_VERSION = "uaos.neutral-ir/v2";
export const NEUTRAL_IR_LEGACY_VERSION = "uaos.neutral-ir/v1";
export const NEUTRAL_IR_ARRANGER_SCHEMA = "uaos.neutral-ir.arranger-semantics/v2";

/** Canonical arranger section roles (vendor names map into role + vendorMetadata). */
export const SECTION_ROLES = Object.freeze([
  "INTRO",
  "INTRO_1",
  "INTRO_2",
  "INTRO_3",
  "MAIN",
  "VARIATION_1",
  "VARIATION_2",
  "VARIATION_3",
  "VARIATION_4",
  "FILL",
  "FILL_UP",
  "FILL_DOWN",
  "FILL_1",
  "FILL_2",
  "FILL_3",
  "FILL_4",
  "BREAK",
  "ENDING",
  "ENDING_1",
  "ENDING_2",
  "ENDING_3",
  "UNKNOWN"
]);

/** Canonical track / arranger part roles. */
export const TRACK_ROLES = Object.freeze([
  "DRUM",
  "PERCUSSION",
  "BASS",
  "ACC1",
  "ACC2",
  "ACC3",
  "ACC4",
  "ACC5",
  "PAD",
  "PHRASE",
  "MELODY",
  "SOLO",
  "CONTROL",
  "CHORD_CONTROL",
  "UNKNOWN_VENDOR_ROLE"
]);

const SECTION_ALIASES = Object.freeze({
  intro: "INTRO",
  intro1: "INTRO_1",
  intro2: "INTRO_2",
  intro3: "INTRO_3",
  main: "MAIN",
  maina: "MAIN",
  variation1: "VARIATION_1",
  variation2: "VARIATION_2",
  variation3: "VARIATION_3",
  variation4: "VARIATION_4",
  var1: "VARIATION_1",
  var2: "VARIATION_2",
  var3: "VARIATION_3",
  var4: "VARIATION_4",
  fill: "FILL",
  fillup: "FILL_UP",
  filldown: "FILL_DOWN",
  fill1: "FILL_1",
  fill2: "FILL_2",
  fill3: "FILL_3",
  fill4: "FILL_4",
  break: "BREAK",
  ending: "ENDING",
  ending1: "ENDING_1",
  ending2: "ENDING_2",
  ending3: "ENDING_3",
  outro: "ENDING",
  verse: "MAIN",
  chorus: "VARIATION_1"
});

export function normalizeSectionRole(nameOrRole) {
  const raw = String(nameOrRole || "").trim();
  if (!raw) return "UNKNOWN";
  const upper = raw.toUpperCase().replace(/[\s-]+/g, "_");
  if (SECTION_ROLES.includes(upper)) return upper;
  const key = raw.toLowerCase().replace(/[\s_-]+/g, "");
  return SECTION_ALIASES[key] || "UNKNOWN";
}

export function normalizeTrackRole(role, channel) {
  const r = String(role || "").toUpperCase().replace(/[\s-]+/g, "_");
  if (TRACK_ROLES.includes(r)) return r;
  if (channel === 9) return "DRUM";
  return "UNKNOWN_VENDOR_ROLE";
}

export function isNeutralIr(ir) {
  return ir && (ir.schema === NEUTRAL_IR_VERSION || ir.schema === NEUTRAL_IR_LEGACY_VERSION);
}

export function migrateNeutralIrV1ToV2(ir) {
  if (!ir) return { ok: false, errorCode: "IR_MISSING" };
  if (ir.schema === NEUTRAL_IR_VERSION && ir.neutralIrVersion === NEUTRAL_IR_VERSION) {
    return { ok: true, ir, migrated: false };
  }
  const next = {
    ...ir,
    schema: NEUTRAL_IR_VERSION,
    neutralIrVersion: NEUTRAL_IR_VERSION,
    migratedFrom: ir.schema === NEUTRAL_IR_LEGACY_VERSION ? NEUTRAL_IR_LEGACY_VERSION : ir.schema || null
  };
  if (next.arrangerSemantics) {
    next.arrangerSemantics = {
      ...next.arrangerSemantics,
      schema: NEUTRAL_IR_ARRANGER_SCHEMA
    };
  }
  return { ok: true, ir: next, migrated: true };
}
