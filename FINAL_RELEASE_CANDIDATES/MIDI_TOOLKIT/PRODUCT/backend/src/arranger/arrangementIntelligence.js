/**
 * Arrangement intelligence beyond sketch — Golden Brain technical layer.
 * Prefer importing from `backend/src/goldenBrain/goldenBrainCore.js` (CANONICAL).
 * This module remains as an internal building block used by the canonical core.
 * Does not claim owner musical taste PASS.
 */
import { ChordEngine } from "../chord-engine.js";
import { SongArranger } from "../song-arranger.js";
import { buildArrangementPlan } from "./personalized-arranger.js";
import { runMusicalBrainGates } from "./musicalBrainGates.js";
import { proposeCompatibleAlternative, scoreAlternative } from "./tonalContext.js";
import { HIJAZ_MELODY_MIDI } from "../render/uaosOriginalSketch.js";

export function analyzeArrangementIntelligence({
  melody = HIJAZ_MELODY_MIDI,
  tasteProfile = { genres: "arabic khaleeji" }
} = {}) {
  const chords = new ChordEngine().detect(melody);
  const plan = buildArrangementPlan({ melody: melody.join(","), tasteProfile });
  const song = new SongArranger().generate("Oriental Pop");
  const sections = song.song.map((s) => ({ name: s.section, bars: s.bars, chord: s.chord }));
  const alt = proposeCompatibleAlternative({
    melody,
    harmonyFamily: "maqam-hijaz"
  }, { groove: "arabic-khaleeji-fill", tempo: plan.arrangement.tempo });
  const scoring = scoreAlternative(
    { melody, harmonyFamily: "maqam-hijaz" },
    alt
  );
  const gates = runMusicalBrainGates({
    source: { melody, harmonyFamily: "maqam-hijaz" },
    candidate: alt,
    sections: sections.slice(0, 3).map((s) => ({ name: s.name, bars: s.bars || 2 })),
    sourceArrangement: { sections: sections.slice(0, 3) },
    candidateArrangement: { sections: sections.slice(0, 3) }
  });
  return {
    ok: scoring.ok && gates.ok && plan.ok,
    detectedChord: chords.chord,
    plan: plan.arrangement,
    sections,
    scoring,
    gates,
    musicalQualityClaim: false,
    ownerMusicalQualityPass: false,
    capabilityId: "uaos.golden-brain.arrangement-intelligence/v1"
  };
}
