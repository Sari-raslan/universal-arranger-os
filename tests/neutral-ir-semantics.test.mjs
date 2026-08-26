import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  NEUTRAL_IR_VERSION,
  NEUTRAL_IR_LEGACY_VERSION,
  normalizeSectionRole,
  normalizeTrackRole,
  migrateNeutralIrV1ToV2,
  SECTION_ROLES,
  TRACK_ROLES
} from "../backend/src/convert/neutralIrSchema.js";
import {
  buildArrangerNeutralIr,
  validateArrangerNeutralIr,
  buildSectionModel,
  defaultArrangerSectionsFromGoldenBrain
} from "../backend/src/convert/neutralIrArrangerSemantics.js";
import { extractSysexBlocks, createVendorExtensions } from "../backend/src/convert/neutralIrPreservation.js";
import { buildDrumMappingFromNotes } from "../backend/src/convert/neutralIrDrumMapping.js";
import { buildConversionReceipt, receiptFromConversionResult } from "../backend/src/convert/conversionReceipt.js";
import { detectFamilyWithEvidence } from "../backend/src/convert/familyDetection.js";
import { scanLawfulFixtures, inspectFixtureFile } from "../backend/src/convert/lawfulFixtureInspector.js";
import { normalizeMidiToIr, encodeMidiSmf, migrateNeutralIrV1ToV2 as migrateFromCore } from "../backend/src/convert/uaosNeutralIr.js";
import { runConversion, planConversion } from "../backend/src/convert/conversionGraph.js";
import { createFamilyAdapter } from "../backend/src/convert/familyAdapterContract.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIX = path.join(ROOT, "samples", "fixtures", "midi", "reference-demo.mid");

test("section role normalization covers intro/variation/fill/ending", () => {
  assert.equal(normalizeSectionRole("Intro"), "INTRO");
  assert.equal(normalizeSectionRole("Variation 2"), "VARIATION_2");
  assert.equal(normalizeSectionRole("fill-up"), "FILL_UP");
  assert.equal(normalizeSectionRole("Ending 3"), "ENDING_3");
  assert.ok(SECTION_ROLES.includes("BREAK"));
});

test("track role normalization preserves drum channel and unknown vendor roles", () => {
  assert.equal(normalizeTrackRole("DRUM", 9), "DRUM");
  assert.equal(normalizeTrackRole(null, 9), "DRUM");
  assert.equal(normalizeTrackRole("custom-part", 3), "UNKNOWN_VENDOR_ROLE");
  assert.ok(TRACK_ROLES.includes("CHORD_CONTROL"));
});

test("section model ordering and fill transitions", () => {
  const model = buildSectionModel([
    { name: "Intro", bars: 2 },
    { name: "Main", bars: 4 },
    { name: "Variation 1", bars: 4 },
    { name: "Fill Up", bars: 1 },
    { name: "Break", bars: 2 },
    { name: "Ending", bars: 2 }
  ]);
  assert.equal(model.sectionOrdering[0], "INTRO");
  assert.equal(model.introMainFillBreakEnding.main.role, "MAIN");
  assert.ok(model.introMainFillBreakEnding.fills.length >= 1);
  assert.equal(model.introMainFillBreakEnding.break.role, "BREAK");
});

test("unknown drum notes are not silently remapped", () => {
  const map = buildDrumMappingFromNotes([
    { midi: 36, channel: 9, startTick: 0, durationTicks: 100, velocity: 100 },
    { midi: 99, channel: 9, startTick: 100, durationTicks: 100, velocity: 90 }
  ]);
  assert.equal(map.mapped.length, 1);
  assert.equal(map.unmappedEvents.length, 1);
  assert.equal(map.lossy, true);
  assert.match(map.unmappedEvents[0].lossReason, /UNKNOWN/);
});

test("SysEx blocks preserved opaque without execute", () => {
  const buf = Buffer.from([0xf0, 0x41, 0x10, 0x00, 0xf7]);
  const blocks = extractSysexBlocks(buf);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].preservationStatus, "PRESERVED_OPAQUE");
  assert.equal(blocks[0].interpretationStatus, "NOT_INTERPRETED");
  assert.equal(blocks[0].execute, false);
});

