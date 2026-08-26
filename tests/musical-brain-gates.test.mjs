import test from "node:test";
import assert from "node:assert/strict";
import { runMusicalBrainGates, sectionContinuity } from "../backend/src/arranger/musicalBrainGates.js";
import { HIJAZ_MELODY_MIDI, MAJOR_MELODY_MIDI } from "../backend/src/render/uaosOriginalSketch.js";

test("musical brain gates pass for in-context Hijaz alternative", () => {
  const sections = [
    { name: "Intro", bars: 1 },
    { name: "Verse", bars: 2 },
    { name: "Chorus", bars: 2 }
  ];
  const result = runMusicalBrainGates({
    source: { melody: HIJAZ_MELODY_MIDI, harmonyFamily: "maqam-hijaz" },
    candidate: { melody: HIJAZ_MELODY_MIDI, harmonyFamily: "maqam-hijaz", styleChanged: true },
    sections,
    sourceArrangement: { sections },
    candidateArrangement: { sections }
  });
  assert.equal(result.ok, true);
  assert.equal(result.tonalContextPreservation, true);
  assert.equal(result.sectionContinuity, true);
  assert.equal(result.arrangementContextPreservation, true);
  assert.equal(result.noObviousOutOfScaleCollisions, true);
  assert.equal(result.ownerMusicalQualityPass, false);
});

test("musical brain gates fail unrequested major rewrite and broken sections", () => {
  const bad = runMusicalBrainGates({
    source: { melody: HIJAZ_MELODY_MIDI, harmonyFamily: "maqam-hijaz" },
    candidate: { melody: MAJOR_MELODY_MIDI, harmonyFamily: "major-pop", styleChanged: true },
    sections: [{ name: "A", bars: 0 }]
  });
  assert.equal(bad.ok, false);
  assert.equal(sectionContinuity([{ name: "A", bars: 2 }, { name: "A", bars: 2 }]).ok, false);
});
