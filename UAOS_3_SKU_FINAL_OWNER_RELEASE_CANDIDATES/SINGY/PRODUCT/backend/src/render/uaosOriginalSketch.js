/**
 * Original UAOS-owned sketch material. Not a licensed song. Not a sine fixture.
 * Hijaz-inspired short phrase in C, plus a major-pop alternative of the same contour.
 */
export const SOURCE_SKETCH_ID = "uaos-original-hijaz-sketch-v1";

export const HIJAZ_MELODY_MIDI = [60, 61, 64, 65, 67, 68, 67, 65, 64, 61, 60, 64, 65, 64, 61, 60];
export const MAJOR_MELODY_MIDI = [60, 62, 64, 65, 67, 69, 67, 65, 64, 62, 60, 64, 65, 64, 62, 60];

export function beatDuration(tempo, beats) {
  return (60 / tempo) * beats;
}

export function melodyEvents(midiList, { tempo = 96, startSec = 0, stepBeats = 0.5, voice = "lead", wave = "triangle", velocity = 0.86 } = {}) {
  const step = beatDuration(tempo, stepBeats);
  return midiList.map((midi, i) => ({
    midi,
    startSec: startSec + i * step,
    durationSec: step * 0.92,
    voice,
    wave,
    velocity,
    pan: voice === "lead" ? 0.12 : 0
  }));
}

export function bassForHarmony(chords, { tempo = 96, startSec = 0, barBeats = 4 } = {}) {
  const bar = beatDuration(tempo, barBeats);
  return chords.map((chord, i) => ({
    midi: chord.rootMidi,
    startSec: startSec + i * bar,
    durationSec: bar * 0.92,
    voice: "bass",
    wave: "saw",
    velocity: 0.78,
    pan: -0.15
  }));
}

export function chordStabs(chords, { tempo = 96, startSec = 0, barBeats = 4 } = {}) {
  const bar = beatDuration(tempo, barBeats);
  const events = [];
  for (let i = 0; i < chords.length; i += 1) {
    const t0 = startSec + i * bar;
    for (const midi of chords[i].midis) {
      events.push({
        midi,
        startSec: t0,
        durationSec: bar * 0.45,
        voice: "chord",
        wave: "square",
        velocity: 0.55,
        pan: -0.25
      });
      events.push({
        midi,
        startSec: t0 + bar * 0.5,
        durationSec: bar * 0.4,
        voice: "chord",
        wave: "square",
        velocity: 0.42,
        pan: 0.2
      });
    }
  }
  return events;
}

export function drumGroove({ tempo = 96, startSec = 0, bars = 4, barBeats = 4, density = "normal" } = {}) {
  const beat = beatDuration(tempo, 1);
  const events = [];
  const totalBeats = bars * barBeats;
  for (let b = 0; b < totalBeats; b += 1) {
    const t = startSec + b * beat;
    if (b % 2 === 0) {
      events.push({ midi: 36, startSec: t, durationSec: 0.18, voice: "kick", velocity: 0.95 });
    }
    if (b % 4 === 2) {
      events.push({ midi: 38, startSec: t, durationSec: 0.12, voice: "snare", velocity: 0.8 });
    }
    events.push({ midi: 42, startSec: t, durationSec: 0.05, voice: "hat", velocity: b % 2 === 0 ? 0.45 : 0.28 });
    if (density === "fill") {
      events.push({ midi: 42, startSec: t + beat * 0.5, durationSec: 0.04, voice: "hat", velocity: 0.22 });
    }
  }
  return events;
}

export const HIJAZ_CHORDS = [
  { name: "C", rootMidi: 36, midis: [48, 52, 55] },
  { name: "Db", rootMidi: 37, midis: [49, 52, 56] },
  { name: "C", rootMidi: 36, midis: [48, 52, 55] },
  { name: "G", rootMidi: 43, midis: [43, 47, 50] }
];

export const MAJOR_CHORDS = [
  { name: "C", rootMidi: 36, midis: [48, 52, 55] },
  { name: "F", rootMidi: 41, midis: [53, 57, 60] },
  { name: "G", rootMidi: 43, midis: [43, 47, 50] },
  { name: "C", rootMidi: 36, midis: [48, 52, 55] }
];

/** Hijaz-compatible color voicings for in-context alternatives only. Does not rewrite the scale. */
export const HIJAZ_ALT_CHORDS = [
  { name: "C-hijaz", rootMidi: 36, midis: [48, 52, 55, 56] },
  { name: "Db", rootMidi: 37, midis: [49, 52, 56, 61] },
  { name: "C-hijaz", rootMidi: 36, midis: [48, 52, 55, 56] },
  { name: "G", rootMidi: 43, midis: [43, 47, 50] }
];