test("vendor extensions preserve unknown safely", () => {
  const buf = Buffer.from("KORG SYNTHETIC UAOS");
  const ext = createVendorExtensions({ vendor: "Korg", family: "korg", buffer: buf });
  assert.equal(ext.interpretationStatus, "NOT_INTERPRETED_WITHOUT_PROOF");
  assert.ok(ext.opaqueBlocks.length >= 1);
  assert.equal(ext.metadata.preserveUnknownWhenSafe, true);
});

test("conversion receipt reports loss for proprietary target write", () => {
  const plan = planConversion({ sourceFamily: "midi", targetFamily: "korg" });
  const receipt = receiptFromConversionResult({
    plan,
    toIr: { ok: true },
    write: { ok: false, errorCode: "FORMAT_CONTRACT_REQUIRED" },
    sourceFamily: "midi",
    targetFamily: "korg"
  });
  assert.equal(receipt.LOSSLESS, "NO");
  assert.equal(receipt.FORMAT_CONTRACT_REQUIRED, "YES");
  assert.ok(receipt.DROPPED_FEATURES.includes("targetProprietaryWrite"));
});

test("schema migration v1 to v2", () => {
  const v1 = {
    schema: NEUTRAL_IR_LEGACY_VERSION,
    family: "midi",
    noteEvents: [],
    arrangerSemantics: { schema: "uaos.neutral-ir.arranger-semantics/v1", sections: [] }
  };
  const migrated = migrateNeutralIrV1ToV2(v1);
  assert.equal(migrated.ok, true);
  assert.equal(migrated.ir.schema, NEUTRAL_IR_VERSION);
});

test("MIDI normalize produces v2 arranger semantics", () => {
  const bytes = encodeMidiSmf({
    noteEvents: [{ midi: 60, startTick: 0, durationTicks: 480, velocity: 90, channel: 0 }],
    ppq: 480
  });
  const ir = normalizeMidiToIr(bytes);
  assert.equal(ir.ok, true);
  assert.equal(ir.ir.neutralIrVersion, NEUTRAL_IR_VERSION);
  const v = validateArrangerNeutralIr(ir.ir);
  assert.equal(v.ok, true);
});

test("family detection uses signature not extension alone for MIDI", () => {
  const bytes = encodeMidiSmf({ noteEvents: [{ midi: 60, startTick: 0, durationTicks: 480, velocity: 90, channel: 0 }] });
  const det = detectFamilyWithEvidence(bytes, ".mid");
  assert.equal(det.family, "midi");
  assert.equal(det.SIGNATURE_MATCH, true);
  assert.equal(det.CONFIDENCE, "HIGH");
});

test("korg adapter toNeutralIR is lossy with opaque vendor extensions", () => {
  const adapter = createFamilyAdapter("korg");
  const buf = Buffer.from("KORG SYNTHETIC UAOS_GENERATED\n" + "x".repeat(64));
  const out = adapter.toNeutralIR(buf, ".set");
  assert.equal(out.ok, true);
  assert.equal(out.LOSSY_CONVERSION, true);
  assert.ok(out.ir.arrangerSemantics.vendorExtensions);
});

test("lawful fixture scan inspects generated samples", () => {
  if (!fs.existsSync(FIX)) {
    assert.ok(true, "fixtures not generated yet — skip");
    return;
  }
  const row = inspectFixtureFile(FIX);
  assert.equal(row.DETECTED_FAMILY, "midi");
  assert.equal(row.NEUTRAL_IR_STATUS, "LIMITED_VERIFIED");
});

test("midi to midi conversion includes receipt", () => {
  const bytes = encodeMidiSmf({
    noteEvents: [{ midi: 60, startTick: 0, durationTicks: 480, velocity: 90, channel: 0 }],
    ppq: 480
  });
  const result = runConversion({ sourceFamily: "midi", targetFamily: "midi", bytes, extension: ".mid" });
  assert.ok(result.receipt);
  assert.equal(result.receipt.SOURCE_FAMILY, "midi");
  assert.equal(result.receipt.TARGET_FAMILY, "midi");
});

test("malformed vendor buffer does not crash inspect adapter", () => {
  const adapter = createFamilyAdapter("unknown");
  const out = adapter.inspect(Buffer.alloc(0), ".kst");
  assert.equal(out.ok, true);
});

test("default arranger sections include variation and fill roles", () => {
  const d = defaultArrangerSectionsFromGoldenBrain();
  assert.ok(d.sections.some((s) => s.role === "VARIATION_1"));
  assert.ok(d.sections.some((s) => s.role === "FILL"));
});

console.log("neutral-ir-semantics.test.mjs: all tests registered");
