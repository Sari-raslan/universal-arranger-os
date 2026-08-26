import test from "node:test";
import assert from "node:assert/strict";
import { keyboardProFinalize } from "../backend/src/keyboard/keyboardProFinalize.js";
import { converterFinalize } from "../backend/src/convert/converterFinalize.js";
import { voiceMelodyToMidiFinalize } from "../backend/src/perception/voiceMelodyFinalize.js";
import { librarySamplerFinalize } from "../backend/src/library/librarySamplerFinalize.js";

test("Keyboard Pro finalize inspect-only with format gate", () => {
  const result = keyboardProFinalize({});
  assert.equal(result.ok, true);
  assert.equal(result.write.ok, false);
  assert.ok(result.BLOCKED_EXTERNAL_GATES.includes("FORMAT_CONTRACT_REQUIRED"));
});

test("Converter finalize MIDI roundtrip and proprietary inspect gates", () => {
  const result = converterFinalize();
  assert.equal(result.ok, true);
  assert.equal(result.midi.level, "ROUNDTRIP_VERIFIED");
  assert.equal(result.proprietary.write, "FORMAT_CONTRACT_REQUIRED");
});

test("Voice melody-to-MIDI offline finalize keeps mic hardware gate", () => {
  const result = voiceMelodyToMidiFinalize();
  assert.equal(result.ok, true);
  assert.ok(result.BLOCKED_EXTERNAL_GATES.includes("HARDWARE_REQUIRED:microphone"));
  assert.equal(result.ownerMusicalQualityPass, false);
});

test("Library sampler finalize blocks unverified commercial packs", () => {
  const result = librarySamplerFinalize();
  assert.equal(result.ok, true);
  assert.equal(result.audioCopied, false);
  assert.equal(result.unverifiedBlocked, "LEGAL_OWNER_REQUIRED_DATA");
});
