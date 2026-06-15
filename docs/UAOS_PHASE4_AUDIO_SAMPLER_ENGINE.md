# UAOS Phase 4 Audio Sampler Engine

Status: CODE_READY_EXTERNAL_APPROVALS_REQUIRED

Phase 4 adds a maintainable browser-first audio and sampler foundation without claiming proprietary keyboard format support, bundled commercial libraries, mastering, lossless export, real production activation, or physical hardware validation.

## Implemented Engine Contracts

- `uaos-live-clean/src/audio/audioEngine.js`
  - AudioContext lifecycle: create, resume, suspend, unsupported fallback state.
  - Master gain, channel gain, pan, mute, solo.
  - Polyphonic voice allocation through the existing `VoiceAllocator`.
  - Safe oldest-voice stealing and panic/all-notes-off.
  - Sustain pedal bookkeeping, transpose, fine tuning, pitch bend foundation.
  - Master meter and clipping detection contract.

- `uaos-live-clean/src/sampler/samplerEngine.js`
  - Versioned sampler preset schema v2 with migration from v1 instrument presets.
  - Real `decodeAudioData` cache contract for local WAV buffers.
  - Decode error reporting, sample cache, key zones, velocity zones, root note mapping.
  - One-shot and gated playback flags, drum maps, choke group metadata, loop metadata foundation.
  - Missing sample/preset safe results instead of crashes.

- `uaos-live-clean/src/arranger/arrangerAudioIntegration.js`
  - Stable arranger part to sampler preset assignments.
  - Drum, percussion, bass, chord, pad, phrase roles and MIDI channel contracts.
  - Section playback contract for tempo, time signature, lanes, events, volume and pan.
  - Missing preset fallback returns a structured `missing-preset` result.

- `uaos-live-clean/src/library/libraryCatalog.js`
  - Library catalog schema v2.
  - Stable instrument IDs, categories, tags, legal/source metadata.
  - Oriental, Gulf, Turkish, Western plus practical instrument categories.
  - Search, filtering, favorites and recent presets.
  - Metadata-only design; no upload and no commercial file copying.

- `uaos-live-clean/src/recording/recordingEngine.js`
  - Microphone support detection.
  - MediaRecorder start, pause, resume, stop.
  - Supported browser format detection.
  - Clip metadata, level and clipping contracts.
  - Offline render/export marked as contract only.

## Frontend Integration

`SamplerWorkbench` now exposes Phase 4 controls tied to the real runtime state:

- AudioContext resume/suspend.
- Channel gain and pan.
- Mute and solo.
- Transpose, fine tuning and pitch bend foundation.
- Master meter and clipping indicator.
- MIDI-triggered sampler playback remains connected to local WAV buffers.
- Recording support panel reports microphone, MediaRecorder and format availability honestly.

`LibraryBrowser` now includes Phase 4 category filtering while preserving metadata-only/legal-source boundaries.

## Session Compatibility

`sessionStore` schema is now v2. Migration preserves older sessions and adds:

- `audio`
- `sampler`
- `library`
- `recording`

Validation rejects structurally invalid Phase 4 state and older sessions migrate safely without corrupting timeline, arranger or MIDI mapping data.

## Test Coverage

`tests/phase4-audio-sampler.test.mjs` covers:

- Audio lifecycle, gain, pan, mute, solo, sustain, panic, meter and clipping.
- Voice stealing through max polyphony.
- Preset migration and validation.
- WAV decode error handling and sample cache.
- Key-zone and velocity-zone selection.
- One-shot playback, drum maps and missing-sample fallback.
- Arranger part assignment and missing preset fallback.
- Library search, category filtering, favorites, recents and legal metadata.
- Session serialization and older session migration.
- Recording browser support and clip metadata.
- UI integrity for Phase 4 controls.

Existing sampler, MIDI, library, arranger, pricing, Arabic/branding, Phase 3 and launch tests remain in the root test suite.

## Browser and Hardware Limits

- Web Audio, Web MIDI, microphone and MediaRecorder behavior still depends on browser/runtime permissions and connected devices.
- Physical MIDI routing, sustain pedal, panic, drum maps, output routing and microphone recording must be validated with real hardware.
- Windows signing and commercial production activation remain external release blockers.
