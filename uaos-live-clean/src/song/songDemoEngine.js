import { estimateChordFromMidiNotes, midiToNoteName, NOTE_NAMES } from "../core/music.js";

export const SONG_DEMO_VERSION = "uaos-song-demo-v1";
export const PPQ = 480;

export const DEMO_TRACKS = [
  { id: "drums", name: "Drums", channel: 10, program: null },
  { id: "bass", name: "Bass", channel: 2, program: 33 },
  { id: "chords", name: "Chords", channel: 3, program: 4 },
  { id: "pads", name: "Pads", channel: 4, program: 89 },
  { id: "phrases", name: "Phrases", channel: 5, program: 73 },
  { id: "intros", name: "Intros", channel: 6, program: 49 },
  { id: "variations", name: "Variations", channel: 7, program: 25 },
  { id: "fills", name: "Fills", channel: 8, program: 57 },
  { id: "breaks", name: "Breaks", channel: 9, program: 12 },
  { id: "endings", name: "Endings", channel: 11, program: 53 }
];

const ROOTS = {
  C: 60,
  "C#": 61,
  D: 62,
  "D#": 63,
  E: 64,
  F: 65,
  "F#": 66,
  G: 67,
  "G#": 68,
  A: 69,
  "A#": 70,
  B: 71
};

const SECTION_NAMES = ["Intro", "Variation A", "Fill 1", "Variation B", "Break", "Ending", "Variation C", "Fill 2"];

export function createSongDemoProject({ samples, sampleRate, fileName = "Untitled", fileSize = 0, mimeType = "" }) {
  const mono = normalizeSamples(samples);
  const metadata = createMetadata({ samples: mono, sampleRate, fileName, fileSize, mimeType });
  const analysis = analyzeSongBuffer(mono, sampleRate);
  const sections = createSections(metadata.duration, analysis.tempo.bpm);
  const tracks = createArrangementTracks({ analysis, sections, duration: metadata.duration });
  const umsProject = createUmsProject({ metadata, analysis, sections, tracks });
  const styleDraft = createStyleDraft({ metadata, analysis, sections, tracks });
  return { version: SONG_DEMO_VERSION, metadata, analysis, sections, tracks, umsProject, styleDraft };
}

export function normalizeSamples(samples) {
  if (!samples) return new Float32Array();
  if (samples instanceof Float32Array) return samples;
  if (Array.isArray(samples)) return Float32Array.from(samples);
  return Float32Array.from(Array.from(samples));
}

export function createMetadata({ samples, sampleRate, fileName, fileSize, mimeType }) {
  return {
    fileName,
    fileSize,
    mimeType,
    sampleRate,
    duration: round(samples.length / Math.max(1, sampleRate), 3),
    channels: 1,
    createdAt: new Date().toISOString()
  };
}

export function analyzeSongBuffer(samples, sampleRate) {
  const duration = samples.length / Math.max(1, sampleRate);
  const frameSize = Math.max(1024, Math.round(sampleRate * 0.046));
  const hop = Math.max(512, Math.round(frameSize / 2));
  const frames = frameEnergies(samples, sampleRate, frameSize, hop);
  const onsets = pickOnsets(frames);
  const tempo = estimateTempo(onsets, duration);
  const meter = estimateMeter(onsets);
  const pitchNotes = estimatePitchNotes(samples, sampleRate, tempo.bpm);
  const key = estimateKey(pitchNotes);
  const chordTimeline = createChordTimeline({ pitchNotes, key, duration, bpm: tempo.bpm });
  return {
    version: SONG_DEMO_VERSION,
    tempo,
    meter,
    key,
    onsets,
    pitchNotes,
    chordTimeline,
    dynamics: summarizeDynamics(samples)
  };
}

function frameEnergies(samples, sampleRate, frameSize, hop) {
  const frames = [];
  for (let start = 0; start < samples.length; start += hop) {
    let energy = 0;
    let zcr = 0;
    let previous = samples[start] || 0;
    for (let index = start; index < Math.min(samples.length, start + frameSize); index += 1) {
      const value = samples[index] || 0;
      energy += value * value;
      if ((value >= 0 && previous < 0) || (value < 0 && previous >= 0)) zcr += 1;
      previous = value;
    }
    frames.push({ time: start / sampleRate, energy: Math.sqrt(energy / frameSize), zcr });
  }
  return frames;
}

