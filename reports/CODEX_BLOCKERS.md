# CODEX Blockers

Current phase: HARDENING

## Resolved Baseline Blockers

- Root `npm test` was added and passes.
- Root `npm run check` was added and passes.

## Manual Validation Blockers

- Real microphone permission and stream cleanup should be validated in target browsers.
- Real MIDI thru, mapping, and All Notes Off behavior should be validated with physical MIDI hardware.

## Electron Update Validation

- Automatic updater network checks require a packaged signed build with the intended update provider configured.
