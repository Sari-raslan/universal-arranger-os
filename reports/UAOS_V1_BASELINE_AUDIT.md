# UAOS V1 Baseline Audit

Date: 2026-06-12
Branch: `codex/uaos-v1-completion`

## Active Build Target

- Root `package.json` script `build` runs `npm run build --prefix uaos-live-clean`.
- `uaos-live-clean/package.json` builds a Vite React app with `vite build`.
- `uaos-live-clean/vite.config.js` uses `@vitejs/plugin-react` and `base: "./"`.
- The active application entry is `uaos-live-clean/src/main.jsx`, rendering `uaos-live-clean/src/App.jsx`.

## Source Trees Observed

- Active V1 app: `uaos-live-clean/src`.
- Other source trees present but not used by the root build: `src`, `backend/src`, `chord-engine/src`, `clean-web/src`, `desktop/src`, `frontend/src`, `landing-sales/src`, `midi-router/src`, `runtime/src`, `sampler-engine/src`, `timing-engine/src`.
- Android and mobile native source trees are present but outside the active Vite build.

## Active Frontend State

- Existing public routes in `uaos-live-clean/src/App.jsx`: home, sing, studio, pro, midi, sounds, sampler, promo, pricing, downloads.
- `Studio` rendered two audio engine components at once: `AudioEngineV17` and `AudioEngine`.
- `AudioEngine.jsx` was a placeholder/status component.
- `AudioEngineV17.jsx` contained real microphone, meter, pitch estimate, and MediaRecorder code, but used a local autocorrelation implementation and had limited lifecycle/error handling.
- UI contained placeholder/fake wording in several places and did not clearly mark planned or experimental features.

## Electron Files

- `electron/main.cjs` exists and opens `process.env.UAOS_DESKTOP_URL || "http://localhost:5173"`.
- `desktop/main.cjs`, `desktop/main.js`, and `desktop/preload.cjs` also exist.
- Current active root package scripts do not launch Electron directly.

## Backend Files

- Root `dev` runs `node backend/server.js`.
- `backend/server.js` exposes health/status/preset/project/sampler endpoints and MIDI export helpers.
- `backend/src/server.js` also exists but is not used by the root `dev` script.

## Scripts And Deployment Risk

- Many PowerShell scripts are present, including scripts that mention or execute Vercel/deploy flows.
- V1 work must avoid running deploy, Vercel, production alias, or push commands.
- Root `master` script points to `scripts/UAOS_MASTER_REMAINING_ALL_IN_ONE.ps1`; it was not run.

## Build And Test Baseline

- First build attempt before dependency install failed because `vite` was not installed in `uaos-live-clean/node_modules`.
- `npm run setup` installed backend and `uaos-live-clean` dependencies successfully with no reported vulnerabilities.
- `npm run build` then succeeded.
- No root `npm test` or `npm run check` command existed at baseline.

## Baseline Risks

- Multiple frontend/source directories can confuse ownership; root build confirms `uaos-live-clean` is the active V1 target.
- UI presented some planned items as if complete.
- MIDI behavior required browser support or Electron bridge and had limited monitoring/control mapping.
- Audio code needed stricter cleanup and single-engine ownership.
- Backend status wording used broader product claims than a V1 development backend should.
