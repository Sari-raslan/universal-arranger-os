# UAOS Baseline Audit

Date: 2026-06-12
Branch: `codex/uaos-v1-production`
Base: `master` at `4e32c6b`

## Build Ownership

- WORKING: Root `package.json` controls the production build.
- WORKING: Root `npm run build` executes `npm run build --prefix uaos-live-clean`.
- WORKING: `uaos-live-clean/package.json` builds the Vite React app.
- WORKING: Active compiled frontend entry is `uaos-live-clean/src/main.jsx`, which renders `uaos-live-clean/src/App.jsx`.
- UNUSED/PARTIAL: `uaos-live-clean/src/main.js` is a separate imperative app not imported by `main.jsx`; it contains useful sampler/timeline/MIDI ideas but is not the active React route app.

## Backend Ownership

- WORKING: Root `npm run dev` executes `node backend/server.js`.
- UNUSED/PARTIAL: `backend/src/server.js` exists with a larger Express app, but root scripts do not execute it.
- PARTIAL: `backend/server.js` exposes `/health`, `/api/status`, `/api/presets`, `/api/song-generate`, `/api/midi-export`, sampler map, sample import, and project save/list.
- PARTIAL: Backend has no safe CORS policy, no centralized error handler, and no explicit version endpoint.
- PARTIAL: `/api/song-generate` is deterministic pattern generation, not AI. It should be renamed or clearly documented in V1.

## Electron And Desktop Ownership

- PARTIAL: `desktop/package.json` uses `main.cjs` and `preload.cjs`.
- PARTIAL: `desktop/main.cjs` keeps `nodeIntegration: false` and `contextIsolation: true`.
- BROKEN/RISK: `desktop/main.cjs` falls back to `https://universal-arranger-os.vercel.app` if local dist is missing.
- PARTIAL: `desktop/preload.cjs` exposes only three MIDI bridge methods, but the IPC whitelist is implicit rather than enforced by a helper.
- PARTIAL: `desktop/desktopLoadPolicy.cjs` exists and has tests, but `desktop/main.cjs` does not use it.
- UNUSED/PARTIAL: `electron/main.cjs`, `electron-app/main.js`, `desktop/main.js`, and `desktop/src/main.js` are additional desktop entry candidates not used by root scripts.

## Active Routes

WORKING/PARTIAL routes preserved in `uaos-live-clean/src/App.jsx`:

- `home`: WORKING marketing/product overview.
- `sing`: PARTIAL local project name and file selection, but no real voice-to-arrangement flow.
- `studio`: PARTIAL and risky because it renders two audio engines at once.
- `pro`: PLACEHOLDER for keyboard tools and proprietary device profiles.
- `midi`: PARTIAL WebMIDI/Electron scan only; no monitor, learn, thru, panic, mappings, split, or routing.
- `sounds`: PLACEHOLDER library cards.
- `sampler`: PLACEHOLDER foundation labels.
- `promo`: WORKING static marketing text.
- `pricing`: WORKING static plan cards.
- `downloads`: PARTIAL status text only.

## Audio Engines

- PARTIAL: `AudioEngineV17.jsx` implements real microphone access, AudioContext, RMS level, autocorrelation pitch estimate, note conversion, and MediaRecorder recording.
- BROKEN/RISK: `AudioEngineV17.jsx` does not prevent duplicate streams, lacks clear permission error messages, does not enumerate/select input devices, and does not fully clean recorder/object URLs.
- PARTIAL: Recording is always blobbed as `audio/webm`; it does not select the browser-supported MIME type.
- PLACEHOLDER: `AudioEngine.jsx` only displays a future-facing statement.
- BROKEN/RISK: `Studio` renders both `AudioEngineV17` and `AudioEngine`, so more than one audio engine can appear active.

## MIDI Engines

- PARTIAL: Active React route has WebMIDI scan and Electron bridge list methods.
- PARTIAL: `uaos-live-clean/src/lib/webMidi.js` has useful support/format/summarize helpers with tests.
- PARTIAL: `uaos-live-clean/src/main.js` has monitor code, hot-plug updates, and MIDI export usage, but is not the active React app.
- UNUSED/PARTIAL: `backend/midi-bridge.js`, `backend/src/midi-*`, `midi-router`, and desktop easymidi bridge are duplicate MIDI-related areas.
- MISSING: No active V1 panic, all-notes-off, MIDI learn, mappings, split zones, transpose, output channel routing, or selected output send path in the React app.

## Source Directories

- WORKING active frontend: `uaos-live-clean/src`.
- PARTIAL active backend: `backend/server.js`.
- UNUSED by root build: `src`, `backend/src`, `chord-engine/src`, `clean-web/src`, `desktop/src`, `frontend/src`, `landing-sales/src`, `midi-router/src`, `runtime/src`, `sampler-engine/src`, `timing-engine/src`, `android/app/src`, `mobile/android/app/src`.
- PLANNED/FUTURE: `v2-runtime`, `v3-future`, and related engine directories appear to be roadmap scaffolds, not active V1 build inputs.

## Scripts

- WORKING: `npm run setup`, `npm run build`, `npm run dev`, and `npm run front` exist.
- BROKEN: root `npm test` is missing.
- BROKEN: root `npm run check` is missing.
- RISK: Many PowerShell scripts execute or mention Vercel/deploy flows. They were not run.
- RISK: Several PowerShell scripts write JavaScript source via `Set-Content` or `Out-File`, which violates the new roadmap rule for application source generation.
- RISK: `scripts/UAOS_FINAL_SEQUENTIAL_LAUNCHER.ps1`, `UAOS_V12_ONE_CLICK_ALL.ps1`, and similar scripts generate app/runtime JS and should not be used for roadmap source changes.

## Tests And CI

- WORKING: Direct `node --test tests/*.test.js tests/*.test.cjs` passes 24 tests.
- BROKEN: Root `npm test` has no script.
- PARTIAL: Existing tests cover sampler map, style timeline, WebMIDI helpers, explorer state, backend analyzer, and desktop load policy.
- PARTIAL: CI has a simple validation workflow and a build workflow for `master/main`.
- RISK: `.github/workflows/pages.yml` deploys GitHub Pages on `master` pushes. This work did not trigger or modify deployment.

## Placeholder, Fake, Or Random Functionality

- PLACEHOLDER: Sounds, sampler, pro keyboard profile cards, and `AudioEngine.jsx` future text.
- PARTIAL: Backend pattern generation is deterministic and not random, but names like `song-generate` can imply AI generation.
- RISK: `backend/src/event-bus.js` uses `Math.random()` for event IDs in unused backend source.
- RISK: `backend/src/omr/routes.js` uses `Math.random()` for filenames in an unused OMR route.
- OK: Active `uaos-live-clean` does not use random fake meters; audio level is derived from microphone samples.

## Storage Formats

- PARTIAL: Active React `Sing` stores only `uaos_project_name`.
- PARTIAL: Inactive `uaos-live-clean/src/main.js` stores `uaos.settings` and exports a JSON project blob.
- PARTIAL: Backend stores sample maps and projects in JSON files under `backend/data`.
- MISSING: No active schema-versioned session/project import validation in the React app.

## Baseline Command Results

- PASS: `npm run build`.
- FAIL: `npm test` because the root script is missing.
- PASS: `node --test tests/*.test.js tests/*.test.cjs` with 24 passing tests.

## V1 Entry Criteria

Phase 0 is complete. V1 must start by adding root `test` and `check` commands, replacing duplicate audio-engine rendering, modularizing the active React app, adding honest status labels, and hardening Electron/backend behavior without running any deploy command.
