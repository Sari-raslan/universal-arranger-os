import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  createNeutralMidiDraft
} = require("../backend/services/neutralMidiDraft.js");

test("creates a valid Standard MIDI File header", () => {
  const draft = createNeutralMidiDraft({
    title: "Test Draft",
    bpm: 96,
    key: "C",
    scale: "minor",
    sections: [
      { type: "intro", startBar: 1, lengthBars: 4, energy: 0.25 },
      { type: "verse", startBar: 5, lengthBars: 8, energy: 0.5 }
    ]
  });

  assert.equal(
    draft.buffer.subarray(0, 4).toString("ascii"),
    "MThd"
  );
  assert.equal(draft.contentType, "audio/midi");
  assert.equal(draft.manifest.bpm, 96);
  assert.equal(draft.manifest.sectionCount, 2);
  assert.equal(
    draft.manifest.containsProprietaryData,
    false
  );
  assert.ok(draft.buffer.length > 100);
});

test("clamps unsafe BPM and creates a safe filename", () => {
  const draft = createNeutralMidiDraft({
    title: "Unsafe / Name",
    bpm: 9999,
    sections: []
  });

  assert.equal(draft.manifest.bpm, 240);
  assert.equal(draft.filename, "Unsafe_Name.mid");
});