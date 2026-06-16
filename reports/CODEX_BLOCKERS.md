# CODEX Blockers

Current phase: HARDENING

## Resolved Baseline Blockers

- Root `npm test` was added and passes.
- Root `npm run check` was added and passes.
- V1 UI architecture rebuild is complete and passes local build/test validation.
- Canonical home routing is now on `ModernHome.jsx` and passes final local validation.
- Backend runtime integration now has a canonical local API client, live health reporting, and service map documentation.
- The backend `src` tree now declares ESM semantics explicitly, removing the Node typeless-package warning during test runs.
- The local runtime host at `http://127.0.0.1:5199/` now returns HTTP 200 and serves the UI fallback shell when the built frontend is present.
- Backend project persistence now sanitizes IDs, names, descriptions, timelines, sessions, and metadata before save/update/duplicate flows.
- MIDI monitor and Web MIDI hook now degrade safely when `navigator`, WebMIDI, or localStorage are unavailable.

## Manual Validation Blockers

- Real microphone permission and stream cleanup should be validated in target browsers.
- Real MIDI thru, mapping, and All Notes Off behavior should be validated with physical MIDI hardware.

## Tooling Blockers

- GitHub CLI follow-up is blocked in this sandbox because `gh` cannot read `C:\Users\ssare\AppData\Roaming\GitHub CLI\config.yml` (`Access is denied`).

## Electron Update Validation

- Automatic updater network checks require a packaged signed build with the intended update provider configured.

## Post-Merge Validation Blockers

- `npm ci --prefix uaos-live-clean` is blocked by Windows `EPERM` while unlinking `uaos-live-clean/node_modules/@rolldown/.binding-win32-x64-msvc-XggE4oWY/rolldown-binding.win32-x64-msvc.node`. Root `npm ci` and backend `npm ci` passed after using a workspace npm cache and low socket count.
