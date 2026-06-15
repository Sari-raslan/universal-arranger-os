# UAOS Phase 6 Hardware Integration

Phase 6 adds a testable hardware layer for MIDI device discovery, device profile foundations, MIDI Learn, command routing, MIDI output scheduling, SysEx safety, diagnostics, and setup workflow.

## Scope

- Web MIDI discovery with permission and unsupported-browser states.
- Electron preload bridge capability contract with safe browser fallback.
- Deterministic mock devices for tests and demo mode.
- Foundation profiles for KORG PA3X Oriental, KORG PA5X, Yamaha Genos, Roland BK-9, and Ketron SD9.
- MIDI Learn for note, CC, program-change, and pitch-bend controls.
- UAOS command router for transport, arranger sections, sampler notes, sustain, expression, pitch bend, preset selection, panic, metadata-only AI triggers, mixer and record contracts.
- MIDI output engine with queueing, timestamps, rate limiting, channel routing, clock/start/continue/stop, all-notes-off, reset controllers, disconnect handling, and invalid-message protection.
- SysEx disabled by default with dry-run validation only unless explicit consent and whitelists are present.
- Session schema version 4 with hardware migration and disconnected-device fallback.

## Safety

No physical hardware validation is claimed. No proprietary arranger protocol or commercial style format support is claimed. SysEx sends are disabled by default, dry-run is on by default, and destructive firmware, factory-reset, undocumented, or memory-write workflows are blocked by policy.

## UI

The Hardware page is available at `#/hardware`. The MIDI page embeds the same hardware workstation under the existing MIDI monitor. Demo/mock mode is labelled as mock mode and does not claim a real device.

## Production State

Official status remains `CODE_READY_EXTERNAL_APPROVALS_REQUIRED`. Production activation remains false until physical hardware validation, Windows signing, Stripe/PostgreSQL/SMTP readiness, commercial/legal approvals, and explicit deployment approval are complete.
