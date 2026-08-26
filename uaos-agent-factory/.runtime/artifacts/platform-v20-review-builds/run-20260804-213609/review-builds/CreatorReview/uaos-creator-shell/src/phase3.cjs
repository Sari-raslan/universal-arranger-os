'use strict';
/**
 * Creator Phase3 — MIDI composition + arrangement draft core
 */
const crypto = require('crypto');
const phase2 = require('./phase2.cjs');

const NOTE_SCHEMA = 'uaos.creator.note/v1';
const MIDI_CLIP_SCHEMA = 'uaos.creator.midi-clip/v1';
const ROLES = ['melody', 'chord', 'bass', 'drum'];
const SECTIONS = ['intro', 'verse', 'chorus', 'bridge', 'outro'];

function createNote({ noteId, pitch, startBeats, durationBeats, velocity = 100, channel = 0 } = {}) {
  if (typeof pitch !== 'number' || pitch < 0 || pitch > 127) throw Object.assign(new Error('INVALID_NOTE'), { code: 'INVALID_NOTE' });
  if (typeof durationBeats !== 'number' || durationBeats <= 0) throw Object.assign(new Error('INVALID_NOTE_RANGE'), { code: 'INVALID_NOTE_RANGE' });
  if (typeof startBeats !== 'number' || startBeats < 0) throw Object.assign(new Error('INVALID_NOTE_RANGE'), { code: 'INVALID_NOTE_RANGE' });
  return { schemaVersion: NOTE_SCHEMA, noteId: noteId || crypto.randomUUID(), pitch, startBeats, durationBeats, endBeats: startBeats + durationBeats, velocity, channel };
}

function ensureComposition(project) {
  if (!project.composition) {
    project.composition = {
      schemaVersion: 'uaos.creator.composition/v3',
      notes: [],
      midiClips: [],
      sections: [],
      chords: [],
      arrangement: { nodes: [], edges: [] },
      quantize: { gridBeats: 0.25, enabled: true },
      voiceToMidi: { status: 'CONTRACT_ONLY', implemented: false }
    };
  }
  return project.composition;
}

function registerRoleTrack(project, { trackId, role, name }) {
  if (!ROLES.includes(role)) throw Object.assign(new Error('INVALID_TRACK_ROLE'), { code: 'INVALID_TRACK_ROLE' });
  phase2.registerTrack(project, { trackId, kind: 'midi', name: name || role });
  const t = project.tracks.find((x) => x.trackId === trackId);
  t.role = role;
  return project;
}

function addNote(project, note) {
  const c = ensureComposition(project);
  const n = createNote(note);
  c.notes.push(n);
  return n;
}

function editNote(project, noteId, patch) {
  const c = ensureComposition(project);
  const n = c.notes.find((x) => x.noteId === noteId);
  if (!n) throw Object.assign(new Error('MISSING_NOTE'), { code: 'MISSING_NOTE' });
  Object.assign(n, patch);
  if (n.durationBeats <= 0) throw Object.assign(new Error('INVALID_NOTE_RANGE'), { code: 'INVALID_NOTE_RANGE' });
  n.endBeats = n.startBeats + n.durationBeats;
  return n;
}

function deleteNote(project, noteId) {
  const c = ensureComposition(project);
  const i = c.notes.findIndex((x) => x.noteId === noteId);
  if (i < 0) throw Object.assign(new Error('MISSING_NOTE'), { code: 'MISSING_NOTE' });
  c.notes.splice(i, 1);
}

function moveNote(project, noteId, startBeats) { return editNote(project, noteId, { startBeats }); }
function resizeNote(project, noteId, durationBeats) { return editNote(project, noteId, { durationBeats }); }

function createMidiClip(project, { clipId, trackId, startBeats = 0, durationBeats = 4, noteIds = [] }) {
  if (!project.tracks.some((t) => t.trackId === trackId && t.kind === 'midi')) throw Object.assign(new Error('INVALID_CLIP_RANGE'), { code: 'INVALID_CLIP_RANGE' });
  if (durationBeats <= 0) throw Object.assign(new Error('INVALID_CLIP_RANGE'), { code: 'INVALID_CLIP_RANGE' });
  const c = ensureComposition(project);
  const clip = { schemaVersion: MIDI_CLIP_SCHEMA, clipId: clipId || crypto.randomUUID(), trackId, startBeats, durationBeats, endBeats: startBeats + durationBeats, noteIds };
  c.midiClips.push(clip);
  return clip;
}