function pickOnsets(frames) {
  if (frames.length < 3) return [];
  const flux = frames.map((frame, index) => Math.max(0, frame.energy - (frames[index - 1]?.energy || 0)));
  const average = flux.reduce((sum, value) => sum + value, 0) / flux.length;
  const threshold = average * 1.65;
  const onsets = [];
  for (let index = 1; index < frames.length - 1; index += 1) {
    if (flux[index] > threshold && flux[index] >= flux[index - 1] && flux[index] >= flux[index + 1]) {
      if (!onsets.length || frames[index].time - onsets.at(-1).time > 0.12) {
        onsets.push({ time: round(frames[index].time, 3), strength: round(flux[index], 5), confidence: 0.62 });
      }
    }
  }
  return onsets.slice(0, 512);
}

function estimateTempo(onsets, duration) {
  if (onsets.length < 4) return { bpm: 120, confidence: 0.15, source: "fallback" };
  const candidates = new Map();
  for (let i = 0; i < onsets.length; i += 1) {
    for (let j = i + 1; j < Math.min(onsets.length, i + 8); j += 1) {
      const interval = onsets[j].time - onsets[i].time;
      if (interval < 0.18 || interval > 2) continue;
      let bpm = 60 / interval;
      while (bpm < 70) bpm *= 2;
      while (bpm > 180) bpm /= 2;
      const rounded = Math.round(bpm);
      candidates.set(rounded, (candidates.get(rounded) || 0) + 1);
    }
  }
  const best = [...candidates.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!best) return { bpm: 120, confidence: 0.15, source: "fallback" };
  const confidence = Math.min(0.92, Math.max(0.25, best[1] / Math.max(1, onsets.length)));
  return { bpm: clamp(best[0], 70, 180), confidence: round(confidence, 2), source: duration > 0 ? "onset-intervals" : "fallback" };
}

function estimateMeter(onsets) {
  if (onsets.length < 8) return { value: "4/4", confidence: 0.35 };
  const groupsOfThree = onsets.filter((_, index) => index % 3 === 0).length;
  const groupsOfFour = onsets.filter((_, index) => index % 4 === 0).length;
  return groupsOfThree > groupsOfFour * 1.25 ? { value: "3/4", confidence: 0.42 } : { value: "4/4", confidence: 0.55 };
}

function estimatePitchNotes(samples, sampleRate, bpm) {
  const step = Math.max(1, Math.round(sampleRate * secondsPerBeat(bpm)));
  const notes = [];
  for (let start = 0; start < samples.length; start += step) {
    const slice = samples.subarray(start, Math.min(samples.length, start + step));
    const midi = estimateDominantMidi(slice, sampleRate);
    if (midi !== null) {
      notes.push({
        id: `melody-${notes.length + 1}`,
        track: "phrases",
        start: round(start / sampleRate, 3),
        duration: round(Math.max(0.25, slice.length / sampleRate), 3),
        midi,
        noteName: midiToNoteName(midi),
        velocity: 82,
        confidence: 0.48
      });
    }
  }
  return notes.slice(0, 96);
}

function estimateDominantMidi(slice, sampleRate) {
  if (!slice.length) return null;
  const rms = Math.sqrt(slice.reduce((sum, value) => sum + value * value, 0) / slice.length);
  if (rms < 0.006) return null;
  let zeroCrossings = 0;
  for (let index = 1; index < slice.length; index += 1) {
    if ((slice[index] >= 0 && slice[index - 1] < 0) || (slice[index] < 0 && slice[index - 1] >= 0)) zeroCrossings += 1;
  }
  const frequency = zeroCrossings * sampleRate / (2 * slice.length);
  if (frequency < 55 || frequency > 1200) return null;
  return clamp(Math.round(69 + 12 * Math.log2(frequency / 440)), 36, 84);
}

function estimateKey(notes) {
  if (!notes.length) return { name: "C", confidence: 0.2, source: "fallback" };
  const histogram = Array.from({ length: 12 }, () => 0);
  for (const note of notes) histogram[note.midi % 12] += note.duration || 1;
  const root = histogram.indexOf(Math.max(...histogram));
  const chord = estimateChordFromMidiNotes([root + 60, root + 64, root + 67]);
  return { name: chord.name === "Unknown" ? NOTE_NAMES[root] : chord.name, confidence: 0.5, source: "pitch-histogram" };
}

function createChordTimeline({ pitchNotes, key, duration, bpm }) {
  const root = ROOTS[key.name.replace("m", "")] || 60;
  const bar = secondsPerBeat(bpm) * 4;
  const progression = [0, 5, 7, 0, 9, 5, 7, 0];
  const count = Math.max(1, Math.ceil(duration / bar));
  return Array.from({ length: count }, (_, index) => {
    const start = round(index * bar, 3);
    const rootNote = root + progression[index % progression.length];
    const nearby = pitchNotes.filter((note) => note.start >= start && note.start < start + bar).map((note) => note.midi);
    const chord = nearby.length >= 3 ? estimateChordFromMidiNotes(nearby) : { name: `${NOTE_NAMES[rootNote % 12]}`, confidence: 0.45 };
    return { start, duration: round(Math.min(bar, duration - start), 3), chord: chord.name, confidence: chord.confidence };
  });
}

