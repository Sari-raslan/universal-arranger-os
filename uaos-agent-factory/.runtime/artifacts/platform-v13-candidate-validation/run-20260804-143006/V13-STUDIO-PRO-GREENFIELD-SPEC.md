# Studio Pro — Greenfield Specification (V13)

## Status
`SOURCE_MISSING_CONFIRMED` → `GREENFIELD_SPEC_READY`

No recoverable Studio Pro product tree was found (only thin staging stubs / markdown guides).
Do not claim legacy source restoration.

## Product Goal
A professional Multitrack Audio/MIDI studio for UAOS with sampler integration and musical-brain hooks.

## Required Components
- Project System
- Timeline
- Multitrack Audio
- MIDI Editing
- Global Player
- Mixer / Master Bus
- Recording
- Audio Import / MIDI Import
- Stem Export / MIDI Export
- Sampler Runtime / Library Player
- Musical Brain Integration
- Undo/Redo, Autosave, Crash Recovery
- Package Build

## Phases
0. Contracts (project format, entitlements, IPC)
1. Project and Timeline
2. Playback and Mixer
3. Audio/MIDI Editing
4. Sampler Integration
5. Musical Brain
6. Export and Packaging
7. Owner Review

## Non-Goals (Phase 0–3)
- Kontakt/DAW automation
- Hardware/USB/KORG Writer/SysEx
- Commercial pricing activation

## Implementation Rule
Build only in an isolated candidate worktree after contracts land. Do not copy code into originals automatically.