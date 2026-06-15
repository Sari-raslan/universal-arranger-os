import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  formatMidiEvent,
  isPanicController,
  isSustainController,
  matchesMidiChannel,
  parseMidiMessage,
} from "../uaos-live-clean/src/midi/midiMessageParser.js";
import {
  detectMidiDeviceProfile,
} from "../uaos-live-clean/src/midi/deviceProfiles.js";

test("MIDI note-on and velocity-zero note-off are parsed correctly", () => {
  const noteOn = parseMidiMessage([0x92, 60, 100], 10);
  const noteOff = parseMidiMessage([0x92, 60, 0], 11);

  assert.equal(noteOn.type, "noteOn");
  assert.equal(noteOn.channel, 2);
  assert.equal(noteOn.note, 60);
  assert.equal(noteOn.velocity, 100);

  assert.equal(noteOff.type, "noteOff");
  assert.equal(noteOff.note, 60);
});

test("sustain, panic, and channel filters are deterministic", () => {
  const sustain = parseMidiMessage([0xb0, 64, 127]);
  const panic = parseMidiMessage([0xb0, 123, 0]);

  assert.equal(isSustainController(sustain.controller), true);
  assert.equal(isPanicController(panic.controller), true);
  assert.equal(matchesMidiChannel(sustain, "all"), true);
  assert.equal(matchesMidiChannel(sustain, "0"), true);
  assert.equal(matchesMidiChannel(sustain, "1"), false);
});

test("pitch bend is converted to a centered 14-bit value", () => {
  const center = parseMidiMessage([0xe0, 0, 64]);
  const minimum = parseMidiMessage([0xe0, 0, 0]);

  assert.equal(center.centeredValue, 0);
  assert.equal(minimum.centeredValue, -8192);
});

test("known arranger and controller names select device profiles", () => {
  assert.equal(
    detectMidiDeviceProfile("PA5X MIDI", "KORG").id,
    "korg-pa5x",
  );
  assert.equal(
    detectMidiDeviceProfile("KONTROL S88 MK3", "Native Instruments").id,
    "ni-kontrol-s88-mk3",
  );
  assert.equal(
    detectMidiDeviceProfile("Unknown Controller", "").id,
    "generic-midi-device",
  );
});

test("human-readable MIDI formatting includes note and channel", () => {
  const message = parseMidiMessage([0x90, 64, 90]);
  assert.match(formatMidiEvent(message), /Note On 64/);
  assert.match(formatMidiEvent(message), /ch 1/);
});

test("sampler UI contains safe Web MIDI controls", () => {
  const source = fs.readFileSync(
    path.join(
      process.cwd(),
      "uaos-live-clean",
      "src",
      "components",
      "SamplerWorkbench.jsx",
    ),
    "utf8",
  );

  assert.match(source, /Connect MIDI/);
  assert.equal(source.includes("SysEx") && source.includes("disabled"), true);
  assert.match(source, /Panic \/ All Notes Off/);
  assert.match(source, /Record MIDI Events/);
});
