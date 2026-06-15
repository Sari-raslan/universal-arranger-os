# CODEX Blockers

Current phase: HARDENING

## Resolved Baseline Blockers

- Root `npm test` was added and passes.
- Root `npm run check` was added and passes.

## Manual Validation Blockers

- Real microphone permission and stream cleanup should be validated in target browsers.
- Real MIDI thru, mapping, and All Notes Off behavior should be validated with physical MIDI hardware.

## Tooling Blockers

- GitHub CLI follow-up is blocked in this sandbox because `gh` cannot read `C:\Users\ssare\AppData\Roaming\GitHub CLI\config.yml` (`Access is denied`).

## Electron Update Validation

- Automatic updater network checks require a packaged signed build with the intended update provider configured.

## Post-Merge Validation Blockers

- `npm ci --prefix uaos-live-clean` is blocked by Windows `EPERM` while unlinking `uaos-live-clean/node_modules/@rolldown/.binding-win32-x64-msvc-XggE4oWY/rolldown-binding.win32-x64-msvc.node`. Root `npm ci` and backend `npm ci` passed after using a workspace npm cache and low socket count.
