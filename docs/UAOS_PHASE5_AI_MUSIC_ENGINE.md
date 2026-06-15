# UAOS Phase 5 AI Music Engine

Status: CODE_READY_EXTERNAL_APPROVALS_REQUIRED

Phase 5 implements a local deterministic AI Music Studio foundation. It is deliberately offline by default and does not use API secrets, cloud models, user-audio upload, proprietary style conversion, or commercial audio libraries.

## Implemented Modules

- `src/ai/audioAnalysisCore.js`
  - PCM normalization, mono/stereo handling, sample-rate metadata, duration, RMS, peak, clipping, silence, frame extraction, Hann windowing, spectral magnitude, spectral centroid, zero-crossing rate, onset/impulse detection, tempo candidates, BPM, confidence, beat grid, downbeat candidates, pitch-class profile, key, chord timeline, section candidates, energy curve, structure labels and graceful invalid-input failure.

- `src/ai/voiceMelodyEngine.js`
  - Monophonic pitch contour smoothing, voiced/unvoiced classification, octave jump correction, note segmentation, duration, velocity estimate, quantization, swing-aware foundation, scale snapping, transpose, MIDI event representation and JSON export contract.

- `src/ai/midiFileWriter.js`
  - Deterministic Standard MIDI File writer with tempo, time signature, track name, note-on, note-off, velocity, channel, optional program metadata and note range/delta validation.

- `src/music/musicTheory.js`
  - Notes, pitch classes, intervals through scale/chord construction, major/natural minor/harmonic minor/melodic minor, triads, sevenths, inversions, diatonic chords, transposition, key scoring, roman numerals, slash-chord/bass awareness.

- `src/music/orientalTheory.js`
  - Maqam metadata for Rast, Bayati, Hijaz, Nahawand, Kurd, Ajam, Saba and Sikah with cents offsets, quarter-tone metadata, MIDI approximation warnings and manual correction support.

- `src/ai/songStructureAnalyzer.js`
  - JSON song structure output with duration, tempo, key, mode, chord timeline, energy timeline, onsets, probable sections, similarity foundation, confidence and deterministic fallback.

- `src/ai/songToArrangementPlanner.js`
  - Song-to-arranger plan mapping analysis to Phase 3 sections and Phase 4 sampler preset references.

- `src/ai/arrangementRules.js`
  - Deterministic rule engine for style metadata, tempo ranges, intensity, drum density, bass/chord/pad/phrase activity, fills, intro/ending length, voice-leading foundation and Oriental percussion metadata.

- `src/ai/aiProvider.js`
  - Local deterministic provider, mock provider, disabled remote provider, request/response schema, error normalization, offline metadata, explicit consent and cost warning metadata.

- `src/ai/analysisJobs.js`
  - Local job lifecycle with queued/loading/decoding/analyzing/generating/detecting/planning/complete/failed/cancelled, progress, timestamps, cancellation, retry and duplicate-job protection.

## UI

`UAOS AI Music Studio` replaces the older AI Labs panel. It includes:

- Local/offline and no-upload indicators.
- Provider disabled indicator.
- Analysis job progress.
- Synthetic demo input information.
- Energy visualization.
- BPM/key/maqam/chord/section status.
- Voice-to-MIDI controls for quantization, scale snap, transpose and minimum duration.
- MIDI and JSON local export.
- Arrangement plan with style rules and Phase 3/4 mapping.
- Preview/stop controls that remain honest about Phase 4 sampler/user-interaction requirements.

## Session

Session schema v3 adds `aiMusic` state for analysis results, melodies, MIDI export metadata, detected tempo/key/mode/maqam, chord timeline, song sections, arrangement plans, provider metadata, jobs, confidence and manual corrections. Raw audio is not stored in localStorage.

## Limitations

- Analysis is heuristic and deterministic, not a measured professional AI model.
- Polyphonic transcription is not claimed.
- Maqam analysis is experimental.
- Ordinary MIDI quarter-tone playback requires pitch bend, MPE or a tuning system.
- Remote AI providers are disabled by default.
- User audio is not uploaded or permanently copied.
