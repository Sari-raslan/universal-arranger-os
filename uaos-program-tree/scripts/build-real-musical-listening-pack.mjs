import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { renderMusicalSketch } from "file:///C:/keyboard-manager-clean/backend/src/render/musicalSketchRenderer.js";
import { runPipeline, rawMelodyScore, HIJAZ_MELODY_MIDI } from "file:///C:/keyboard-manager-clean/backend/src/render/musicalListeningPipeline.js";
import { bassForHarmony, HIJAZ_CHORDS } from "file:///C:/keyboard-manager-clean/backend/src/render/uaosOriginalSketch.js";

const PACK = "C:\\keyboard-manager-clean\\docs\\owner-listening-pack";
const MUSICAL = path.join(PACK, "musical-examples");
const TECH = path.join(PACK, "technical-fixtures");
const SOURCE_COMMIT = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: "C:\\keyboard-manager-clean",
  encoding: "utf8"
}).trim();

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function writeExample(id, title, pipeline, extra) {
  if (!pipeline.rendered.ok) throw new Error(`${id}: ${pipeline.rendered.errorCode}`);
  const wavPath = path.join(MUSICAL, `${id}.wav`);
  fs.writeFileSync(wavPath, pipeline.rendered.buffer);
  const card = {
    id,
    title,
    SOURCE_INPUT: extra.SOURCE_INPUT,
    EXPECTED_CAPABILITY: extra.EXPECTED_CAPABILITY,
    ACTUAL_ACTIONS: extra.ACTUAL_ACTIONS,
    WAV_PATH: wavPath,
    DURATION: pipeline.rendered.durationSec,
    SAMPLE_RATE: pipeline.rendered.sampleRate,
    SHA256: sha256(pipeline.rendered.buffer),
    SOURCE_COMMIT,
    SETTINGS: {
      variant: pipeline.decision.variant,
      tempo: pipeline.decision.tempo,
      groove: pipeline.decision.groove,
      harmony: pipeline.decision.harmony,
      sections: pipeline.score.sections,
      uniqueMidiCount: pipeline.rendered.analysis.uniqueMidiCount,
      uniqueOnsetCount: pipeline.rendered.analysis.uniqueOnsetCount,
      voices: pipeline.rendered.analysis.voices
    },
    WHAT_OWNER_SHOULD_LISTEN_FOR: extra.WHAT_OWNER_SHOULD_LISTEN_FOR,
    KNOWN_LIMITATIONS: extra.KNOWN_LIMITATIONS,
    musicalQualityPass: false,
    musicalQualityClaim: false,
    sineFixture: false,
    technicalFixtureUsedAsMusicalProof: false
  };
  fs.writeFileSync(path.join(MUSICAL, `${id}.json`), JSON.stringify(card, null, 2));
  return card;
}

fs.mkdirSync(MUSICAL, { recursive: true });
fs.mkdirSync(TECH, { recursive: true });

for (const name of ["technical-mix-not-musical-proof.wav", "a440-sine-analysis-fixture.wav"]) {
  const from = path.join(PACK, "fixtures", name);
  const to = path.join(TECH, name);
  if (fs.existsSync(from)) fs.copyFileSync(from, to);
}

const melodyScore = rawMelodyScore(HIJAZ_MELODY_MIDI, 96);
const melodyRendered = renderMusicalSketch(melodyScore.events);
const melodyPipeline = {
  understood: { midiList: HIJAZ_MELODY_MIDI, noteCount: HIJAZ_MELODY_MIDI.length },
  decision: { variant: "hijaz", tempo: 96, groove: "melody-only", harmony: "unison", musicalQualityPass: false },
  score: melodyScore,
  rendered: melodyRendered
};

const hijazArranged = runPipeline({ variant: "hijaz", includeArrangement: true });
const beforeEvents = [
  ...rawMelodyScore(HIJAZ_MELODY_MIDI, 96).events,
  ...bassForHarmony(HIJAZ_CHORDS.slice(0, 2), { tempo: 96, startSec: 0 })
];
const beforeRendered = renderMusicalSketch(beforeEvents);
const hijazRaw = {
  understood: { midiList: HIJAZ_MELODY_MIDI, noteCount: HIJAZ_MELODY_MIDI.length },
  decision: { variant: "hijaz", tempo: 96, groove: "melody-plus-bass", harmony: "roots-only", musicalQualityPass: false },
  score: { tempo: 96, sections: [{ name: "Before", bars: 2 }], events: beforeEvents },
  rendered: beforeRendered
};
const majorArranged = runPipeline({ variant: "major-pop", includeArrangement: true });
const demoEvents = [
  ...hijazArranged.score.events,
  {
    midi: 48,
    startSec: hijazArranged.rendered.durationSec - 0.2,
    durationSec: 1.4,
    voice: "bass",
    wave: "saw",
    velocity: 0.9
  },
  {
    midi: 60,
    startSec: hijazArranged.rendered.durationSec - 0.2,
    durationSec: 1.4,
    voice: "lead",
    wave: "triangle",
    velocity: 0.95
  }
];
const demoRendered = renderMusicalSketch(demoEvents);
const hijazDemo = { ...hijazArranged, score: { ...hijazArranged.score, events: demoEvents }, rendered: demoRendered };

