import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  midiNoteName,
  recognizeChord,
  transposeChord,
} from "../uaos-live-clean/src/arranger/chordRecognizer.js";
import {
  ARRANGER_LANES,
  ARRANGER_SECTIONS,
  buildAccompanimentSnapshot,
  commitPendingSection,
  createDefaultOpenStyle,
  normalizeOpenStyle,
  parseOpenStyle,
  requestSection,
  sectionDurationMs,
} from "../uaos-live-clean/src/arranger/openStyleEngine.js";

test("recognizes common triads and seventh chords", () => {
  assert.equal(recognizeChord([60, 64, 67]).name, "C");
  assert.equal(recognizeChord([57, 60, 64]).name, "Am");
  assert.equal(recognizeChord([55, 59, 62, 65]).name, "G7");
  assert.equal(recognizeChord([60, 64, 67, 71]).name, "Cmaj7");
});

test("supports inversions, note names, and transposition", () => {
  const inversion = recognizeChord([52, 55, 60]);
  assert.equal(inversion.name, "C/E");
  assert.equal(midiNoteName(60), "C4");
  assert.equal(transposeChord(
    recognizeChord([60, 64, 67]),
    2,
  ).name, "D");
});

test("open style exposes expected sections and lanes", () => {
  const style = createDefaultOpenStyle();

  assert.equal(ARRANGER_SECTIONS.includes("variation4"), true);
  assert.equal(ARRANGER_LANES.includes("bass"), true);
  assert.equal(style.sections.variation1.lanes.length, 8);
});

test("section changes are queued and committed deterministically", () => {
  const style = createDefaultOpenStyle();
  const queued = requestSection(style, "fill1");
  const committed = commitPendingSection(queued);

  assert.equal(queued.currentSection, "variation1");
  assert.equal(queued.pendingSection, "fill1");
  assert.equal(committed.currentSection, "fill1");
  assert.equal(committed.pendingSection, null);
});

test("style normalization and JSON import preserve timing", () => {
  const style = normalizeOpenStyle({
    ...createDefaultOpenStyle(),
    tempo: 120,
  });

  const parsed = parseOpenStyle(JSON.stringify(style));

  assert.equal(parsed.tempo, 120);
  assert.equal(sectionDurationMs(parsed, "variation1"), 8000);
});

test("accompaniment snapshot reports active lanes", () => {
  const style = createDefaultOpenStyle();
  const chord = recognizeChord([60, 64, 67]);
  const snapshot = buildAccompanimentSnapshot(style, chord);

  assert.equal(snapshot.chord, "C");
  assert.equal(snapshot.section, "variation1");
  assert.equal(snapshot.lanes.length, 8);
});

test("Pro page integrates the open arranger panel", () => {
  const source = fs.readFileSync(
    path.join(
      process.cwd(),
      "uaos-live-clean",
      "src",
      "App.jsx",
    ),
    "utf8",
  );

  assert.equal(
    (
      source.includes('import { ArrangerEnginePanel }') ||
      source.includes('const ArrangerEnginePanel = lazy')
    ),
    true,
  );
  assert.equal(
    source.includes("<ArrangerEnginePanel />"),
    true,
  );
});