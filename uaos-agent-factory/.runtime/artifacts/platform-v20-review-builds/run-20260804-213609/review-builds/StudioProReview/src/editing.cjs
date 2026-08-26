'use strict';
/**
 * Studio E40 — Non-destructive Audio/MIDI editing core (no DSP)
 */
const crypto = require('crypto');
const pb = require('./playback-mixer.cjs');
const timeline = pb.timeline;

function ensureEdit(project) {
  if (!project.edit) {
    project.edit = {
      schemaVersion: 'uaos.studio.edit/v40',
      audioEdits: [],
      midiEdits: [],
      history: [],
      selection: { clipIds: [], noteIds: [] },
      clipboard: null,
      snap: { enabled: true, gridBeats: 0.25 },
      ripple: { enabled: false }
    };
  }
  return project.edit;
}

function addAudioEdit(project, edit) {
  const e = ensureEdit(project);
  if (!edit.sourceAssetId) throw Object.assign(new Error('MISSING_ASSET'), { code: 'MISSING_ASSET' });
  const rec = {
    editId: edit.editId || crypto.randomUUID(),
    sourceAssetId: edit.sourceAssetId,
    sourceOffset: edit.sourceOffset || 0,
    startBeats: edit.startBeats || 0,
    endBeats: edit.endBeats || 4,
    trimIn: edit.trimIn || 0,
    trimOut: edit.trimOut || 0,
    fadeIn: edit.fadeIn || null,
    fadeOut: edit.fadeOut || null,
    fadeCurve: edit.fadeCurve || 'linear',
    gainDb: edit.gainDb || 0,
    mute: !!edit.mute,
    reverse: !!edit.reverse,
    timeStretch: edit.timeStretch || { ratio: 1, dspRequired: true, offlineRequired: true },
    pitchShift: edit.pitchShift || { semitones: 0, dspRequired: true, offlineRequired: true },
    crossfade: edit.crossfade || null,
    nonDestructive: true
  };
  if (rec.endBeats <= rec.startBeats) throw Object.assign(new Error('INVALID_RANGE'), { code: 'INVALID_RANGE' });
  if (rec.fadeIn && rec.fadeIn < 0) throw Object.assign(new Error('INVALID_FADE'), { code: 'INVALID_FADE' });
  e.audioEdits.push(rec);
  e.history.push({ op: 'addAudioEdit', editId: rec.editId });
  return rec;
}

function slipAudio(project, editId, delta) {
  const e = ensureEdit(project);
  const rec = e.audioEdits.find((x) => x.editId === editId);
  if (!rec) throw Object.assign(new Error('MISSING_EDIT'), { code: 'MISSING_EDIT' });
  rec.sourceOffset += delta;
  e.history.push({ op: 'slip', editId });
  return rec;
}

function splitAudio(project, editId, atBeats) {
  const e = ensureEdit(project);
  const rec = e.audioEdits.find((x) => x.editId === editId);
  if (!rec || atBeats <= rec.startBeats || atBeats >= rec.endBeats) throw Object.assign(new Error('INVALID_SPLIT'), { code: 'INVALID_SPLIT' });
  const right = { ...rec, editId: crypto.randomUUID(), startBeats: atBeats };
  rec.endBeats = atBeats;
  e.audioEdits.push(right);
  e.history.push({ op: 'split', editId, rightId: right.editId });
  return right;
}

function addMidiNoteEdit(project, note) {
  const e = ensureEdit(project);
  if (typeof note.pitch !== 'number' || note.pitch < 0 || note.pitch > 127) throw Object.assign(new Error('INVALID_NOTE'), { code: 'INVALID_NOTE' });
  const n = { noteId: note.noteId || crypto.randomUUID(), pitch: note.pitch, startBeats: note.startBeats || 0, durationBeats: note.durationBeats || 1, velocity: note.velocity ?? 100, channel: note.channel ?? 0 };
  e.midiEdits.push({ type: 'note', ...n });
  e.history.push({ op: 'addNote', noteId: n.noteId });
  return n;
}

function transposeMidi(project, noteIds, semis) {
  const e = ensureEdit(project);
  for (const id of noteIds) {
    const n = e.midiEdits.find((x) => x.noteId === id);
    if (!n) continue;
    n.pitch += semis;
    if (n.pitch < 0 || n.pitch > 127) throw Object.assign(new Error('INVALID_NOTE'), { code: 'INVALID_NOTE' });
  }
  e.history.push({ op: 'transpose', noteIds, semis });
}

function quantizeDryRun(project, grid = 0.25) {
  const e = ensureEdit(project);
  return e.midiEdits.filter((x) => x.type === 'note').map((n) => ({ noteId: n.noteId, from: n.startBeats, to: Math.round(n.startBeats / grid) * grid }));
}

function addController(project, ev) {
  const e = ensureEdit(project);
  const rec = { type: 'controller', eventId: crypto.randomUUID(), controller: ev.controller, value: ev.value, atBeats: ev.atBeats || 0 };
  e.midiEdits.push(rec);
  return rec;
}

function select(project, { clipIds = [], noteIds = [] }) {
  const e = ensureEdit(project);
  e.selection = { clipIds, noteIds };
  return e.selection;
}

function copySelection(project) {
  const e = ensureEdit(project);
  e.clipboard = {
    noteIds: [...e.selection.noteIds],
    notes: e.midiEdits.filter((n) => e.selection.noteIds.includes(n.noteId))
  };
  return e.clipboard;
}

function pasteClipboard(project, offsetBeats = 0) {
  const e = ensureEdit(project);
  if (!e.clipboard) throw Object.assign(new Error('EMPTY_CLIPBOARD'), { code: 'EMPTY_CLIPBOARD' });
  const created = [];
  for (const n of e.clipboard.notes) {
    created.push(addMidiNoteEdit(project, { ...n, noteId: crypto.randomUUID(), startBeats: n.startBeats + offsetBeats }));
  }
  return created;
}

function nudge(project, noteIds, deltaBeats) {
  const e = ensureEdit(project);
  const g = e.snap.enabled ? e.snap.gridBeats : null;
  for (const id of noteIds) {
    const n = e.midiEdits.find((x) => x.noteId === id);
    if (!n) continue;
    let v = n.startBeats + deltaBeats;
    if (g) v = Math.round(v / g) * g;
    n.startBeats = v;
  }
}

module.exports = {
  ensureEdit,
  addAudioEdit,
  slipAudio,
  splitAudio,
  addMidiNoteEdit,
  transposeMidi,
  quantizeDryRun,
  addController,
  select,
  copySelection,
  pasteClipboard,
  nudge,
  pb,
  timeline
};
