/**
 * Golden Sequencer / Arranger Studio glue.
 * Recovers proven SongArranger + Sequencer + ChordEngine + independent renderer.
 * Does not claim Musical Brain PASS, V13 Mixer, or commercial readiness.
 */
import { Sequencer } from "../sequencer.js";
import { SongArranger } from "../song-arranger.js";
import { ArrangerEngine } from "../arranger-engine.js";
import { ChordEngine } from "../chord-engine.js";
import { renderMusicalSketch } from "./musicalSketchRenderer.js";

const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function parseChordSymbol(symbol) {
  const raw = String(symbol || "C").trim();
  const m = raw.match(/^([A-G])([#b]?)(m|dim|aug)?/i);
  if (!m) return { rootPc: 0, quality: "major", symbol: raw };
  let pc = PC[m[1].toUpperCase()];
  if (m[2] === "#") pc += 1;
  if (m[2] === "b") pc -= 1;
  const quality = m[3] === "m" ? "minor" : m[3] === "dim" ? "diminished" : m[3] === "aug" ? "augmented" : "major";
  return { rootPc: (pc + 12) % 12, quality, symbol: raw };
}

export function triadMidi(symbol, bassOctave = 2) {
  const { rootPc, quality } = parseChordSymbol(symbol);
  const third = quality === "minor" || quality === "diminished" ? 3 : 4;
  const fifth = quality === "diminished" ? 6 : quality === "augmented" ? 8 : 7;
  const bass = 12 * bassOctave + rootPc;
  return { bass, chord: [bass + 12, bass + 12 + third, bass + 12 + fifth], quality };
}

/**
 * Compact excerpt of a SongArranger plan: one bar per section until maxBars.
 * Uses real arranger chords; does not invent a new song form.
 */
export function songChordEvents(song, { tempo = 100, maxBars = 4, excerptBarsPerSection = 1 } = {}) {
  const beat = 60 / tempo;
  const events = [];
  const used = [];
  let bar = 0;
  for (const part of song || []) {
    if (bar >= maxBars) break;
    const take = Math.min(excerptBarsPerSection, maxBars - bar, part.bars || 1);
    const triad = triadMidi(part.chord);
    used.push({ section: part.section, chord: part.chord, bars: take, quality: triad.quality });
    for (let b = 0; b < take; b += 1) {
      const startSec = (bar + b) * 4 * beat;
      events.push({
        midi: triad.bass,
        startSec,
        durationSec: beat * 3.5,
        voice: "bass",
        wave: "saw",
        velocity: 0.74
      });
      triad.chord.forEach((midi, i) => {
        events.push({
          midi,
          startSec: startSec + 0.02 * i,
          durationSec: beat * 3.2,
          voice: "chord",
          wave: "triangle",
          velocity: 0.55,
          pan: (i - 1) * 0.25
        });
      });
    }
    bar += take;
  }
  return { events, sections: used, barsFilled: bar };
}

export function createGoldenSequencerStudio({ tempo = 100, bars = 4, style = "Oriental Pop" } = {}) {
  const sequencer = new Sequencer();
  const arranger = new SongArranger();
  const engine = new ArrangerEngine();
  engine.setTempo(tempo);
  engine.setSection("Intro");
  const song = arranger.generate(style);
  return {
    sequencer,
    arranger,
    engine,
    song: song.song,
    tempo,
    bars,
    musicalQualityPass: false,
    commercialReady: false
  };
}

export function renderGoldenSequencerSketch(options = {}) {
  const studio = createGoldenSequencerStudio(options);
  const drums = studio.sequencer.toRenderEvents({
    tempo: studio.tempo,
    bars: studio.bars,
    includeBass: false
  });
  const harmony = songChordEvents(studio.song, { tempo: studio.tempo, maxBars: studio.bars });
  const events = [...drums, ...harmony.events];
  const detected = new ChordEngine().detect(harmony.events.filter((e) => e.voice === "chord").map((e) => e.midi));
  const rendered = renderMusicalSketch(events);
  return {
    ...studio,
    events,
    harmony,
    detectedChord: detected.chord,
    rendered,
    capabilityId: "uaos.golden-sequencer-studio/v1",
    musicalQualityPass: false,
    commercialReady: false
  };
}
