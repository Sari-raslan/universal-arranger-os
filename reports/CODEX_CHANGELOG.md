# CODEX Changelog

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
