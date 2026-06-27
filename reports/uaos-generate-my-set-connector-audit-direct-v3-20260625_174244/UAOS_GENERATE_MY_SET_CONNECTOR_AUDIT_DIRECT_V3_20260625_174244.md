# UAOS GENERATE MY SET CONNECTOR AUDIT DIRECT V3

Time: 20260625_174244
Root: C:\Users\ssare\keyboard-manager-clean

## Executive Decision

**GENERATE_MY_SET_DRY_RUN_CONNECTOR_POSSIBLE_FROM_EXISTING_CODE**

Can assemble dry-run from existing code: **True**

## Safety
- NO DELETE
- NO FORCE PUSH
- NO PAYMENT
- NO REAL WRITER
- NO REAL KEYBOARD OUTPUT
- NO PRODUCTION PARSER
- NO APP.JSX CHANGES
- NO NEW ENGINES WRITTEN

## Callable Check
| Area | Callable / Useful |
|---|---:|
| voiceMelodyEngine | True |
| arrangementEngine | True |
| dawPhase7 | True |
| DAWStudioPanel reference | True |

## Minimum Connector Needed
- Unified UAOSProject JSON schema
- Connector only: Voice to Arrangement to DAW/MIDI
- Safe output folder only
- QA validator for required fields
- Dry-run JSON/MD/HTML outputs only
- No real writer
- No keyboard output
- No production parser

## File Audit Summary
| File | Status | Score | Size KB | Lines | Functions | Exports | Voice | Arrangement | MIDI | DAW | Output | Risk Writer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| voiceMelodyEngine | READY_OR_MOST_USEFUL | 8 | 5.56 | 140 | 12 | 9 | 93 | 0 | 56 | 2 | 31 | 0 |
| arrangementEngine | READY_OR_MOST_USEFUL | 8 | 2.64 | 112 | 5 | 6 | 3 | 64 | 10 | 26 | 19 | 0 |
| dawPhase7 | READY_OR_MOST_USEFUL | 10 | 38.5 | 887 | 60 | 62 | 260 | 69 | 325 | 352 | 195 | 2 |
| DAWStudioPanel | READY_OR_MOST_USEFUL | 8 | 22.25 | 364 | 20 |  | 98 | 29 | 256 | 506 | 46 | 0 |

## voiceMelodyEngine

Path: C:\Users\ssare\keyboard-manager-clean\uaos-live-clean\src\ai\voiceMelodyEngine.js
Role: Voice Input / melody extraction
Status: **READY_OR_MOST_USEFUL**

### Exports
- Line 7: classifyVoicing | export function classifyVoicing(point, threshold = 0.35)
- Line 11: smoothPitchContour | export function smoothPitchContour(points, smoothing = 0.35)
- Line 20: correctOctaveJumps | export function correctOctaveJumps(points, semitoneLimit = 7)
- Line 34: segmentMelodyNotes | export function segmentMelodyNotes(points, {
  minDuration = 0.08,
  silenceGap = 0.06,
  pitchChange = 1,
  pitchRange = [0, 127],
} = {})
- Line 74: quantizeMelody | export function quantizeMelody(notes, { bpm = 120, subdivision = 4, swing = 0 } = {})
- Line 86: snapMelodyToScale | export function snapMelodyToScale(notes, { root = 0, mode = "major" } = {})
- Line 102: transposeMelody | export function transposeMelody(notes, semitones = 0, pitchRange = [0, 127])
- Line 109: melodyToMidiEvents | export function melodyToMidiEvents(notes, { channel = 1, ppq = 480, bpm = 120 } = {})
- Line 123: voiceToMelody | export function voiceToMelody(points, options = {})

### Functions
- Line 3: clamp(value, min, max)
- Line 7: classifyVoicing(point, threshold = 0.35)
- Line 11: smoothPitchContour(points, smoothing = 0.35)
- Line 20: correctOctaveJumps(points, semitoneLimit = 7)
- Line 34: segmentMelodyNotes(points, {
  minDuration = 0.08,
  silenceGap = 0.06,
  pitchChange = 1,
  pitchRange = [0, 127],
} = {})
- Line 44: close(endTime)
- Line 74: quantizeMelody(notes, { bpm = 120, subdivision = 4, swing = 0 } = {})
- Line 86: snapMelodyToScale(notes, { root = 0, mode = "major" } = {})
- Line 102: transposeMelody(notes, semitones = 0, pitchRange = [0, 127])
- Line 109: melodyToMidiEvents(notes, { channel = 1, ppq = 480, bpm = 120 } = {})
- Line 123: voiceToMelody(points, options = {})
- Line 111: secondsToTicks(seconds)

