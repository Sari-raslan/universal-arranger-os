# UAOS V1 Feature Matrix

| Area | Status | Notes |
| --- | --- | --- |
| Audio Lab | Available | Microphone permission, input selection, AudioContext lifecycle, RMS/peak/clipping, pitch estimate, note/MIDI conversion, MediaRecorder download. |
| MIDI Monitor | Available | WebMIDI detection, scan, input/output selection, message parsing, monitor, optional thru, panic, MIDI learn mappings in localStorage. |
| Timeline | Available | Start/stop recording, MIDI and throttled audio-analysis capture, JSON session persistence, playback information mode. |
| Sessions | Available | Save, load, clear, import/export JSON, schema validation, migration foundation. |
| Arranger | Experimental | Sections, BPM, bar/beat clock, lanes, mute/solo, pattern selection, scenes, live mode, panic event. |
| Sounds | Planned | Library cards are explicitly marked planned; no sampled instruments ship in V1. |
| Sampler | Planned | UI foundation only; playback engine is not claimed. |
| Desktop | Experimental | Local dist/dev loading, context isolation, IPC whitelist, smoke check. |
| Backend | Available | Health, version, status, deterministic pattern and MIDI export, local project/sample helpers. |