function createSections(duration, bpm) {
  const sectionCount = Math.min(SECTION_NAMES.length, Math.max(6, Math.ceil(duration / Math.max(6, secondsPerBeat(bpm) * 16))));
  const sectionLength = duration / sectionCount;
  return Array.from({ length: sectionCount }, (_, index) => ({
    id: `section-${index + 1}`,
    name: SECTION_NAMES[index] || `Part ${index + 1}`,
    type: sectionType(index, sectionCount),
    start: round(index * sectionLength, 3),
    end: round(index === sectionCount - 1 ? duration : (index + 1) * sectionLength, 3),
    confidence: index === 0 || index === sectionCount - 1 ? 0.72 : 0.58
  }));
}

function sectionType(index, count) {
  if (index === 0) return "intro";
  if (index === count - 1) return "ending";
  if (index === 2 || index % 5 === 0) return "fill";
  if (index === 4 || index % 7 === 0) return "break";
  return "variation";
}

export function createArrangementTracks({ analysis, sections, duration }) {
  const bpm = analysis.tempo.bpm;
  const beat = secondsPerBeat(bpm);
  const root = ROOTS[analysis.key.name.replace("m", "")] || 60;
  const tracks = Object.fromEntries(DEMO_TRACKS.map((track) => [track.id, { ...track, notes: [] }]));

  for (let time = 0; time < duration; time += beat) {
    const beatIndex = Math.round(time / beat);
    tracks.drums.notes.push({ start: round(time, 3), duration: 0.08, midi: beatIndex % 4 === 0 ? 36 : 42, velocity: beatIndex % 4 === 0 ? 104 : 68 });
    if (beatIndex % 2 === 1) tracks.drums.notes.push({ start: round(time, 3), duration: 0.08, midi: 38, velocity: 82 });
    tracks.bass.notes.push({ start: round(time, 3), duration: round(beat * 0.82, 3), midi: root - 24 + ((beatIndex % 8) >= 4 ? 7 : 0), velocity: 86 });
  }

  for (const chord of analysis.chordTimeline) {
    const chordRoot = ROOTS[chord.chord.replace("m", "")] || root;
    const quality = chord.chord.endsWith("m") ? [0, 3, 7] : [0, 4, 7];
    for (const interval of quality) {
      tracks.chords.notes.push({ start: chord.start, duration: chord.duration, midi: chordRoot - 12 + interval, velocity: 70 });
      tracks.pads.notes.push({ start: chord.start, duration: chord.duration, midi: chordRoot + interval, velocity: 55 });
    }
  }

  tracks.phrases.notes = analysis.pitchNotes.map((note) => ({ start: note.start, duration: note.duration, midi: note.midi, velocity: note.velocity }));

  for (const section of sections) {
    const target = section.type === "intro" ? "intros" : section.type === "ending" ? "endings" : section.type === "fill" ? "fills" : section.type === "break" ? "breaks" : "variations";
    tracks[target].notes.push({ start: section.start, duration: Math.max(0.2, Math.min(1.5, section.end - section.start)), midi: sectionCueNote(section.type), velocity: 92 });
  }

  return Object.values(tracks);
}

function sectionCueNote(type) {
  return { intro: 72, variation: 76, fill: 79, break: 67, ending: 64 }[type] || 72;
}

export function createUmsProject({ metadata, analysis, sections, tracks }) {
  return {
    schema: "uaos-ums-project",
    version: 1,
    metadata,
    analysis: {
      tempo: analysis.tempo,
      meter: analysis.meter,
      key: analysis.key,
      dynamics: analysis.dynamics,
      chordTimeline: analysis.chordTimeline
    },
    sections,
    tracks: tracks.map((track) => ({ id: track.id, name: track.name, channel: track.channel, program: track.program, notes: track.notes }))
  };
}

export function createStyleDraft({ metadata, analysis, sections, tracks }) {
  return {
    schema: "uaos-generic-style-draft",
    version: 1,
    verifiedDeviceExports: [],
    unsupportedProprietaryFormats: ["KORG SET/STY", "Yamaha STY", "Roland proprietary style", "Ketron proprietary style"],
    source: { fileName: metadata.fileName, duration: metadata.duration },
    tempo: analysis.tempo.bpm,
    meter: analysis.meter.value,
    key: analysis.key.name,
    parts: {
      intros: sections.filter((item) => item.type === "intro"),
      variations: sections.filter((item) => item.type === "variation"),
      fills: sections.filter((item) => item.type === "fill"),
      breaks: sections.filter((item) => item.type === "break"),
      endings: sections.filter((item) => item.type === "ending")
    },
    lanes: tracks.map((track) => ({ id: track.id, name: track.name, noteCount: track.notes.length }))
  };
}