### Return Output Snippets
- Line 5: return Math.max(min, Math.min(max, Number(value)));
- Line 9: return Boolean(point && point.frequency > 0 && Number(point.confidence || 0) >= threshold);
- Line 14: return points.map((point) => {
- Line 17: return { ...point, smoothedFrequency: previous, voiced: true };
- Line 23: return points.map((point) => {
- Line 31: return { ...point, midi };
- Line 72: return notes;
- Line 78: return notes.map((note) => {
- Line 83: return { ...note, start, end: start + duration, duration, quantized: true };
- Line 89: return notes.map((note) => {
- Line 99: return { ...note, midi: clamp(best, 0, 127), snapped: true };
- Line 104: return notes.map((note) => ({
- Line 112: return notes.flatMap((note) => {
- Line 117: return [
- Line 131: return {

## arrangementEngine

Path: C:\Users\ssare\keyboard-manager-clean\uaos-live-clean\src\uaos-local-music-engine\arrangement\arrangementEngine.js
Role: Arrangement sections / chord logic
Status: **READY_OR_MOST_USEFUL**

### Exports
- Line 2: createArrangement | export function createArrangement({
  title = "Untitled Arrangement",
  tempo = 120,
  timeSignature = "4/4",
  key = "C"
} = {})
- Line 25: createSongSection | export function createSongSection({
  sectionId,
  name = "Verse",
  startBar = 1,
  bars = 8,
  chords = ["C", "Am", "F", "G"]
} = {})
- Line 48: generatePlaceholderStyleLanes | export function generatePlaceholderStyleLanes(section)
- Line 82: addSection | export function addSection(arrangement, section)
- Line 89: exportArrangementToUaosProjectJson | export function exportArrangementToUaosProjectJson(arrangement)
- Line 1: UAOS_ARRANGEMENT_ENGINE_VERSION | export const UAOS_ARRANGEMENT_ENGINE_VERSION =

### Functions
- Line 2: createArrangement({
  title = "Untitled Arrangement",
  tempo = 120,
  timeSignature = "4/4",
  key = "C"
} = {})
- Line 25: createSongSection({
  sectionId,
  name = "Verse",
  startBar = 1,
  bars = 8,
  chords = ["C", "Am", "F", "G"]
} = {})
- Line 48: generatePlaceholderStyleLanes(section)
- Line 82: addSection(arrangement, section)
- Line 89: exportArrangementToUaosProjectJson(arrangement)

### Return Output Snippets
- Line 9: return {
- Line 33: return {
- Line 52: return {
- Line 84: return {
- Line 94: return {

## dawPhase7

Path: C:\Users\ssare\keyboard-manager-clean\uaos-live-clean\src\daw\dawPhase7.js
Role: MIDI / DAW generation
Status: **READY_OR_MOST_USEFUL**

### Exports
- Line 8: stableId | export function stableId(prefix, index = 1)
- Line 20: ticksPerBar | export function ticksPerBar(timeSignature = { numerator: 4, denominator: 4 }, ppq = DEFAULT_PPQ)
- Line 24: musicalToTicks | export function musicalToTicks({ bar = 1, beat = 1, tick = 0 }, timeSignature = { numerator: 4, denominator: 4 }, ppq = DEFAULT_PPQ)
- Line 29: ticksToMusical | export function ticksToMusical(ticks, timeSignature = { numerator: 4, denominator: 4 }, ppq = DEFAULT_PPQ)
- Line 39: ticksToSeconds | export function ticksToSeconds(ticks, tempoMap = [{ tick: 0, bpm: 120 }], ppq = DEFAULT_PPQ)
- Line 54: secondsToTicks | export function secondsToTicks(seconds, tempoMap = [{ tick: 0, bpm: 120 }], ppq = DEFAULT_PPQ)
- Line 69: createTrack | export function createTrack(type = "audio", index = 1, overrides = {})
- Line 101: createAudioClip | export function createAudioClip(index = 1, overrides = {})
- Line 135: createMidiClip | export function createMidiClip(index = 1, overrides = {})
- Line 160: sortMidiEvents | export function sortMidiEvents(events)
- Line 164: validateAudioClip | export function validateAudioClip(clip)
- Line 173: validateMidiClip | export function validateMidiClip(clip)
- Line 185: addMidiNote | export function addMidiNote(clip, note)
- Line 198: quantizeMidiClip | export function quantizeMidiClip(clip, gridTicks = DEFAULT_PPQ / 4)
- Line 210: transposeMidiClip | export function transposeMidiClip(clip, semitones = 0)
- Line 218: splitClip | export function splitClip(clip, splitTick)
- Line 232: duplicateClip | export function duplicateClip(clip, offsetTicks = clip.durationTicks)
- Line 237: resizeClip | export function resizeClip(clip, newDurationTicks)
- Line 242: moveClip | export function moveClip(clip, newStartTick, snapTicks = 1)
- Line 248: placeClip | export function placeClip(project, trackId, clip, options = {})
- Line 257: createTimelineState | export function createTimelineState(overrides = {})
- Line 273: createTransportState | export function createTransportState(overrides = {})
- Line 291: reduceTransport | export function reduceTransport(state, action, project = null)
- Line 325: schedulePlayhead | export function schedulePlayhead(state, elapsedSeconds, ppq = DEFAULT_PPQ)
- Line 335: createMixerState | export function createMixerState(tracks = [])
- Line 341: createChannelStrip | export function createChannelStrip(track, index = 1)
- Line 362: updateChannelStrip | export function updateChannelStrip(mixer, stripId, changes)
- Line 374: validateMixerRouting | export function validateMixerRouting(mixer)
- Line 384: preventFeedbackLoop | export function preventFeedbackLoop(mixer, fromId, toId)
- Line 397: createAutomationLane | export function createAutomationLane(trackId, parameterId, points = [], overrides = {})
- Line 410: sortAutomationPoints | export function sortAutomationPoints(points)
- Line 414: evaluateAutomation | export function evaluateAutomation(lane, tick)
- Line 430: createEffect | export function createEffect(type = "gain", overrides = {})
- Line 445: validateEffect | export function validateEffect(effect)
- Line 452: createPluginHostContract | export function createPluginHostContract()
- Line 520: createRecordingState | export function createRecordingState(overrides = {})
- Line 547: startAudioRecording | export function startAudioRecording(recording, trackId, options = {})
- Line 571: stopAudioRecording | export function stopAudioRecording(recording, options = {})
- Line 590: cancelAudioRecording | export function cancelAudioRecording(recording)
- Line 594: startMidiRecording | export function startMidiRecording(recording, trackId, options = {})
- Line 607: captureMidiRecordingEvent | export function captureMidiRecordingEvent(recording, message, tick)
- Line 618: stopMidiRecording | export function stopMidiRecording(recording, trackId, options = {})
- Line 638: createAutosaveState | export function createAutosaveState(overrides = {})
- Line 652: createRecoverySnapshot | export function createRecoverySnapshot(project, autosave, savedAt = "1970-01-01T00:00:00.000Z")
- Line 662: loadRecoverySnapshot | export function loadRecoverySnapshot(snapshot)
- Line 671: sanitizeProjectForStorage | export function sanitizeProjectForStorage(project)
- Line 678: createExportJob | export function createExportJob(project, options = {})
- Line 700: cancelExportJob | export function cancelExportJob(job)
- Line 704: collectMissingAssets | export function collectMissingAssets(project)
- Line 708: createPerformanceLimits | export function createPerformanceLimits(overrides = {})
- Line 728: validatePerformance | export function validatePerformance(project, limits = createPerformanceLimits()
- Line 736: createDawProject | export function createDawProject(overrides = {})
- Line 779: validateDawProject | export function validateDawProject(project)
- Line 797: migrateDawProject | export function migrateDawProject(value = {})
- Line 827: arrangerToTracks | export function arrangerToTracks(arrangerState = createArrangerState()
- Line 850: importAiMelody | export function importAiMelody(voiceMelody, trackId = "midi-001")
- Line 863: applyHardwareTransport | export function applyHardwareTransport(transport, hardwareCommand)
- Line 871: linkPhase6Hardware | export function linkPhase6Hardware(project, hardware)
- Line 3: DAW_SCHEMA_VERSION | export const DAW_SCHEMA_VERSION =
- Line 5: DEFAULT_PPQ | export const DEFAULT_PPQ =
- Line 6: TRACK_TYPES | export const TRACK_TYPES =
- Line 7: AUTOMATION_INTERPOLATION | export const AUTOMATION_INTERPOLATION =

### Functions
- Line 8: stableId(prefix, index = 1)
- Line 12: clamp(value, min, max)
- Line 16: sortedByTime(items)
- Line 20: ticksPerBar(timeSignature = { numerator: 4, denominator: 4 }, ppq = DEFAULT_PPQ)
- Line 24: musicalToTicks({ bar = 1, beat = 1, tick = 0 }, timeSignature = { numerator: 4, denominator: 4 }, ppq = DEFAULT_PPQ)
- Line 29: ticksToMusical(ticks, timeSignature = { numerator: 4, denominator: 4 }, ppq = DEFAULT_PPQ)
- Line 39: ticksToSeconds(ticks, tempoMap = [{ tick: 0, bpm: 120 }], ppq = DEFAULT_PPQ)
- Line 54: secondsToTicks(seconds, tempoMap = [{ tick: 0, bpm: 120 }], ppq = DEFAULT_PPQ)
- Line 69: createTrack(type = "audio", index = 1, overrides = {})
- Line 101: createAudioClip(index = 1, overrides = {})
- Line 135: createMidiClip(index = 1, overrides = {})
- Line 160: sortMidiEvents(events)
- Line 164: validateAudioClip(clip)
- Line 173: validateMidiClip(clip)
- Line 185: addMidiNote(clip, note)
- Line 198: quantizeMidiClip(clip, gridTicks = DEFAULT_PPQ / 4)
- Line 210: transposeMidiClip(clip, semitones = 0)
- Line 218: splitClip(clip, splitTick)
- Line 232: duplicateClip(clip, offsetTicks = clip.durationTicks)
- Line 237: resizeClip(clip, newDurationTicks)
- Line 242: moveClip(clip, newStartTick, snapTicks = 1)
- Line 248: placeClip(project, trackId, clip, options = {})
- Line 257: createTimelineState(overrides = {})
- Line 273: createTransportState(overrides = {})
- Line 291: reduceTransport(state, action, project = null)
- Line 325: schedulePlayhead(state, elapsedSeconds, ppq = DEFAULT_PPQ)
- Line 335: createMixerState(tracks = [])
- Line 341: createChannelStrip(track, index = 1)
- Line 362: updateChannelStrip(mixer, stripId, changes)
- Line 374: validateMixerRouting(mixer)
- Line 384: preventFeedbackLoop(mixer, fromId, toId)
- Line 397: createAutomationLane(trackId, parameterId, points = [], overrides = {})
- Line 410: sortAutomationPoints(points)
- Line 414: evaluateAutomation(lane, tick)
- Line 430: createEffect(type = "gain", overrides = {})
- Line 445: validateEffect(effect)
- Line 452: createPluginHostContract()
- Line 520: createRecordingState(overrides = {})
- Line 547: startAudioRecording(recording, trackId, options = {})
- Line 571: stopAudioRecording(recording, options = {})
- Line 590: cancelAudioRecording(recording)
- Line 594: startMidiRecording(recording, trackId, options = {})
- Line 607: captureMidiRecordingEvent(recording, message, tick)
- Line 618: stopMidiRecording(recording, trackId, options = {})
- Line 638: createAutosaveState(overrides = {})
- Line 652: createRecoverySnapshot(project, autosave, savedAt = "1970-01-01T00:00:00.000Z")
- Line 662: loadRecoverySnapshot(snapshot)
- Line 671: sanitizeProjectForStorage(project)
- Line 678: createExportJob(project, options = {})
- Line 700: cancelExportJob(job)
- Line 704: collectMissingAssets(project)
- Line 708: createPerformanceLimits(overrides = {})
- Line 728: validatePerformance(project, limits = createPerformanceLimits()
- Line 736: createDawProject(overrides = {})
- Line 779: validateDawProject(project)
- Line 797: migrateDawProject(value = {})
- Line 827: arrangerToTracks(arrangerState = createArrangerState()
- Line 850: importAiMelody(voiceMelody, trackId = "midi-001")
- Line 863: applyHardwareTransport(transport, hardwareCommand)
- Line 871: linkPhase6Hardware(project, hardware)

### Return Output Snippets
- Line 10: return `${prefix}-${String(index).padStart(3, "0")}`;
- Line 14: return Math.min(max, Math.max(min, Number(value)));
- Line 18: return [...items].sort((a, b) => (a.startTick ?? a.tick ?? a.time ?? 0) - (b.startTick ?? b.tick ?? b.time ?? 0) || String(a.id).localeCompare(String(b.id)));
- Line 22: return Number(timeSignature.numerator || 4) * ppq * (4 / Number(timeSignature.denominator || 4));
- Line 27: return Math.max(0, Math.round((Number(bar) - 1) * barTicks + (Number(beat) - 1) * ppq + Number(tick)));
- Line 37: return { bar, beat, tick };
- Line 52: return Number(seconds.toFixed(6));
- Line 67: return Math.round(cursor + (remaining / (60 / bpm)) * ppq);
- Line 72: return {
- Line 105: return {
- Line 139: return {
- Line 162: return [...events].sort((a, b) => Number(a.tick || 0) - Number(b.tick || 0) || Number(a.pitch || a.controller || 0) - Number(b.pitch || b.controller || 0));
- Line 171: return { valid: errors.length === 0, errors };
- Line 183: return { valid: errors.length === 0, errors };
- Line 196: return { ...clip, notes: sortMidiEvents([...(clip.notes || []), nextNote]) };
- Line 201: return {
- Line 212: return {
- Line 230: return { ok: true, clips: [left, right] };
- Line 235: return { ...clip, id: `${clip.id}-copy`, startTick: clip.startTick + offset, endTick: clip.endTick + offset };
- Line 240: return { ...clip, durationTicks, endTick: clip.startTick + durationTicks };
- Line 246: return { ...clip, startTick, endTick: startTick + clip.durationTicks };
- Line 255: return { ok: true, project: { ...project, tracks: nextTracks, modifiedAt: options.modifiedAt || project.modifiedAt } };
- Line 259: return {
- Line 275: return {
- Line 296: return { ...current, state: current.countIn.enabled ? "count-in" : "playing", paused: false, recording: false };

## DAWStudioPanel

Path: C:\Users\ssare\keyboard-manager-clean\uaos-live-clean\src\components\DAWStudioPanel.jsx
Role: Existing UI reference
Status: **READY_OR_MOST_USEFUL**

### Exports
- Line 45: DAWStudioPanel | export function DAWStudioPanel({ session, onSessionChange })

### Functions
- Line 36: formatPosition(project)
- Line 41: status(value)
- Line 45: DAWStudioPanel({ session, onSessionChange })
- Line 56: commit(nextProject, label = "edit")
- Line 62: restore(nextProject, direction)
- Line 70: addTrack(type)
- Line 78: deleteSelectedTrack()
- Line 85: updateTrack(changes)
- Line 93: addClip(type)
- Line 105: editClip(action)
- Line 119: editMidi(action)
- Line 128: transport(type)
- Line 132: saveProject()
- Line 138: applyArranger()
- Line 143: importAi()
- Line 152: linkHardware()
- Line 156: hardwarePlay()
- Line 160: recordAudio()
- Line 174: recordMidi()
- Line 185: startExport()

### Return Output Snippets
- Line 39: return `${pos.bar}.${pos.beat}.${pos.tick}`;
- Line 43: return String(value || "unknown").replaceAll("-", " ");
- Line 192: return (

## Next Safe Phase
UAOS GENERATE MY SET DRY-RUN ORCHESTRATOR V1
- One connector only.
- Reuse existing code first.
- Dry-run outputs only.
- No App.jsx unless separately approved.
- No real writer / no keyboard output.
