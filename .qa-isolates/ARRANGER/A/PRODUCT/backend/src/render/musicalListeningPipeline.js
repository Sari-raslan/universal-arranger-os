/**
 * Understand → Decide → Arrange → Render for owner listening sketches.
 * Arrangement decisions are product logic, not Musical Brain quality PASS.
 */
import { createGoldenBrain, GOLDEN_BRAIN_CONTRACT } from "../goldenBrain/goldenBrainCore.js";
import { buildArrangementPlan } from "../arranger/personalized-arranger.js";
import { scoreAlternative, proposeCompatibleAlternative } from "../arranger/tonalContext.js";
import { runMusicalBrainGates } from "../arranger/musicalBrainGates.js";
import { createMusicalSessionMemory } from "../session/musicalSessionMemory.js";
import { renderMusicalSketch } from "./musicalSketchRenderer.js";
import {
  HIJAZ_MELODY_MIDI,
  MAJOR_MELODY_MIDI,
  HIJAZ_CHORDS,
  HIJAZ_ALT_CHORDS,
  SOURCE_SKETCH_ID,
  melodyEvents,
  bassForHarmony,
  chordStabs,
  drumGroove,
  beatDuration
} from "./uaosOriginalSketch.js";

const brain = createGoldenBrain();

export function understandMelody(midiList) {
  const detected = brain.analyzeChords({ melody: midiList });
  return {
    sourceSketchId: SOURCE_SKETCH_ID,
    midiList,
    uniquePitches: [...new Set(midiList)],
    detectedChord: detected.chord,
    quality: detected.raw?.quality,
    noteCount: midiList.length,
    goldenBrainCapabilityId: GOLDEN_BRAIN_CONTRACT.capabilityId
  };
}

export function decideArrangement(understood, variant = "hijaz") {
  const source = {
    melody: understood.midiList,
    harmonyFamily: "maqam-hijaz"
  };
  if (variant === "major-pop") {
    const scored = scoreAlternative(source, {
      melody: MAJOR_MELODY_MIDI,
      harmonyFamily: "major-pop",
      styleChanged: true
    });
    return {
      variant,
      rejected: true,
      errorCode: "UNREQUESTED_REHARMONIZATION",
      groove: "modern-pop",
      harmony: "warm-triads",
      tempo: 110,
      scoring: scored,
      musicalQualityPass: false
    };
  }
  const taste = { genres: "arabic khaleeji", favoriteGenres: "arabic" };
  const suggested = brain.suggestArrangement({
    melody: understood.midiList,
    tasteProfile: taste
  });
  const structure = brain.understandStructure({ style: "Oriental Pop" });
  const plan = buildArrangementPlan({
    melody: understood.midiList.join(","),
    tasteProfile: taste
  });
  const alt = variant === "alternative-in-context"
    ? proposeCompatibleAlternative(source, { groove: "arabic-khaleeji-fill", tempo: 92 })
    : null;
  return {
    variant,
    groove: alt ? alt.groove : suggested.arrangement?.groove || plan.arrangement.groove,
    harmony: suggested.arrangement?.harmony || plan.arrangement.harmony,
    tempo: alt ? alt.tempo : suggested.arrangement?.tempo || plan.arrangement.tempo || 96,
    instrumentation: suggested.arrangement?.instrumentation || plan.arrangement.instrumentation,
    songSections: structure.sections.map((s) => ({ section: s.name, bars: s.bars, chord: s.chord })),
    listeningSections: [
      { name: "Intro", bars: 1 },
      { name: "Verse", bars: 2 },
      { name: "Chorus", bars: 2 }
    ],
    scoring: scoreAlternative(source, {
      melody: understood.midiList,
      harmonyFamily: "maqam-hijaz",
      styleChanged: Boolean(alt)
    }),
    gates: runMusicalBrainGates({
      source,
      candidate: {
        melody: understood.midiList,
        harmonyFamily: "maqam-hijaz",
        styleChanged: Boolean(alt)
      },
      sections: [
        { name: "Intro", bars: 1 },
        { name: "Verse", bars: 2 },
        { name: "Chorus", bars: 2 }
      ],
      sourceArrangement: {
        sections: [
          { name: "Intro", bars: 1 },
          { name: "Verse", bars: 2 },
          { name: "Chorus", bars: 2 }
        ]
      },
      candidateArrangement: {
        sections: [
          { name: "Intro", bars: 1 },
          { name: "Verse", bars: 2 },
          { name: "Chorus", bars: 2 }
        ]
      }
    }),
    musicalQualityPass: false
  };
}

function sectionStart(tempo, barsBefore) {
  return beatDuration(tempo, barsBefore * 4);
}

export function arrangeScore(decision, midiList, chords) {
  const tempo = decision.tempo;
  const intro = sectionStart(tempo, 0);
  const verse = sectionStart(tempo, 1);
  const chorus = sectionStart(tempo, 3);
  const fill = decision.variant === "alternative-in-context";
  const events = [
    ...drumGroove({ tempo, startSec: intro, bars: 5, density: fill ? "fill" : "normal" }),
    ...bassForHarmony([...chords, chords[0]], { tempo, startSec: intro }),
    ...melodyEvents(midiList, { tempo, startSec: fill ? intro : verse, stepBeats: 0.5, voice: "lead" }),
    ...chordStabs(chords.slice(0, 2), { tempo, startSec: fill ? verse : chorus }),
    ...melodyEvents(midiList, { tempo, startSec: chorus, stepBeats: 0.5, voice: "lead", velocity: 0.92 })
  ];
  return {
    tempo,
    sections: decision.listeningSections,
    events,
    chords: chords.map((c) => c.name)
  };
}

export function rawMelodyScore(midiList, tempo = 96) {
  return {
    tempo,
    sections: [{ name: "Melody", bars: 2 }],
    events: melodyEvents(midiList, { tempo, startSec: 0, stepBeats: 0.5 }),
    chords: []
  };
}

export function persistDecision(decision, score) {
  const memory = createMusicalSessionMemory();
  memory.saveProject({
    projectId: SOURCE_SKETCH_ID,
    title: "UAOS original listening sketch",
    tempo: decision.tempo,
    keyCenter: "C",
    arrangement: { sections: score.sections }
  });
  return memory.restore();
}

export function runPipeline({ variant = "hijaz", includeArrangement = true } = {}) {
  const midiList = HIJAZ_MELODY_MIDI;
  const chords = variant === "alternative-in-context" ? HIJAZ_ALT_CHORDS : HIJAZ_CHORDS;
  const understood = understandMelody(midiList);
  const decision = decideArrangement(understood, variant);
  if (decision.rejected) {
    return {
      understood,
      decision,
      score: { tempo: decision.tempo, sections: [], events: [], chords: [] },
      project: null,
      rendered: { ok: false, errorCode: decision.errorCode, analysis: { musicalQualityPass: false } }
    };
  }
  const score = includeArrangement ? arrangeScore(decision, midiList, chords) : rawMelodyScore(midiList, decision.tempo);
  const project = persistDecision(decision, score);
  const rendered = renderMusicalSketch(score.events);
  return { understood, decision, score, project, rendered };
}

export { HIJAZ_MELODY_MIDI, MAJOR_MELODY_MIDI, SOURCE_SKETCH_ID };
