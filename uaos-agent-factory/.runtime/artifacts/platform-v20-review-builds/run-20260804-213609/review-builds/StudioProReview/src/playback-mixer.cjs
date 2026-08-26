'use strict';
/**
 * Studio E30 — Playback + Mixer core (no hardware audio)
 */
const crypto = require('crypto');
const timeline = require('./timeline.cjs');

const TRANSPORT_ALLOWED = {
  stopped: ['playing'],
  playing: ['paused', 'stopped'],
  paused: ['playing', 'stopped']
};

function createTransport() {
  return {
    schemaVersion: 'uaos.studio.transport/v1',
    state: 'stopped',
    positionBeats: 0,
    loop: { enabled: false, startBeats: 0, endBeats: 16 },
    cursorBeats: 0,
    playbackRange: { startBeats: 0, endBeats: null },
    endOfProject: 'stop'
  };
}

function setTransportState(t, next) {
  if (next === t.state) return t;
  if (!(TRANSPORT_ALLOWED[t.state] || []).includes(next)) {
    throw Object.assign(new Error(`INVALID_TRANSPORT:${t.state}->${next}`), { code: 'INVALID_TRANSPORT' });
  }
  t.state = next;
  return t;
}

function seek(t, beats) {
  if (typeof beats !== 'number' || beats < 0) throw Object.assign(new Error('INVALID_SEEK'), { code: 'INVALID_SEEK' });
  t.positionBeats = beats;
  t.cursorBeats = beats;
  return t;
}

function setLoop(t, { enabled, startBeats, endBeats }) {
  if (endBeats <= startBeats) throw Object.assign(new Error('INVALID_LOOP'), { code: 'INVALID_LOOP' });
  t.loop = { enabled: !!enabled, startBeats, endBeats };
  return t;
}

function globalStop(t) { t.state = 'stopped'; return t; }

function createScheduler({ lookAheadBeats = 4 } = {}) {
  return { lookAheadBeats, queue: [], cancelled: false };
}

function scheduleClip(scheduler, clip, nowBeats = 0) {
  if (scheduler.cancelled) return null;
  if (clip.startBeats > nowBeats + scheduler.lookAheadBeats) return null;
  const ev = { id: crypto.randomUUID(), clipId: clip.clipId, atBeats: clip.startBeats, kind: clip.kind || 'audio' };
  scheduler.queue.push(ev);
  scheduler.queue.sort((a, b) => a.atBeats - b.atBeats);
  return ev;
}

function cancelScheduler(scheduler) {
  scheduler.cancelled = true;
  scheduler.queue = [];
  return scheduler;
}

function rescheduleAfterSeek(scheduler, clips, positionBeats) {
  scheduler.cancelled = false;
  scheduler.queue = [];
  for (const c of clips) scheduleClip(scheduler, c, positionBeats);
  return scheduler.queue;
}

function createMixer() {
  return {
    schemaVersion: 'uaos.studio.mixer/v1',
    channels: [],
    buses: [{ channelId: 'master', kind: 'master', gainDb: 0, pan: 0, mute: false, solo: false, enable: true }],
    sends: [],
    returns: [],
    masterSafetyLimitDb: 0
  };
}

function addChannel(mixer, { channelId, kind = 'track', trackId = null }) {
  if (!channelId) throw Object.assign(new Error('INVALID_CHANNEL'), { code: 'INVALID_CHANNEL' });
  if (mixer.channels.some((c) => c.channelId === channelId) || mixer.buses.some((c) => c.channelId === channelId)) {
    throw Object.assign(new Error('DUPLICATE_CHANNEL'), { code: 'DUPLICATE_CHANNEL' });
  }
  const ch = { channelId, kind, trackId, gainDb: 0, pan: 0, mute: false, solo: false, soloSafe: false, enable: true, routeTo: 'master' };
  mixer.channels.push(ch);
  return ch;
}

function setGainPan(mixer, channelId, { gainDb, pan }) {
  const ch = [...mixer.channels, ...mixer.buses].find((c) => c.channelId === channelId);
  if (!ch) throw Object.assign(new Error('MISSING_CHANNEL'), { code: 'MISSING_CHANNEL' });
  if (gainDb !== undefined) ch.gainDb = gainDb;
  if (pan !== undefined) ch.pan = pan;
  return ch;
}

function setMuteSolo(mixer, channelId, { mute, solo }) {
  const ch = mixer.channels.find((c) => c.channelId === channelId);
  if (!ch) throw Object.assign(new Error('MISSING_CHANNEL'), { code: 'MISSING_CHANNEL' });
  if (mute !== undefined) ch.mute = !!mute;
  if (solo !== undefined) ch.solo = !!solo;
  return ch;
}

function addRoute(mixer, fromId, toId) {
  const from = mixer.channels.find((c) => c.channelId === fromId);
  const to = [...mixer.channels, ...mixer.buses].find((c) => c.channelId === toId);
  if (!from || !to) throw Object.assign(new Error('INVALID_ROUTE'), { code: 'INVALID_ROUTE' });
  from.routeTo = toId;
  return from;
}

function meterSnapshot(mixer, fixtures = {}) {
  return mixer.channels.map((c) => {
    const peak = fixtures[c.channelId]?.peak ?? 0.1;
    const rms = fixtures[c.channelId]?.rms ?? 0.05;
    const clipping = peak >= 1.0 || (c.gainDb > mixer.masterSafetyLimitDb + 6);
    return { channelId: c.channelId, peak, rms, clipping };
  });
}

function serializeMixer(mixer) { return JSON.parse(JSON.stringify(mixer)); }

function attachPlayback(project) {
  project.transport = createTransport();
  project.mixer = createMixer();
  project.scheduler = createScheduler();
  return project;
}

module.exports = {
  createTransport,
  setTransportState,
  seek,
  setLoop,
  globalStop,
  createScheduler,
  scheduleClip,
  cancelScheduler,
  rescheduleAfterSeek,
  createMixer,
  addChannel,
  setGainPan,
  setMuteSolo,
  addRoute,
  meterSnapshot,
  serializeMixer,
  attachPlayback,
  timeline
};