export function exportProjectPackage(project) {
  return {
    schema: "uaos-project-package",
    version: 1,
    exportedAt: new Date().toISOString(),
    contents: {
      "project.ums.json": project.umsProject,
      "style-draft.uaos-style.json": project.styleDraft,
      "timeline.json": project.sections,
      "tracks.json": project.tracks
    }
  };
}

export function writeStandardMidiFile(project) {
  const tempo = project.analysis?.tempo?.bpm || 120;
  const meter = project.analysis?.meter?.value || "4/4";
  const chunks = [];
  chunks.push(headerChunk(project.tracks.length + 1));
  chunks.push(metaTrack({ tempo, meter }));
  for (const track of project.tracks) chunks.push(noteTrack(track, tempo));
  return concatBytes(chunks);
}

function headerChunk(trackCount) {
  return chunk("MThd", [...u32(6), ...u16(1), ...u16(trackCount), ...u16(PPQ)]);
}

function metaTrack({ tempo, meter }) {
  const [numerator, denominator = 4] = String(meter).split("/").map(Number);
  const microseconds = Math.round(60000000 / clamp(Number(tempo), 20, 300));
  const denomPower = Math.max(1, Math.round(Math.log2(denominator)));
  const events = [
    { tick: 0, bytes: [0xff, 0x03, 0x09, ...ascii("UAOS Demo")] },
    { tick: 0, bytes: [0xff, 0x51, 0x03, ...u24(microseconds)] },
    { tick: 0, bytes: [0xff, 0x58, 0x04, numerator || 4, denomPower, 24, 8] }
  ];
  return chunk("MTrk", encodeTimedEvents(events));
}

function noteTrack(track, tempo) {
  const events = [{ tick: 0, bytes: [0xff, 0x03, track.name.length, ...ascii(track.name)] }];
  if (track.program !== null && track.program !== undefined) events.push({ tick: 0, bytes: [0xc0 + channelIndex(track.channel), clamp(track.program, 0, 127)] });
  for (const note of track.notes || []) {
    const start = secondsToTicks(note.start, tempo);
    const end = Math.max(start + 1, secondsToTicks(note.start + note.duration, tempo));
    const channel = channelIndex(track.channel);
    events.push({ tick: start, order: 1, bytes: [0x90 + channel, clamp(note.midi, 0, 127), clamp(note.velocity || 80, 1, 127)] });
    events.push({ tick: end, order: 0, bytes: [0x80 + channel, clamp(note.midi, 0, 127), 0] });
  }
  return chunk("MTrk", encodeTimedEvents(events));
}

function encodeTimedEvents(events) {
  const sorted = [...events].sort((a, b) => a.tick - b.tick || (a.order || 0) - (b.order || 0));
  const bytes = [];
  let lastTick = 0;
  for (const event of sorted) {
    bytes.push(...varLen(Math.max(0, event.tick - lastTick)), ...event.bytes);
    lastTick = event.tick;
  }
  bytes.push(0x00, 0xff, 0x2f, 0x00);
  return bytes;
}

function chunk(type, body) {
  return [...ascii(type), ...u32(body.length), ...body];
}

function secondsToTicks(seconds, tempo) {
  return Math.round((seconds / secondsPerBeat(tempo)) * PPQ);
}

function secondsPerBeat(bpm) {
  return 60 / clamp(Number(bpm) || 120, 20, 300);
}

function channelIndex(channel) {
  return clamp(Number(channel || 1) - 1, 0, 15);
}

function summarizeDynamics(samples) {
  let peak = 0;
  let sum = 0;
  for (const sample of samples) {
    const value = Math.abs(sample);
    peak = Math.max(peak, value);
    sum += sample * sample;
  }
  return { rms: round(Math.sqrt(sum / Math.max(1, samples.length)), 5), peak: round(peak, 5), confidence: samples.length ? 0.9 : 0 };
}

function varLen(value) {
  let buffer = value & 0x7f;
  const bytes = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= ((value & 0x7f) | 0x80);
  }
  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return bytes;
}

function u16(value) {
  return [(value >> 8) & 0xff, value & 0xff];
}

function u24(value) {
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function u32(value) {
  return [(value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function ascii(text) {
  return Array.from(String(text), (char) => char.charCodeAt(0) & 0x7f);
}

function concatBytes(chunks) {
  const total = chunks.reduce((sum, item) => sum + item.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunkBytes of chunks) {
    out.set(chunkBytes, offset);
    offset += chunkBytes.length;
  }
  return out;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
