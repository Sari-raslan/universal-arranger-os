import test from "node:test";
import assert from "node:assert/strict";
import {
  scoreAlternative,
  proposeCompatibleAlternative,
  HIJAZ_PITCH_CLASSES
} from "../backend/src/arranger/tonalContext.js";
import { HIJAZ_MELODY_MIDI, MAJOR_MELODY_MIDI } from "../backend/src/render/uaosOriginalSketch.js";

test("unrequested major rewrite fails tonal and harmonic compatibility", () => {
  const scored = scoreAlternative(
    { melody: HIJAZ_MELODY_MIDI, harmonyFamily: "maqam-hijaz" },
    { melody: MAJOR_MELODY_MIDI, harmonyFamily: "major-pop", styleChanged: true }
  );
  assert.equal(scored.ok, false);
  assert.equal(scored.unrequestedReharmonization, true);
  assert.ok(scored.foreign.length > 0);
  assert.ok(scored.score < 55);
});

test("style alternative that keeps Hijaz pitches passes scoring", () => {
  const alt = proposeCompatibleAlternative({
    melody: HIJAZ_MELODY_MIDI,
    harmonyFamily: "maqam-hijaz"
  });
  const scored = scoreAlternative(
    { melody: HIJAZ_MELODY_MIDI, harmonyFamily: "maqam-hijaz" },
    alt
  );
  assert.equal(scored.ok, true);
  assert.equal(scored.tonalContextPreserved, true);
  assert.equal(scored.styleChangeWithoutUnrequestedReharmonization, true);
  assert.deepEqual(alt.melody, HIJAZ_MELODY_MIDI);
  assert.ok(HIJAZ_PITCH_CLASSES.every((pc) => alt.melody.some((m) => m % 12 === pc)));
});
