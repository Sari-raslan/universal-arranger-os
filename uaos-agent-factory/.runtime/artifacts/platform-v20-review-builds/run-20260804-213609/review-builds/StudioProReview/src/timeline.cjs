'use strict';
/**
 * UAOS Studio E20 — Timeline Core (domain only, no UI/engine)
 */
const crypto = require('crypto');
const { createProject, validateProject, saveProject, openProject, registerTrack, beginUndoTransaction, commitUndoTransaction, migrateProject } = require('./project-system.cjs');

const TIMELINE_SCHEMA = 'uaos.studio.timeline/v1';

function createTimeline({ timelineId } = {}) {
  return {
    schemaVersion: TIMELINE_SCHEMA,
    timelineId: timelineId || crypto.randomUUID(),
    lanes: [],
    clips: [],
    markers: [],
    regions: [],
    tempoMap: [{ atBeats: 0, bpm: 120 }],
    timeSignatureMap: [{ atBeats: 0, numerator: 4, denominator: 4 }],
    timebase: { musical: true, absoluteSeconds: false },
    selection: { clipIds: [], markerIds: [] },
    snap: { enabled: true, gridBeats: 0.25 },
    overlapPolicy: 'allow'
  };
}

function attachTimeline(project, timeline) {
  project.timeline = timeline;
  project.updatedAt = new Date().toISOString();
  return project;
}

function addLane(timeline, { laneId, trackId, name }) {
  if (!laneId || !trackId) throw Object.assign(new Error('INVALID_LANE'), { code: 'INVALID_LANE' });
  if (timeline.lanes.some((l) => l.laneId === laneId)) throw Object.assign(new Error('DUPLICATE_LANE'), { code: 'DUPLICATE_LANE' });
  timeline.lanes.push({ laneId, trackId, name: name || laneId, order: timeline.lanes.length });
  return timeline;
}

function removeLane(timeline, laneId) {
  const idx = timeline.lanes.findIndex((l) => l.laneId === laneId);
  if (idx < 0) throw Object.assign(new Error('MISSING_LANE'), { code: 'MISSING_LANE' });
  timeline.lanes.splice(idx, 1);
  timeline.clips = timeline.clips.filter((c) => c.laneId !== laneId);
  timeline.lanes.forEach((l, i) => { l.order = i; });
  return timeline;
}

function validateClip(timeline, clip) {
  if (!clip || !clip.clipId || !clip.laneId) throw Object.assign(new Error('INVALID_CLIP'), { code: 'INVALID_CLIP' });
  if (!timeline.lanes.some((l) => l.laneId === clip.laneId)) throw Object.assign(new Error('MISSING_TRACK'), { code: 'MISSING_TRACK' });
  if (typeof clip.durationBeats !== 'number' || clip.durationBeats <= 0) throw Object.assign(new Error('INVALID_DURATION'), { code: 'INVALID_DURATION' });
  if (typeof clip.startBeats !== 'number' || clip.startBeats < 0) throw Object.assign(new Error('INVALID_START'), { code: 'INVALID_START' });
  clip.endBeats = clip.startBeats + clip.durationBeats;
}

function addClip(timeline, clip) {
  validateClip(timeline, clip);
  if (timeline.overlapPolicy === 'reject') {
    const overlap = timeline.clips.some((c) => c.laneId === clip.laneId && !(clip.endBeats <= c.startBeats || clip.startBeats >= c.endBeats));
    if (overlap) throw Object.assign(new Error('OVERLAP_REJECTED'), { code: 'OVERLAP_REJECTED' });
  }
  timeline.clips.push({
    clipId: clip.clipId,
    laneId: clip.laneId,
    kind: clip.kind || 'audio',
    startBeats: clip.startBeats,
    durationBeats: clip.durationBeats,
    endBeats: clip.startBeats + clip.durationBeats,
    name: clip.name || clip.clipId
  });
  return timeline;
}

function snapBeats(timeline, beats) {
  if (!timeline.snap?.enabled) return beats;
  const g = timeline.snap.gridBeats || 0.25;
  return Math.round(beats / g) * g;
}

