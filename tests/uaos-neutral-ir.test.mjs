import test from "node:test";
import assert from "node:assert/strict";
import {
  familyFromExtension,
  canClaim,
  normalizeMidiToIr,
  convertFromIr,
  inspectBuffer,
  proveMidiRoundtrip,
  encodeMidiSmf
} from "../backend/src/convert/uaosNeutralIr.js";

test("MIDI can normalize to IR; file write is not claimed", () => {
  const fam = familyFromExtension(".mid");
  assert.equal(canClaim(fam, "NORMALIZE_TO_UAOS_IR").ok, true);
  assert.equal(canClaim(fam, "CONVERT_FROM_UAOS_IR").ok, true);
  assert.equal(canClaim(fam, "ROUNDTRIP_VERIFIED").ok, true);
  assert.equal(canClaim(fam, "WRITE").ok, false);
  assert.equal(canClaim(fam, "HARDWARE_VERIFIED").ok, false);
  const ir = normalizeMidiToIr({ validHeader: true, notes: 4, tempoEvents: 1, controllers: 0, programChanges: 0, ppq: 480 });
  assert.equal(ir.ok, true);
  assert.equal(ir.ir.musicalQualityClaim, false);
});

test("Korg SET stays inspect-only with format contract for write", () => {
  const fam = familyFromExtension(".set", "Korg");
  assert.equal(canClaim(fam, "INSPECT").ok, true);
  assert.equal(canClaim(fam, "CONVERT_FROM_UAOS_IR").ok, false);
  const write = canClaim(fam, "WRITE");
  assert.equal(write.ok, false);
  assert.ok(["FORMAT_CONTRACT_REQUIRED", "KORG_WRITE_UNSUPPORTED"].includes(write.errorCode));
  const inspected = inspectBuffer(Buffer.from("KORG SET placeholder bytes"), ".set", "Korg");
  assert.equal(inspected.level, "INSPECT");
  assert.equal(inspected.write, "FORMAT_CONTRACT_REQUIRED");
});

test("convert-from-IR writer is unsupported without MIDI note events", () => {
  assert.equal(convertFromIr().ok, false);
});

test("MIDI SMF roundtrips pitches through Neutral IR", () => {
  const bytes = encodeMidiSmf({
    noteEvents: [
      { midi: 60, startTick: 0, durationTicks: 480, velocity: 90, channel: 0 },
      { midi: 64, startTick: 480, durationTicks: 480, velocity: 80, channel: 0 },
      { midi: 67, startTick: 960, durationTicks: 480, velocity: 80, channel: 0 }
    ],
    ppq: 480
  });
  const ir = normalizeMidiToIr(bytes);
  assert.equal(ir.ok, true);
  assert.equal(ir.level, "NORMALIZE_TO_UAOS_IR");
  assert.ok(ir.ir.noteEvents.length >= 3);
  const back = convertFromIr(ir.ir);
  assert.equal(back.ok, true);
  assert.equal(back.level, "CONVERT_FROM_UAOS_IR");
  assert.equal(back.hardwareVerified, false);
  const proof = proveMidiRoundtrip(bytes);
  assert.equal(proof.ok, true);
  assert.equal(proof.level, "ROUNDTRIP_VERIFIED");
  assert.equal(proof.hardwareVerified, false);
});
