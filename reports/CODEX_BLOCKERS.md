# CODEX Blockers

Current phase: AUDIT

## Resolved Baseline Blockers

- Root `npm test` was added and passes.
- Root `npm run check` was added and passes.

## Manual Validation Blockers

- Real microphone permission and stream cleanup should be validated in target browsers.
- Real MIDI thru, mapping, and All Notes Off behavior should be validated with physical MIDI hardware.

## Tooling Blockers

- GitHub CLI follow-up is blocked in this sandbox because `gh` cannot read `C:\Users\ssare\AppData\Roaming\GitHub CLI\config.yml` (`Access is denied`).