function moveClip(timeline, clipId, newStart) {
  const c = timeline.clips.find((x) => x.clipId === clipId);
  if (!c) throw Object.assign(new Error('MISSING_CLIP'), { code: 'MISSING_CLIP' });
  c.startBeats = snapBeats(timeline, newStart);
  c.endBeats = c.startBeats + c.durationBeats;
  return timeline;
}

function trimClip(timeline, clipId, { startBeats, durationBeats }) {
  const c = timeline.clips.find((x) => x.clipId === clipId);
  if (!c) throw Object.assign(new Error('MISSING_CLIP'), { code: 'MISSING_CLIP' });
  if (durationBeats !== undefined) {
    if (durationBeats <= 0) throw Object.assign(new Error('INVALID_DURATION'), { code: 'INVALID_DURATION' });
    c.durationBeats = durationBeats;
  }
  if (startBeats !== undefined) c.startBeats = snapBeats(timeline, startBeats);
  c.endBeats = c.startBeats + c.durationBeats;
  return timeline;
}

function splitClip(timeline, clipId, atBeats) {
  const c = timeline.clips.find((x) => x.clipId === clipId);
  if (!c) throw Object.assign(new Error('MISSING_CLIP'), { code: 'MISSING_CLIP' });
  if (atBeats <= c.startBeats || atBeats >= c.endBeats) throw Object.assign(new Error('INVALID_SPLIT'), { code: 'INVALID_SPLIT' });
  const leftDur = atBeats - c.startBeats;
  const rightDur = c.endBeats - atBeats;
  const right = {
    clipId: crypto.randomUUID(),
    laneId: c.laneId,
    kind: c.kind,
    startBeats: atBeats,
    durationBeats: rightDur,
    endBeats: atBeats + rightDur,
    name: c.name + '-b'
  };
  c.durationBeats = leftDur;
  c.endBeats = c.startBeats + leftDur;
  timeline.clips.push(right);
  return { timeline, rightClipId: right.clipId };
}

function duplicateClip(timeline, clipId) {
  const c = timeline.clips.find((x) => x.clipId === clipId);
  if (!c) throw Object.assign(new Error('MISSING_CLIP'), { code: 'MISSING_CLIP' });
  const copy = { ...c, clipId: crypto.randomUUID(), startBeats: c.endBeats, endBeats: c.endBeats + c.durationBeats, name: c.name + '-copy' };
  timeline.clips.push(copy);
  return copy;
}

function deleteClip(timeline, clipId) {
  const i = timeline.clips.findIndex((x) => x.clipId === clipId);
  if (i < 0) throw Object.assign(new Error('MISSING_CLIP'), { code: 'MISSING_CLIP' });
  timeline.clips.splice(i, 1);
  return timeline;
}

function addMarker(timeline, { markerId, atBeats, name }) {
  timeline.markers.push({ markerId: markerId || crypto.randomUUID(), atBeats, name: name || 'Marker' });
  return timeline;
}

function addRegion(timeline, { regionId, startBeats, endBeats, name }) {
  if (endBeats <= startBeats) throw Object.assign(new Error('INVALID_REGION'), { code: 'INVALID_REGION' });
  timeline.regions.push({ regionId: regionId || crypto.randomUUID(), startBeats, endBeats, name: name || 'Region' });
  return timeline;
}

function serializeTimeline(timeline) {
  return JSON.parse(JSON.stringify(timeline));
}

module.exports = {
  TIMELINE_SCHEMA,
  createTimeline,
  attachTimeline,
  addLane,
  removeLane,
  addClip,
  moveClip,
  trimClip,
  splitClip,
  duplicateClip,
  deleteClip,
  addMarker,
  addRegion,
  snapBeats,
  serializeTimeline,
  createProject,
  validateProject,
  saveProject,
  openProject,
  registerTrack,
  beginUndoTransaction,
  commitUndoTransaction,
  migrateProject
};