function duplicateMidiClip(project, clipId) {
  const c = ensureComposition(project);
  const clip = c.midiClips.find((x) => x.clipId === clipId);
  if (!clip) throw Object.assign(new Error('MISSING_CLIP'), { code: 'MISSING_CLIP' });
  return createMidiClip(project, { trackId: clip.trackId, startBeats: clip.endBeats, durationBeats: clip.durationBeats, noteIds: [...clip.noteIds] });
}

function splitMidiClip(project, clipId, atBeats) {
  const c = ensureComposition(project);
  const clip = c.midiClips.find((x) => x.clipId === clipId);
  if (!clip || atBeats <= clip.startBeats || atBeats >= clip.endBeats) throw Object.assign(new Error('INVALID_CLIP_RANGE'), { code: 'INVALID_CLIP_RANGE' });
  const leftDur = atBeats - clip.startBeats;
  const right = createMidiClip(project, { trackId: clip.trackId, startBeats: atBeats, durationBeats: clip.endBeats - atBeats, noteIds: [] });
  clip.durationBeats = leftDur;
  clip.endBeats = clip.startBeats + leftDur;
  return right;
}

function mergeMidiClips(project, aId, bId) {
  const c = ensureComposition(project);
  const a = c.midiClips.find((x) => x.clipId === aId);
  const b = c.midiClips.find((x) => x.clipId === bId);
  if (!a || !b || a.trackId !== b.trackId) throw Object.assign(new Error('INCOMPATIBLE_CLIPS'), { code: 'INCOMPATIBLE_CLIPS' });
  const start = Math.min(a.startBeats, b.startBeats);
  const end = Math.max(a.endBeats, b.endBeats);
  a.startBeats = start;
  a.durationBeats = end - start;
  a.endBeats = end;
  a.noteIds = [...new Set([...a.noteIds, ...b.noteIds])];
  c.midiClips = c.midiClips.filter((x) => x.clipId !== bId);
  return a;
}

function transposeNotes(project, noteIds, semitones) {
  const c = ensureComposition(project);
  for (const id of noteIds) {
    const n = c.notes.find((x) => x.noteId === id);
    if (!n) continue;
    const pitch = n.pitch + semitones;
    if (pitch < 0 || pitch > 127) throw Object.assign(new Error('INVALID_NOTE'), { code: 'INVALID_NOTE' });
    n.pitch = pitch;
  }
}

function quantizeDryRun(project) {
  const c = ensureComposition(project);
  const g = c.quantize.gridBeats || 0.25;
  return c.notes.map((n) => ({
    noteId: n.noteId,
    from: n.startBeats,
    to: Math.round(n.startBeats / g) * g
  }));
}

function addSection(project, { sectionId, kind, startBeats, endBeats }) {
  if (!SECTIONS.includes(kind)) throw Object.assign(new Error('INVALID_SECTION'), { code: 'INVALID_SECTION' });
  const c = ensureComposition(project);
  c.sections.push({ sectionId: sectionId || crypto.randomUUID(), kind, startBeats, endBeats });
  return c.sections[c.sections.length - 1];
}

function addChord(project, { chordId, symbol, startBeats, durationBeats = 1 }) {
  const c = ensureComposition(project);
  c.chords.push({ chordId: chordId || crypto.randomUUID(), symbol, startBeats, durationBeats });
  return c.chords[c.chords.length - 1];
}

function validateArrangement(project) {
  const c = ensureComposition(project);
  const ids = new Set(c.arrangement.nodes.map((n) => n.id));
  for (const e of c.arrangement.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) return { ok: false, error: 'DANGLING_EDGE' };
  }
  for (const t of project.tracks.filter((x) => x.kind === 'midi')) {
    if (t.role && !ROLES.includes(t.role)) return { ok: false, error: 'BAD_ROLE' };
  }
  return { ok: true };
}

function setArrangementGraph(project, nodes, edges) {
  const c = ensureComposition(project);
  c.arrangement = { nodes, edges };
  const v = validateArrangement(project);
  if (!v.ok) throw Object.assign(new Error(v.error), { code: v.error });
  return c.arrangement;
}

module.exports = {
  NOTE_SCHEMA,
  MIDI_CLIP_SCHEMA,
  ROLES,
  SECTIONS,
  createNote,
  ensureComposition,
  registerRoleTrack,
  addNote,
  editNote,
  deleteNote,
  moveNote,
  resizeNote,
  createMidiClip,
  duplicateMidiClip,
  splitMidiClip,
  mergeMidiClips,
  transposeNotes,
  quantizeDryRun,
  addSection,
  addChord,
  validateArrangement,
  setArrangementGraph,
  phase2
};
