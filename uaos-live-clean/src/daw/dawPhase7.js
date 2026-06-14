import { createArrangerState } from "../arranger/arrangerEngine.js";
import { migrateHardwareSession } from "../hardware/hardwarePhase6.js";

export const DAW_SCHEMA_VERSION = 1;
export const DEFAULT_PPQ = 960;
export const TRACK_TYPES = Object.freeze(["audio", "midi", "instrument", "sampler", "arranger", "drum", "vocal", "bus", "master", "automation"]);
export const AUTOMATION_INTERPOLATION = Object.freeze(["step", "linear", "curve"]);

export function stableId(prefix, index = 1) {
  return `${prefix}-${String(index).padStart(3, "0")}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value)));
}

function sortedByTime(items) {
  return [...items].sort((a, b) => (a.startTick ?? a.tick ?? a.time ?? 0) - (b.startTick ?? b.tick ?? b.time ?? 0) || String(a.id).localeCompare(String(b.id)));
}

export function ticksPerBar(timeSignature = { numerator: 4, denominator: 4 }, ppq = DEFAULT_PPQ) {
  return Number(timeSignature.numerator || 4) * ppq * (4 / Number(timeSignature.denominator || 4));
}

export function musicalToTicks({ bar = 1, beat = 1, tick = 0 }, timeSignature = { numerator: 4, denominator: 4 }, ppq = DEFAULT_PPQ) {
  const barTicks = ticksPerBar(timeSignature, ppq);
  return Math.max(0, Math.round((Number(bar) - 1) * barTicks + (Number(beat) - 1) * ppq + Number(tick)));
}

export function ticksToMusical(ticks, timeSignature = { numerator: 4, denominator: 4 }, ppq = DEFAULT_PPQ) {
  const safeTicks = Math.max(0, Math.round(Number(ticks || 0)));
  const barTicks = ticksPerBar(timeSignature, ppq);
  const bar = Math.floor(safeTicks / barTicks) + 1;
  const withinBar = safeTicks % barTicks;
  const beat = Math.floor(withinBar / ppq) + 1;
  const tick = Math.round(withinBar % ppq);
  return { bar, beat, tick };
}

export function ticksToSeconds(ticks, tempoMap = [{ tick: 0, bpm: 120 }], ppq = DEFAULT_PPQ) {
  const map = sortedByTime(tempoMap.map((item, index) => ({ id: item.id || stableId("tempo", index + 1), tick: Math.max(0, Number(item.tick || 0)), bpm: clamp(item.bpm || 120, 30, 260) })));
  let seconds = 0;
  let cursor = 0;
  let bpm = map[0]?.bpm || 120;
  for (const point of map.slice(1)) {
    if (point.tick >= ticks) break;
    seconds += ((point.tick - cursor) / ppq) * (60 / bpm);
    cursor = point.tick;
    bpm = point.bpm;
  }
  seconds += ((Math.max(0, ticks - cursor)) / ppq) * (60 / bpm);
  return Number(seconds.toFixed(6));
}

export function secondsToTicks(seconds, tempoMap = [{ tick: 0, bpm: 120 }], ppq = DEFAULT_PPQ) {
  const map = sortedByTime(tempoMap.map((item, index) => ({ id: item.id || stableId("tempo", index + 1), tick: Math.max(0, Number(item.tick || 0)), bpm: clamp(item.bpm || 120, 30, 260) })));
  let remaining = Math.max(0, Number(seconds || 0));
  let cursor = 0;
  let bpm = map[0]?.bpm || 120;
  for (const point of map.slice(1)) {
    const segmentSeconds = ((point.tick - cursor) / ppq) * (60 / bpm);
    if (remaining <= segmentSeconds) return Math.round(cursor + (remaining / (60 / bpm)) * ppq);
    remaining -= segmentSeconds;
    cursor = point.tick;
    bpm = point.bpm;
  }
  return Math.round(cursor + (remaining / (60 / bpm)) * ppq);
}

export function createTrack(type = "audio", index = 1, overrides = {}) {
  const safeType = TRACK_TYPES.includes(type) ? type : "audio";
  return {
    id: overrides.id || stableId(safeType, index),
    name: overrides.name || `${safeType[0].toUpperCase()}${safeType.slice(1)} ${index}`,
    type: safeType,
    color: overrides.color || "#00ccff",
    icon: overrides.icon || safeType,
    channel: overrides.channel || index,
    input: overrides.input || "none",
    output: overrides.output || (safeType === "master" ? "hardware-main" : "master"),
    gain: clamp(overrides.gain ?? 1, 0, 2),
    pan: clamp(overrides.pan ?? 0, -1, 1),
    mute: Boolean(overrides.mute),
    solo: Boolean(overrides.solo),
    recordArm: Boolean(overrides.recordArm),
    monitor: Boolean(overrides.monitor),
    freeze: { enabled: false, reason: null, ...(overrides.freeze || {}) },
    enabled: overrides.enabled !== false,
    plugins: Array.isArray(overrides.plugins) ? overrides.plugins : [],
    sends: Array.isArray(overrides.sends) ? overrides.sends : [],
    inserts: Array.isArray(overrides.inserts) ? overrides.inserts : [],
    routing: { input: overrides.input || "none", output: overrides.output || "master", ...(overrides.routing || {}) },
    clips: Array.isArray(overrides.clips) ? overrides.clips : [],
    automationLanes: Array.isArray(overrides.automationLanes) ? overrides.automationLanes : [],
    selectedPreset: overrides.selectedPreset || null,
    deviceProfile: overrides.deviceProfile || null,
    latency: { inputMs: null, outputMs: null, measured: false, ...(overrides.latency || {}) },
    missingDependencies: Array.isArray(overrides.missingDependencies) ? overrides.missingDependencies : [],
  };
}

export function createAudioClip(index = 1, overrides = {}) {
  const startTick = Math.max(0, Number(overrides.startTick || 0));
  const durationTicks = Math.max(1, Number(overrides.durationTicks || DEFAULT_PPQ));
  return {
    id: overrides.id || stableId("audio-clip", index),
    type: "audio",
    trackId: overrides.trackId || null,
    name: overrides.name || `Audio Clip ${index}`,
    assetId: overrides.assetId || null,
    assetUrl: overrides.assetUrl || null,
    startTick,
    endTick: startTick + durationTicks,
    offsetTicks: Math.max(0, Number(overrides.offsetTicks || 0)),
    durationTicks,
    gain: clamp(overrides.gain ?? 1, 0, 2),
    fades: {
      fadeInTicks: Math.max(0, Number(overrides.fades?.fadeInTicks || 0)),
      fadeOutTicks: Math.max(0, Number(overrides.fades?.fadeOutTicks || 0)),
    },
    reverse: Boolean(overrides.reverse),
    stretch: { enabled: false, ratio: 1, quality: "foundation", ...(overrides.stretch || {}) },
    transpose: Number(overrides.transpose || 0),
    mute: Boolean(overrides.mute),
    loop: Boolean(overrides.loop),
    normalize: { requested: false, completed: false, ...(overrides.normalize || {}) },
    waveform: {
      peaks: Array.isArray(overrides.waveform?.peaks) ? overrides.waveform.peaks.slice(0, 2048) : [],
      summary: overrides.waveform?.summary || "not-extracted",
    },
    missingFile: !overrides.assetId && !overrides.assetUrl,
    objectUrlCleanupRequired: Boolean(overrides.assetUrl?.startsWith?.("blob:")),
  };
}

export function createMidiClip(index = 1, overrides = {}) {
  const startTick = Math.max(0, Number(overrides.startTick || 0));
  const durationTicks = Math.max(1, Number(overrides.durationTicks || DEFAULT_PPQ * 4));
  return {
    id: overrides.id || stableId("midi-clip", index),
    type: "midi",
    trackId: overrides.trackId || null,
    name: overrides.name || `MIDI Clip ${index}`,
    startTick,
    endTick: startTick + durationTicks,
    durationTicks,
    notes: sortMidiEvents(Array.isArray(overrides.notes) ? overrides.notes : []),
    cc: sortMidiEvents(Array.isArray(overrides.cc) ? overrides.cc : []),
    pitchBend: sortMidiEvents(Array.isArray(overrides.pitchBend) ? overrides.pitchBend : []),
    sustain: sortMidiEvents(Array.isArray(overrides.sustain) ? overrides.sustain : []),
    program: overrides.program || null,
    quantization: overrides.quantization || null,
    humanize: { enabled: false, amountTicks: 0, deterministic: true, ...(overrides.humanize || {}) },
    transpose: Number(overrides.transpose || 0),
    scaleSnap: overrides.scaleSnap || null,
    chord: overrides.chord || null,
    loop: Boolean(overrides.loop),
  };
}

export function sortMidiEvents(events) {
  return [...events].sort((a, b) => Number(a.tick || 0) - Number(b.tick || 0) || Number(a.pitch || a.controller || 0) - Number(b.pitch || b.controller || 0));
}

export function validateAudioClip(clip) {
  const errors = [];
  if (!clip || clip.type !== "audio") errors.push("Audio clip type is required.");
  if (clip?.startTick < 0 || clip?.durationTicks <= 0) errors.push("Audio clip timing is invalid.");
  if (clip?.gain < 0 || clip?.gain > 2) errors.push("Audio clip gain must be 0-2.");
  if (clip?.missingFile) errors.push("Audio source asset is missing.");
  return { valid: errors.length === 0, errors };
}

export function validateMidiClip(clip) {
  const errors = [];
  if (!clip || clip.type !== "midi") errors.push("MIDI clip type is required.");
  if (clip?.startTick < 0 || clip?.durationTicks <= 0) errors.push("MIDI clip timing is invalid.");
  for (const note of clip?.notes || []) {
    if (note.pitch < 0 || note.pitch > 127) errors.push(`MIDI note ${note.id || ""} pitch out of range.`);
    if (note.velocity < 0 || note.velocity > 127) errors.push(`MIDI note ${note.id || ""} velocity out of range.`);
    if (note.durationTicks <= 0) errors.push(`MIDI note ${note.id || ""} duration invalid.`);
  }
  return { valid: errors.length === 0, errors };
}

export function addMidiNote(clip, note) {
  const nextNote = {
    id: note.id || stableId("note", (clip.notes?.length || 0) + 1),
    tick: Math.max(0, Number(note.tick || 0)),
    durationTicks: Math.max(1, Number(note.durationTicks || DEFAULT_PPQ / 4)),
    pitch: clamp(note.pitch ?? 60, 0, 127),
    velocity: clamp(note.velocity ?? 96, 1, 127),
    channel: clamp(note.channel ?? 1, 1, 16),
    selected: Boolean(note.selected),
  };
  return { ...clip, notes: sortMidiEvents([...(clip.notes || []), nextNote]) };
}

export function quantizeMidiClip(clip, gridTicks = DEFAULT_PPQ / 4) {
  const grid = Math.max(1, Number(gridTicks || 1));
  return {
    ...clip,
    notes: sortMidiEvents(clip.notes.map((note) => ({
      ...note,
      tick: Math.round(note.tick / grid) * grid,
      durationTicks: Math.max(grid, Math.round(note.durationTicks / grid) * grid),
    }))),
  };
}

export function transposeMidiClip(clip, semitones = 0) {
  return {
    ...clip,
    transpose: Number(clip.transpose || 0) + Number(semitones || 0),
    notes: sortMidiEvents(clip.notes.map((note) => ({ ...note, pitch: clamp(note.pitch + Number(semitones || 0), 0, 127) }))),
  };
}

export function splitClip(clip, splitTick) {
  const tick = Math.round(Number(splitTick));
  if (tick <= clip.startTick || tick >= clip.endTick) return { ok: false, reason: "split-outside-clip", clips: [clip] };
  const leftDuration = tick - clip.startTick;
  const rightDuration = clip.endTick - tick;
  const left = { ...clip, id: `${clip.id}-a`, endTick: tick, durationTicks: leftDuration };
  const right = { ...clip, id: `${clip.id}-b`, startTick: tick, durationTicks: rightDuration, endTick: tick + rightDuration };
  if (clip.type === "midi") {
    left.notes = clip.notes.filter((note) => clip.startTick + note.tick < tick);
    right.notes = clip.notes.filter((note) => clip.startTick + note.tick >= tick).map((note) => ({ ...note, tick: note.tick - leftDuration }));
  }
  return { ok: true, clips: [left, right] };
}

export function duplicateClip(clip, offsetTicks = clip.durationTicks) {
  const offset = Math.max(1, Number(offsetTicks || clip.durationTicks));
  return { ...clip, id: `${clip.id}-copy`, startTick: clip.startTick + offset, endTick: clip.endTick + offset };
}

export function resizeClip(clip, newDurationTicks) {
  const durationTicks = Math.max(1, Number(newDurationTicks || clip.durationTicks));
  return { ...clip, durationTicks, endTick: clip.startTick + durationTicks };
}

export function moveClip(clip, newStartTick, snapTicks = 1) {
  const snap = Math.max(1, Number(snapTicks || 1));
  const startTick = Math.max(0, Math.round(Number(newStartTick || 0) / snap) * snap);
  return { ...clip, startTick, endTick: startTick + clip.durationTicks };
}

export function placeClip(project, trackId, clip, options = {}) {
  const track = project.tracks.find((item) => item.id === trackId);
  if (!track) return { ok: false, reason: "missing-track", project };
  const overlap = track.clips.find((item) => !(clip.endTick <= item.startTick || clip.startTick >= item.endTick));
  if (overlap && options.overlapRule === "reject") return { ok: false, reason: "clip-overlap", project };
  const nextTracks = project.tracks.map((item) => item.id === trackId ? { ...item, clips: sortedByTime([...item.clips, { ...clip, trackId }]) } : item);
  return { ok: true, project: { ...project, tracks: nextTracks, modifiedAt: options.modifiedAt || project.modifiedAt } };
}

export function createTimelineState(overrides = {}) {
  return {
    ppq: DEFAULT_PPQ,
    playheadTick: 0,
    selection: null,
    loopRange: { enabled: false, startTick: 0, endTick: DEFAULT_PPQ * 4 },
    punchRange: { enabled: false, startTick: 0, endTick: DEFAULT_PPQ * 4 },
    markers: [],
    snap: { enabled: true, gridTicks: DEFAULT_PPQ / 4 },
    zoom: { horizontal: 1, vertical: 1 },
    scroll: { x: 0, y: 0 },
    undoableOperations: true,
    ...overrides,
  };
}

export function createTransportState(overrides = {}) {
  return {
    state: "stopped",
    playheadTick: 0,
    tempo: 96,
    timeSignature: { numerator: 4, denominator: 4 },
    looping: false,
    recording: false,
    paused: false,
    countIn: { enabled: false, bars: 1, active: false },
    punch: { enabled: false, inTick: 0, outTick: DEFAULT_PPQ * 4, active: false },
    metronome: { enabled: false, volume: 0.5 },
    sync: { hardware: true, arranger: true, externalClock: false },
    panicIssued: false,
    ...overrides,
  };
}

export function reduceTransport(state, action, project = null) {
  const current = state || createTransportState();
  switch (action.type) {
    case "start":
      return { ...current, state: current.countIn.enabled ? "count-in" : "playing", paused: false, recording: false };
    case "record":
      return { ...current, state: current.countIn.enabled ? "count-in" : "recording", recording: true, paused: false };
    case "stop":
      return { ...current, state: "stopped", recording: false, paused: false, countIn: { ...current.countIn, active: false } };
    case "pause":
      return { ...current, state: "paused", paused: true };
    case "continue":
      return { ...current, state: current.recording ? "recording" : "playing", paused: false };
    case "goToStart":
      return { ...current, playheadTick: 0 };
    case "goToEnd":
      return { ...current, playheadTick: project?.durationTicks || current.playheadTick };
    case "locate":
      return { ...current, state: "seeking", playheadTick: Math.max(0, Number(action.tick || 0)) };
    case "rewind":
      return { ...current, playheadTick: Math.max(0, current.playheadTick - DEFAULT_PPQ) };
    case "fastForward":
      return { ...current, playheadTick: current.playheadTick + DEFAULT_PPQ };
    case "loop":
      return { ...current, looping: Boolean(action.enabled ?? !current.looping) };
    case "tempo":
      return { ...current, tempo: clamp(action.tempo || current.tempo, 30, 260) };
    case "panic":
      return { ...current, panicIssued: true, state: "stopped", recording: false };
    default:
      return current;
  }
}

export function schedulePlayhead(state, elapsedSeconds, ppq = DEFAULT_PPQ) {
  const ticks = secondsToTicks(elapsedSeconds, [{ tick: 0, bpm: state.tempo }], ppq);
  const loopEnd = state.loopRange?.endTick ?? state.punch?.outTick;
  if (state.looping && loopEnd && state.loopRange?.enabled) {
    const length = Math.max(1, loopEnd - state.loopRange.startTick);
    return { ...state, playheadTick: state.loopRange.startTick + (ticks % length) };
  }
  return { ...state, playheadTick: state.playheadTick + ticks };
}

export function createMixerState(tracks = []) {
  const strips = tracks.map((track, index) => createChannelStrip(track, index + 1));
  if (!strips.some((strip) => strip.type === "master")) strips.push(createChannelStrip(createTrack("master", 1, { id: "master", name: "Master" }), strips.length + 1));
  return { schemaVersion: DAW_SCHEMA_VERSION, strips, buses: [], returns: [], masterId: "master", meterSmoothing: 0.8 };
}

export function createChannelStrip(track, index = 1) {
  return {
    id: track.id,
    name: track.name,
    type: track.type,
    order: index,
    gain: track.gain,
    pan: track.pan,
    mute: track.mute,
    solo: track.solo,
    recordArm: track.recordArm,
    monitor: track.monitor,
    input: track.input,
    output: track.output,
    sends: track.sends || [],
    inserts: track.inserts || [],
    meter: { peak: 0, rms: 0, clipping: false },
    soloSafe: false,
  };
}

export function updateChannelStrip(mixer, stripId, changes) {
  return {
    ...mixer,
    strips: mixer.strips.map((strip) => strip.id === stripId ? {
      ...strip,
      ...changes,
      gain: changes.gain == null ? strip.gain : clamp(changes.gain, 0, 2),
      pan: changes.pan == null ? strip.pan : clamp(changes.pan, -1, 1),
    } : strip),
  };
}

export function validateMixerRouting(mixer) {
  const errors = [];
  const ids = new Set(mixer.strips.map((strip) => strip.id));
  for (const strip of mixer.strips) {
    if (strip.output !== "hardware-main" && strip.output !== "none" && !ids.has(strip.output)) errors.push(`${strip.id} routes to missing output ${strip.output}.`);
    if (strip.output === strip.id) errors.push(`${strip.id} routes to itself.`);
  }
  return { valid: errors.length === 0, errors };
}

export function preventFeedbackLoop(mixer, fromId, toId) {
  if (fromId === toId) return { ok: false, reason: "direct-feedback" };
  const routes = new Map(mixer.strips.map((strip) => [strip.id, strip.output]));
  let cursor = toId;
  const seen = new Set([fromId]);
  while (routes.has(cursor)) {
    if (seen.has(cursor)) return { ok: false, reason: "feedback-loop" };
    seen.add(cursor);
    cursor = routes.get(cursor);
  }
  return { ok: true };
}

export function createAutomationLane(trackId, parameterId, points = [], overrides = {}) {
  return {
    id: overrides.id || `${trackId}-${parameterId}-automation`,
    trackId,
    parameterId,
    enabled: overrides.enabled !== false,
    mode: overrides.mode || "read",
    interpolation: AUTOMATION_INTERPOLATION.includes(overrides.interpolation) ? overrides.interpolation : "linear",
    points: sortAutomationPoints(points),
    writeModes: { write: false, touch: false, latch: false, trim: false, ...(overrides.writeModes || {}) },
  };
}

export function sortAutomationPoints(points) {
  return [...points].map((point, index) => ({ id: point.id || stableId("auto", index + 1), tick: Math.max(0, Number(point.tick || 0)), value: Number(point.value || 0) })).sort((a, b) => a.tick - b.tick || a.id.localeCompare(b.id));
}

export function evaluateAutomation(lane, tick) {
  if (!lane.enabled || lane.points.length === 0) return null;
  const points = lane.points;
  if (tick <= points[0].tick) return points[0].value;
  for (let index = 1; index < points.length; index += 1) {
    const left = points[index - 1];
    const right = points[index];
    if (tick <= right.tick) {
      if (lane.interpolation === "step") return left.value;
      const ratio = (tick - left.tick) / Math.max(1, right.tick - left.tick);
      return Number((left.value + (right.value - left.value) * ratio).toFixed(6));
    }
  }
  return points[points.length - 1].value;
}

export function createEffect(type = "gain", overrides = {}) {
  const supported = ["gain", "filter", "eq", "compressor", "limiter", "delay", "reverb", "distortion", "chorus"].includes(type);
  return {
    id: overrides.id || stableId("effect", 1),
    type,
    supported,
    host: "web-audio-built-in",
    bypass: Boolean(overrides.bypass),
    wetDry: clamp(overrides.wetDry ?? 1, 0, 1),
    order: Number(overrides.order || 0),
    preset: overrides.preset || { schemaVersion: 1, name: `${type} default`, parameters: {} },
    unsupportedReason: supported ? null : "unsupported-effect",
  };
}

export function validateEffect(effect) {
  const errors = [];
  if (!effect.supported) errors.push(`Effect ${effect.type} is unsupported.`);
  if (effect.wetDry < 0 || effect.wetDry > 1) errors.push("Wet/dry must be 0-1.");
  return { valid: errors.length === 0, errors };
}

export function createPluginHostContract() {
  return {
    webAudioBuiltIn: true,
    internalUaosPlugin: true,
    externalDesktopPlugin: "unsupported-experimental",
    scanDisabledByDefault: true,
    arbitraryDllLoading: false,
    unsignedBinaryExecution: false,
    vstHostingClaimed: false,
  };
}

export class CommandHistory {
  constructor({ maxSize = 100 } = {}) {
    this.maxSize = maxSize;
    this.undoStack = [];
    this.redoStack = [];
    this.dirty = false;
  }

  execute(project, command) {
    const before = project;
    const after = command.do(project);
    if (!after || after.error) return { project: before, ok: false, reason: after?.error || "failed-operation" };
    this.undoStack.push({ ...command, before, after });
    if (this.undoStack.length > this.maxSize) this.undoStack.shift();
    this.redoStack = [];
    this.dirty = true;
    return { project: after, ok: true };
  }

  undo(project) {
    const entry = this.undoStack.pop();
    if (!entry) return { project, ok: false, reason: "nothing-to-undo" };
    this.redoStack.push(entry);
    this.dirty = true;
    return { project: entry.undo ? entry.undo(project, entry.before) : entry.before, ok: true };
  }

  redo(project) {
    const entry = this.redoStack.pop();
    if (!entry) return { project, ok: false, reason: "nothing-to-redo" };
    this.undoStack.push(entry);
    this.dirty = true;
    return { project: entry.after, ok: true };
  }

  transaction(project, commands) {
    let current = project;
    const applied = [];
    for (const command of commands) {
      const result = this.execute(current, command);
      if (!result.ok) {
        return { project, ok: false, reason: result.reason, rolledBack: applied.length };
      }
      applied.push(command);
      current = result.project;
    }
    return { project: current, ok: true };
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.dirty = false;
  }
}

export function createRecordingState(overrides = {}) {
  return {
    audio: {
      inputId: null,
      recordArmTrackIds: [],
      monitoring: false,
      inputLevel: 0,
      clipping: false,
      activeTake: null,
      takes: [],
      permissionState: "unknown",
      unsupportedDevice: false,
    },
    midi: {
      recordArmTrackIds: [],
      activeNotes: {},
      events: [],
      channelFilter: "all",
      quantized: false,
      overdub: false,
      replaceMode: false,
      disconnected: false,
    },
    ...overrides,
  };
}

export function startAudioRecording(recording, trackId, options = {}) {
  if (recording.audio.unsupportedDevice) return { ok: false, reason: "unsupported-audio-device", recording };
  return {
    ok: true,
    recording: {
      ...recording,
      audio: {
        ...recording.audio,
        recordArmTrackIds: Array.from(new Set([...recording.audio.recordArmTrackIds, trackId])),
        activeTake: {
          id: options.takeId || stableId("take", recording.audio.takes.length + 1),
          trackId,
          startedAtTick: options.tick || 0,
          startedAtTime: options.time || 0,
          blobUrl: null,
          durationSeconds: 0,
          punch: options.punch || null,
          status: "recording",
        },
      },
    },
  };
}

export function stopAudioRecording(recording, options = {}) {
  const take = recording.audio.activeTake;
  if (!take) return { ok: false, reason: "no-active-audio-recording", recording };
  const completed = {
    ...take,
    status: "completed",
    durationSeconds: Math.max(0, Number(options.durationSeconds || 0)),
    assetId: options.assetId || `${take.id}-asset`,
    blobUrl: options.blobUrl || null,
    waveform: options.waveform || { summary: "pending-extraction", peaks: [] },
    localDownload: true,
  };
  return {
    ok: true,
    clip: createAudioClip(recording.audio.takes.length + 1, { trackId: take.trackId, assetId: completed.assetId, startTick: take.startedAtTick, durationTicks: options.durationTicks || DEFAULT_PPQ * 4 }),
    recording: { ...recording, audio: { ...recording.audio, activeTake: null, takes: [...recording.audio.takes, completed] } },
  };
}

export function cancelAudioRecording(recording) {
  return { ...recording, audio: { ...recording.audio, activeTake: null } };
}

export function startMidiRecording(recording, trackId, options = {}) {
  return {
    ...recording,
    midi: {
      ...recording.midi,
      recordArmTrackIds: Array.from(new Set([...recording.midi.recordArmTrackIds, trackId])),
      events: [],
      activeNotes: {},
      startedAtTick: options.tick || 0,
    },
  };
}

export function captureMidiRecordingEvent(recording, message, tick) {
  if (recording.midi.disconnected) return recording;
  if (recording.midi.channelFilter !== "all" && message.channel !== Number(recording.midi.channelFilter)) return recording;
  const event = { ...message, tick: Math.max(0, Number(tick || 0)) };
  const key = `${message.channel}:${message.note}`;
  const activeNotes = { ...recording.midi.activeNotes };
  if (message.type === "noteOn") activeNotes[key] = event;
  if (message.type === "noteOff") delete activeNotes[key];
  return { ...recording, midi: { ...recording.midi, events: sortMidiEvents([...recording.midi.events, event]), activeNotes } };
}

export function stopMidiRecording(recording, trackId, options = {}) {
  const startTick = recording.midi.startedAtTick || 0;
  const notes = [];
  const noteOns = new Map();
  for (const event of recording.midi.events) {
    const key = `${event.channel}:${event.note}`;
    if (event.type === "noteOn") noteOns.set(key, event);
    if (event.type === "noteOff" && noteOns.has(key)) {
      const start = noteOns.get(key);
      notes.push({ id: stableId("note", notes.length + 1), tick: start.tick - startTick, durationTicks: Math.max(1, event.tick - start.tick), pitch: start.note, velocity: start.velocity, channel: (start.channel ?? 0) + 1 });
      noteOns.delete(key);
    }
  }
  for (const start of noteOns.values()) {
    notes.push({ id: stableId("note", notes.length + 1), tick: start.tick - startTick, durationTicks: DEFAULT_PPQ / 4, pitch: start.note, velocity: start.velocity, channel: (start.channel ?? 0) + 1, protectedByAllNotesOff: true });
  }
  const clip = createMidiClip(1, { trackId, startTick, durationTicks: options.durationTicks || DEFAULT_PPQ * 4, notes });
  return { ok: true, clip, recording: { ...recording, midi: { ...recording.midi, events: [], activeNotes: {} } } };
}

export function createAutosaveState(overrides = {}) {
  return {
    dirty: false,
    intervalMs: 30_000,
    lastSuccessfulSave: null,
    recoverySnapshots: [],
    maxSnapshots: 5,
    crashRecovery: { available: false, reason: null },
    noSecretsPersisted: true,
    rawAudioInLocalStorage: false,
    ...overrides,
  };
}

export function createRecoverySnapshot(project, autosave, savedAt = "1970-01-01T00:00:00.000Z") {
  const snapshot = {
    id: stableId("recovery", autosave.recoverySnapshots.length + 1),
    savedAt,
    schemaVersion: DAW_SCHEMA_VERSION,
    project: sanitizeProjectForStorage(project),
  };
  return { ...autosave, dirty: false, lastSuccessfulSave: savedAt, recoverySnapshots: [snapshot, ...autosave.recoverySnapshots].slice(0, autosave.maxSnapshots) };
}

export function loadRecoverySnapshot(snapshot) {
  try {
    if (!snapshot?.project) throw new Error("Missing project.");
    return { ok: true, project: migrateDawProject(snapshot.project) };
  } catch (error) {
    return { ok: false, reason: "corrupted-snapshot", error: error.message };
  }
}

export function sanitizeProjectForStorage(project) {
  return {
    ...project,
    audioAssets: project.audioAssets.map((asset) => ({ ...asset, blob: undefined, rawBuffer: undefined })),
  };
}

export function createExportJob(project, options = {}) {
  const range = options.range || (project.timeline.loopRange.enabled ? project.timeline.loopRange : { startTick: 0, endTick: project.durationTicks });
  const missingAssets = collectMissingAssets(project);
  const unsupportedEffects = project.mixer.strips.flatMap((strip) => strip.inserts || []).filter((effect) => effect.supported === false);
  return {
    id: options.id || "export-001",
    mode: options.mode || "offline",
    target: options.target || "full-mix",
    range,
    filename: options.filename || `${project.name.replace(/[^a-z0-9_-]/gi, "_")}.wav`,
    sampleRate: project.sampleRate,
    bitDepth: "browser-supported",
    progress: 0,
    cancelled: false,
    clippingWarning: false,
    missingAssetWarning: missingAssets.length > 0,
    unsupportedEffectWarning: unsupportedEffects.length > 0,
    localDownload: true,
    cloudUpload: false,
  };
}

export function cancelExportJob(job) {
  return { ...job, cancelled: true };
}

export function collectMissingAssets(project) {
  return project.tracks.flatMap((track) => track.clips || []).filter((clip) => clip.missingFile || (clip.assetId && !project.audioAssets.some((asset) => asset.id === clip.assetId)));
}

export function createPerformanceLimits(overrides = {}) {
  return {
    maxActiveTracks: 96,
    maxClips: 2000,
    maxSamplerVoices: 128,
    waveformCacheMb: 256,
    objectUrlCleanup: true,
    audioBufferCleanup: true,
    idleRendering: true,
    throttledMeters: true,
    reducedAnimation: true,
    largeProjectWarning: true,
    memoryEstimateMb: null,
    cancellation: true,
    duplicateAudioContext: false,
    stuckMidiNotes: false,
    ...overrides,
  };
}

export function validatePerformance(project, limits = createPerformanceLimits()) {
  const clipCount = project.tracks.reduce((total, track) => total + track.clips.length, 0);
  const warnings = [];
  if (project.tracks.length > limits.maxActiveTracks) warnings.push("maximum-active-tracks-exceeded");
  if (clipCount > limits.maxClips) warnings.push("maximum-clips-exceeded");
  return { ok: warnings.length === 0, warnings };
}

export function createDawProject(overrides = {}) {
  const tracks = overrides.tracks || [
    createTrack("audio", 1, { name: "Vocal Audio", color: "#00ccff" }),
    createTrack("sampler", 1, { name: "Sampler Instrument", color: "#8b5cf6", selectedPreset: "uaos-poly-demo" }),
    createTrack("midi", 1, { name: "MIDI Melody", color: "#9fe7c8" }),
    createTrack("arranger", 1, { name: "Arranger Sections", color: "#f4d35e" }),
    createTrack("master", 1, { id: "master", name: "Master", output: "hardware-main" }),
  ];
  return {
    schemaVersion: DAW_SCHEMA_VERSION,
    id: overrides.id || "uaos-daw-project-001",
    name: overrides.name || "UAOS DAW Project",
    createdAt: overrides.createdAt || "1970-01-01T00:00:00.000Z",
    modifiedAt: overrides.modifiedAt || "1970-01-01T00:00:00.000Z",
    sampleRate: Number(overrides.sampleRate || 48000),
    bitDepth: overrides.bitDepth || "browser-supported",
    tempo: clamp(overrides.tempo || 96, 30, 260),
    tempoMap: overrides.tempoMap || [{ id: "tempo-001", tick: 0, bpm: clamp(overrides.tempo || 96, 30, 260) }],
    timeSignature: overrides.timeSignature || { numerator: 4, denominator: 4 },
    timeSignatureMap: overrides.timeSignatureMap || [{ id: "sig-001", tick: 0, numerator: 4, denominator: 4 }],
    durationTicks: Number(overrides.durationTicks || DEFAULT_PPQ * 32),
    loopRange: overrides.loopRange || { enabled: false, startTick: 0, endTick: DEFAULT_PPQ * 4 },
    punchRange: overrides.punchRange || { enabled: false, startTick: 0, endTick: DEFAULT_PPQ * 4 },
    markers: Array.isArray(overrides.markers) ? overrides.markers : [],
    regions: Array.isArray(overrides.regions) ? overrides.regions : [],
    tracks,
    mixer: overrides.mixer || createMixerState(tracks),
    automation: Array.isArray(overrides.automation) ? overrides.automation : [],
    arrangerLink: overrides.arrangerLink || { enabled: true, source: "phase3", state: createArrangerState(), preserveManualEdits: true },
    aiLink: overrides.aiLink || { enabled: true, source: "phase5", providerRemoteEnabled: false, importedAnalysisIds: [] },
    hardwareLink: overrides.hardwareLink || { enabled: true, source: "phase6", selectedProfileId: null, sysexEnabled: false },
    audioAssets: Array.isArray(overrides.audioAssets) ? overrides.audioAssets : [],
    missingAssets: Array.isArray(overrides.missingAssets) ? overrides.missingAssets : [],
    autosave: overrides.autosave || createAutosaveState(),
    recording: overrides.recording || createRecordingState(),
    timeline: overrides.timeline || createTimelineState(),
    transport: overrides.transport || createTransportState({ tempo: overrides.tempo || 96 }),
    effects: Array.isArray(overrides.effects) ? overrides.effects : [],
    pluginHost: overrides.pluginHost || createPluginHostContract(),
    performance: overrides.performance || createPerformanceLimits(),
  };
}

export function validateDawProject(project) {
  const errors = [];
  if (!project || typeof project !== "object") errors.push("Project must be an object.");
  if (!project?.id) errors.push("Project id is required.");
  if (!project?.name) errors.push("Project name is required.");
  if (!Array.isArray(project?.tracks)) errors.push("Tracks must be an array.");
  for (const track of project?.tracks || []) {
    if (!TRACK_TYPES.includes(track.type)) errors.push(`${track.id} has unsupported track type.`);
    for (const clip of track.clips || []) {
      const validation = clip.type === "midi" ? validateMidiClip(clip) : validateAudioClip(clip);
      if (!validation.valid) errors.push(...validation.errors);
    }
  }
  const routing = project?.mixer ? validateMixerRouting(project.mixer) : { valid: false, errors: ["Mixer missing."] };
  if (!routing.valid) errors.push(...routing.errors);
  return { valid: errors.length === 0, errors };
}

export function migrateDawProject(value = {}) {
  const base = createDawProject();
  const tracks = Array.isArray(value.tracks) ? value.tracks.map((track, index) => ({
    ...createTrack(track.type || "audio", index + 1),
    ...track,
    clips: Array.isArray(track.clips) ? track.clips.map((clip, clipIndex) => clip.type === "midi" ? createMidiClip(clipIndex + 1, clip) : createAudioClip(clipIndex + 1, clip)) : [],
  })) : base.tracks;
  return {
    ...base,
    ...value,
    schemaVersion: DAW_SCHEMA_VERSION,
    tracks,
    tempo: clamp(value.tempo || base.tempo, 30, 260),
    tempoMap: Array.isArray(value.tempoMap) && value.tempoMap.length ? value.tempoMap : base.tempoMap,
    timeSignature: value.timeSignature || base.timeSignature,
    timeSignatureMap: Array.isArray(value.timeSignatureMap) && value.timeSignatureMap.length ? value.timeSignatureMap : base.timeSignatureMap,
    mixer: value.mixer || createMixerState(tracks),
    automation: Array.isArray(value.automation) ? value.automation.map((lane) => createAutomationLane(lane.trackId, lane.parameterId, lane.points, lane)) : [],
    audioAssets: Array.isArray(value.audioAssets) ? value.audioAssets.map((asset) => ({ ...asset, blob: undefined, rawBuffer: undefined })) : [],
    missingAssets: Array.isArray(value.missingAssets) ? value.missingAssets : [],
    autosave: { ...base.autosave, ...(value.autosave || {}), rawAudioInLocalStorage: false, noSecretsPersisted: true },
    recording: { ...base.recording, ...(value.recording || {}) },
    timeline: { ...base.timeline, ...(value.timeline || {}) },
    transport: { ...base.transport, ...(value.transport || {}) },
    hardwareLink: { ...base.hardwareLink, ...(value.hardwareLink || {}), sysexEnabled: false },
    pluginHost: { ...base.pluginHost, ...(value.pluginHost || {}), arbitraryDllLoading: false, unsignedBinaryExecution: false, vstHostingClaimed: false },
    performance: { ...base.performance, ...(value.performance || {}) },
  };
}

export function arrangerToTracks(arrangerState = createArrangerState(), options = {}) {
  const lanes = ["drum", "bass", "chord", "pad", "lead"];
  const tracks = lanes.map((lane, index) => createTrack(lane === "drum" ? "drum" : "instrument", index + 1, {
    id: `arranger-${lane}`,
    name: `Arranger ${lane}`,
    channel: arrangerState.channels?.[lane] || index + 1,
    selectedPreset: arrangerState.patterns?.[lane] || "basic",
    clips: [createMidiClip(index + 1, {
      id: `arranger-${lane}-clip`,
      trackId: `arranger-${lane}`,
      name: `${arrangerState.section || "INTRO"} ${lane}`,
      startTick: options.startTick || 0,
      durationTicks: DEFAULT_PPQ * 4,
      chord: arrangerState.chord,
    })],
  }));
  return {
    tracks,
    regions: [{ id: "arranger-region-001", name: arrangerState.section || "INTRO", startTick: options.startTick || 0, endTick: (options.startTick || 0) + DEFAULT_PPQ * 4, preserveManualEdits: true }],
    markers: [{ id: "chord-marker-001", tick: options.startTick || 0, type: "chord", label: arrangerState.chord || "Cm" }],
  };
}

export function importAiMelody(voiceMelody, trackId = "midi-001") {
  const notes = (voiceMelody?.notes || []).map((note, index) => ({
    id: stableId("note", index + 1),
    tick: Math.max(0, Math.round(Number(note.start || 0) * DEFAULT_PPQ)),
    durationTicks: Math.max(1, Math.round(Number(note.duration || 0.25) * DEFAULT_PPQ)),
    pitch: clamp(note.midi || 60, 0, 127),
    velocity: clamp(note.velocity || 90, 1, 127),
    channel: 1,
    confidence: note.confidence ?? voiceMelody.confidence ?? null,
  }));
  return createMidiClip(1, { id: "ai-melody-clip", trackId, name: "AI Melody Import", notes, durationTicks: Math.max(DEFAULT_PPQ, ...notes.map((note) => note.tick + note.durationTicks), DEFAULT_PPQ) });
}

export function applyHardwareTransport(transport, hardwareCommand) {
  if (hardwareCommand.command === "transport.start") return reduceTransport(transport, { type: "start" });
  if (hardwareCommand.command === "transport.stop") return reduceTransport(transport, { type: "stop" });
  if (hardwareCommand.command === "record.start") return reduceTransport(transport, { type: "record" });
  if (hardwareCommand.command === "panic") return reduceTransport(transport, { type: "panic" });
  return transport;
}

export function linkPhase6Hardware(project, hardware) {
  const migrated = migrateHardwareSession(hardware);
  return {
    ...project,
    hardwareLink: {
      enabled: true,
      source: "phase6",
      selectedProfileId: migrated.selectedProfileId,
      selectedInputId: migrated.selectedInputId,
      selectedOutputId: migrated.selectedOutputId,
      sysexEnabled: false,
      disconnectedFallback: migrated.connectionState === "disconnected",
    },
  };
}
