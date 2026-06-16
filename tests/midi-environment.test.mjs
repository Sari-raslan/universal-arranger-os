import test from "node:test";
import assert from "node:assert/strict";
import {
  getMidiNavigator,
  isWebMidiAvailable,
  readMidiMappings,
  writeMidiMappings,
} from "../uaos-live-clean/src/hooks/midiEnvironment.js";

test("web midi availability handles missing navigator safely", () => {
  assert.equal(getMidiNavigator({}), null);
  assert.equal(isWebMidiAvailable({}), false);
  assert.equal(isWebMidiAvailable({ navigator: { requestMIDIAccess() {} } }), true);
});

test("midi mapping storage helper tolerates absent storage and invalid json", () => {
  assert.deepEqual(readMidiMappings(undefined, "missing"), {});
  const storage = {
    value: "{not-json",
    getItem() {
      return this.value;
    },
    setItem(key, next) {
      this.value = next;
      this.key = key;
    },
  };

  assert.deepEqual(readMidiMappings(storage, "uaos"), {});
  assert.equal(writeMidiMappings(storage, "uaos", { learn: { type: "noteOn" } }), true);
  assert.equal(storage.key, "uaos");
  assert.equal(storage.value.includes("noteOn"), true);
});
