# CODEX Changelog

## 2026-06-16 (backend/runtime hardening)

- Hardened backend project persistence with ID, name, description, session, timeline, and metadata sanitization before save/update/duplicate flows.
- Added safe Web MIDI and local storage guards so the MIDI monitor and hook degrade to a clear unavailable state when browser APIs are missing.
- Added deterministic tests for backend project sanitization and MIDI environment fallbacks.
- Revalidated the edited code with `node --test tests/backend-export.test.mjs tests/backend-project-safety.test.mjs tests/midi-environment.test.mjs tests/web-midi.test.js tests/status-api.test.mjs` and `cmd /c npm run build --prefix uaos-live-clean`.

## 2026-06-16

- Added a canonical local backend client in `uaos-live-clean/src/lib/uaosApiClient.js` and routed the runtime diagnostics panels through it.
- Rebuilt `backend/server.js` into the live local API for health, service discovery, uploads, library analysis, exports, sampler maps, and safe project CRUD.
- Added a deterministic backend contract test covering health, status, library inspection, MIDI upload, and project lifecycle flow.
- Added a backend-hosted UI fallback on `http://127.0.0.1:5199/` and a regression test for the root 200 response.
- Declared `backend/src` as ESM to remove the Node module-type warning during backend test runs.
- Wrote the backend architecture service map at `agent-work/backend-integration-20260616-072409/reports/BACKEND_ARCHITECTURE.md`.
- Generated the `sar.SET` analysis artifacts in `docs/sar-set-analysis.json` and `docs/sar-set-notes.md`.
- Verified `cmd /c npm run build`, `cmd /c npm test`, `cmd /c npm run check`, and direct HTTP 200 probes against `http://127.0.0.1:5199/`, `http://127.0.0.1:5199/health`, and `http://127.0.0.1:5199/api/status`.

## 2026-06-14

- Hardened the root Electron automatic update engine with `electron-updater`, optional updater loading, packaged-only activation, manual download/install defaults, rate-limited checks, and runtime logging.
- Pinned Windows package/dist scripts to `--publish never` to avoid accidental release publishing from local build commands.
- Added updater policy and no-publish regression tests.
- Verified `node --test tests/electron-update-engine.test.mjs`, `npm run check`, and `npm run desktop:smoke`.

## 2026-06-12

- Initialized autonomous V1-V2-V3 roadmap state files.
- Started Phase 0 repository audit on `codex/uaos-v1-production`.
- Completed Phase 0 baseline audit in `reports/UAOS_BASELINE_AUDIT.md`.
- Verified baseline `npm run build` passes.
- Verified direct baseline tests pass with `node --test tests/*.test.js tests/*.test.cjs`.
- Recorded that root `npm test` and `npm run check` are missing at baseline.
- Started V1 and added the runtime core, audio/MIDI/timeline/session/arranger modules, and real feature panels in the active React app.
- Verified `npm run build` after the V1 runtime core and UI panels.
- Hardened backend and Electron V1 behavior, added static check, desktop smoke, and V1 tests.
- Expanded `npm test` to include both baseline tests and V1 tests.
- Verified `npm run check`, `npm run build`, and `npm run desktop:smoke`.
- Added V1 final report, manual test plan, and event bus / route smoke tests.
- Restored the `promo` route after route smoke test caught the regression.
- Passed V1 quality gate: `npm run check`, `npm test`, `npm run build`, `npm run desktop:smoke`, and `scripts/UAOS_V1_VALIDATE_NO_DEPLOY.ps1 -SkipInstall`.
- Created stacked V2 branch `codex/uaos-v2-pro-arranger`.
- Added V2 timing, nine-lane arranger, pattern editor, chord recognition, song/setlist, device profile, mixer, and desktop project store modules.
- Integrated a Professional Arranger panel into the Pro route.
- Verified V1 gates still pass with V2 tests: `npm run check`, `npm run build`, and `npm run desktop:smoke`.
- Added V2 pattern playback events, V2 architecture docs, pattern/device formats, desktop runbook, manual hardware tests, and V2 final report.
- Created stacked V3 branch `codex/uaos-v3-ai-labs`.
- Added experimental AI analysis, voice-to-MIDI, planner, rule-based generator, rhythm, evaluation, services, policy docs, V3 docs, and AI Labs route.
- Verified V1 and V2 gates still pass with V3 tests: `npm run check` and `npm run build`.
- Added master completion report, complete architecture, release sequence, and remaining hardware/research test documentation.

## 2026-06-15

- Repaired PR #29 CI validation failures locally.
- Replaced remaining `Math.random` ID fallbacks with standards-based UUID generation and deterministic monotonic fallback IDs.
- Added root `nodemailer` dependency and lock metadata for production SMTP imports.
- Restored V7 session migration state across sampler, library, recording, AI, hardware, DAW, cloud, and beta modules.
- Restored AccountShell mounting, AI Studio UI contract labels, and Electron preload MIDI bridge handlers.
- Verified `node scripts/uaos-static-check.mjs`, `node --test tests/production-integrations.test.mjs`, `npm run check`, `npm test`, `npm run build`, `npm run runtime:check`, `npm run desktop:smoke`, `node --check backend/server.js`, dist existence, secret diff scan, and `git diff --check`.

## 2026-06-16 (frontend rebuild)

- Rebuilt the V1 desktop shell around a four-card home architecture with dedicated Create, Perform, Library, Projects, and Settings pages.
- Preserved the existing feature routes and panels for Sing, Studio, Audio, Sampler, MIDI, Hardware, Arranger, Pro Arranger, Sound Library, Sessions, Timeline, Diagnostics, Pricing, Downloads, Support, Privacy, Terms, Contact, Academy, and Release Status.
- Added hash-routing continue/back behavior for browser and Electron usage, while keeping the app local-first and without enabling payments.
- Cleaned visible UTF-8 mojibake in shared UI surfaces and revalidated the frontend with `cmd /c npm run build --prefix uaos-live-clean` and `cmd /c npm run check`.
- Promoted `ModernHome.jsx` to the canonical `#/home` surface, removed dead duplicate home/probe files, tightened Home/Back fallback behavior, and enforced shared focus/overflow/reduced-motion rules.
- Verified the final frontend state with `cmd /c npm run check` and `cmd /c npm run build`.