const limits = [
  "Offline oscillator sketch, not a sampled library and not real-time DSP.",
  "Not Musical Brain quality PASS.",
  "Original UAOS sketch — not product catalog content and not a licensed song."
];

const cards = [
  writeExample("01-melody-example", "Melody example", melodyPipeline, {
    SOURCE_INPUT: "Original UAOS Hijaz-inspired MIDI phrase (C/Db/E/F/G/Ab contour).",
    EXPECTED_CAPABILITY: "Render a real short melody, not a single test tone.",
    ACTUAL_ACTIONS: ["Load original 16-note phrase", "Render lead voice with envelope"],
    WHAT_OWNER_SHOULD_LISTEN_FOR: "A moving melody with several pitches and rhythm. Not a stuck 440 Hz beep.",
    KNOWN_LIMITATIONS: limits
  }),
  writeExample("02-arrangement-example", "Arrangement example (Intro / Verse / Chorus)", hijazArranged, {
    SOURCE_INPUT: "Same Hijaz phrase plus SongArranger/personalized-arranger section plan.",
    EXPECTED_CAPABILITY: "Intro drums/bass, verse melody, chorus melody+chords.",
    ACTUAL_ACTIONS: ["Understand pitches/chords", "Decide arabic-khaleeji groove", "Arrange 1+2+2 bars", "Offline render"],
    WHAT_OWNER_SHOULD_LISTEN_FOR: "Section change: groove first, then tune, then thicker chorus.",
    KNOWN_LIMITATIONS: limits
  }),
  writeExample("03-before-raw-melody", "Before — raw melody", hijazRaw, {
    SOURCE_INPUT: "Same Hijaz phrase before drums/chorus harmony (melody + bass roots only).",
    EXPECTED_CAPABILITY: "Show the material before full arrangement logic.",
    ACTUAL_ACTIONS: ["Understand melody", "Add bass roots only", "Omit drums and chorus stabs"],
    WHAT_OWNER_SHOULD_LISTEN_FOR: "Tune plus bass, no drum groove yet. Compare with 04-after.",
    KNOWN_LIMITATIONS: limits
  }),
  writeExample("04-after-arranged", "After — arranged", hijazArranged, {
    SOURCE_INPUT: "Same Hijaz phrase after arrangement decision.",
    EXPECTED_CAPABILITY: "Same material with bass, drums, and chorus harmony.",
    ACTUAL_ACTIONS: ["Reuse Understand", "Apply arrangement", "Render mixed sketch"],
    WHAT_OWNER_SHOULD_LISTEN_FOR: "Bass/drums/chords added under the same tune. Still not a quality PASS.",
    KNOWN_LIMITATIONS: limits
  }),
  writeExample("05-alternative-b-major-pop", "Alternative B — major-pop", majorArranged, {
    SOURCE_INPUT: "Same phrase contour rewritten to C major (C D E F G A).",
    EXPECTED_CAPABILITY: "A/B: different key/groove from the Hijaz arrangement.",
    ACTUAL_ACTIONS: ["Decide modern-pop / 110 BPM", "Arrange and render"],
    WHAT_OWNER_SHOULD_LISTEN_FOR: "Brighter major tune and faster groove versus 02/04.",
    KNOWN_LIMITATIONS: limits
  }),
  writeExample("06-full-short-demo", "Full short demo — Understand → Decide → Arrange → Render", hijazDemo, {
    SOURCE_INPUT: "Original Hijaz sketch through the full local pipeline.",
    EXPECTED_CAPABILITY: "One short clip that concatenates proven chain steps.",
    ACTUAL_ACTIONS: [
      "Understand: pitch set + chord-engine detect",
      "Decide: personalized-arranger arabic-khaleeji",
      "Arrange: Intro/Verse/Chorus events",
      "Render: independent stereo WAV (not V13 mixer)"
    ],
    WHAT_OWNER_SHOULD_LISTEN_FOR: "The whole sketch as a tiny demo. Judge musical usefulness, not a rubber stamp.",
    KNOWN_LIMITATIONS: limits
  })
];

const catalog = {
  schema: "uaos.owner-listening-pack.real-musical/v1",
  createdAt: new Date().toISOString(),
  STATUS: "OWNER_LISTENING_PACK_REAL_MUSICAL_CONTENT_READY",
  REAL_MUSICAL_WAV_COUNT: cards.length,
  REAL_MUSICAL_UNIQUE_SHA256_COUNT: new Set(cards.map((c) => c.SHA256)).size,
  TECHNICAL_FIXTURE_USED_AS_MUSICAL_PROOF: "NO",
  COMMANDER_CHANGED: "NO",
  V13_OWNED_FILES_CHANGED: "NO",
  PUBLIC_RELEASE: "NO",
  PAYMENT: "NO",
  KORG_WRITE: "UNSUPPORTED",
  TASK_05_00605: "OWNER_GATE",
  musicalQualityPass: false,
  SOURCE_COMMIT,
  examples: cards,
  technicalFixturesNotProof: [
    path.join(TECH, "technical-mix-not-musical-proof.wav"),
    path.join(TECH, "a440-sine-analysis-fixture.wav")
  ]
};
fs.writeFileSync(path.join(PACK, "real-musical-catalog.json"), JSON.stringify(catalog, null, 2));
console.log(JSON.stringify({ ok: true, count: cards.length, commit: SOURCE_COMMIT, sha: cards.map((c) => [c.id, c.SHA256]) }, null, 2));
