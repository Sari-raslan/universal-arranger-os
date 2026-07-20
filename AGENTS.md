# Keyboard Manager — AI Development Instructions

You are building Keyboard Manager.

Do not ask more questions. Work carefully and continue improving the app.

Goal:
Build a real arranger keyboard file manager and reader, similar in concept to PA editor tools, but as our own app.

Important:
Do not download copyrighted keyboard files or proprietary commercial content.
Use only user-provided files in /samples and safe public/open documentation.
If a format is proprietary, build safe readers, metadata extraction, hex/ASCII inspection, and adapter interfaces.

App name:
Keyboard Manager

Required stack:
- React + Vite frontend
- Node + Express backend

Main folders:
- backend
- frontend
- samples
- docs
- ai-tasks

Required features:
1. Read and inspect these files:
   - .mid
   - .midi
   - .syx
   - .sty
   - .set
   - .pcg
   - .kst
   - .pad
   - .prs
   - .all
   - .bkp
   - .pkg
   - unknown binary formats

2. MIDI parser:
   - validate MThd header
   - read format
   - read track count
   - read PPQ/division
   - count notes
   - count controllers
   - count program changes
   - count tempo events
   - count SysEx events

3. SysEx parser:
   - detect F0/F7
   - count blocks
   - detect manufacturer byte
   - show raw hex safely

4. Arranger parser:
   - detect possible brand:
     Korg, Yamaha, Roland, Ketron, unknown
   - safely inspect binary data
   - extract strings if possible
   - extract metadata
   - never crash
   - mark deep parser needed when format is proprietary

5. USB MIDI:
   - use Web MIDI API
   - detect inputs
   - detect outputs
   - show live note/controller/program messages

6. UI:
   - dashboard
   - upload screen
   - library screen
   - MIDI monitor
   - analysis viewer
   - export JSON button
   - beautiful modern interface
   - Arabic/English friendly labels

7. Backend API:
   - GET /api/status
   - POST /api/upload
   - GET /api/library
   - GET /api/library/:id
   - GET /api/export/:id
   - DELETE /api/library/:id

8. Quality:
   - robust error handling
   - no fake claims
   - no crash on unknown files
   - lightweight
   - fast
   - clear code comments
   - build and run locally

Commands that must work:
Backend:
cd backend
npm install
npm start

Frontend:
cd frontend
npm install
npm run dev

Use the real sample file if present:
C:\Users\ssare\Desktop\sar.SET

If that file exists, copy it into:
samples\Korg\sar.SET

Then analyze it and create:
docs\sar-set-analysis.json
docs\sar-set-notes.md

Keep improving until the local MVP runs.
## Codex Autonomous Roadmap Rules

- Current roadmap: UAOS V1 Production Foundation, V2 Professional Arranger, V3 AI Arranger Labs.
- Use stacked branches and never merge to `master` automatically.
- Never deploy, run Vercel commands, run `UAOS_SAFE_TURBO.ps1`, force-push, or modify production aliases.
- Before resuming, read `reports/CODEX_MASTER_STATE.json`, inspect git status, and continue from `nextTask`.
- Update `reports/CODEX_MASTER_STATE.json`, `reports/CODEX_BLOCKERS.md`, and `reports/CODEX_CHANGELOG.md` after each completed task group.
- Keep PowerShell as orchestration only; application source belongs in JS, JSX, CSS, JSON, tests, and docs.
- Preserve current public routes and label incomplete features honestly.

## UAOS AI Factory Operating Constitution

UAOS is currently prototype, demo, and staging oriented. The AI Factory exists to make future AI-assisted development safer, smaller, and easier to review.

1. AI worker roles: product manager, architect, frontend worker, music-engine worker, library worker, QA worker, reviewer, cost guard, and release manager. Each role must work from an approved issue with defined scope, allowed files, blocked files, expected output, safety level, and cost risk.
2. No deploy, no payment, and no real writer rules: AI workers must not deploy, activate payment flows, publish releases, enable real keyboard output, or enable real keyboard export. Real keyboard writer/export and public release require explicit approval.
3. Branch/PR-only workflow: future AI workers must use issues, branches, and pull requests. Direct commits to `master` or `main` are not the operating model.
4. Cost-control rules: the user has invested significant self-work already, so protect credits and compute. Avoid broad scans, repeated builds, loops, large generated archives, sample/audio library scans, and speculative background work.
5. Vercel preview-only rule: Vercel may only be considered for preview workflows after explicit approval. No production deployment or production alias change is allowed.
6. Linear/GitHub issue workflow: Linear requests should become GitHub issues before implementation. The issue must state scope, allowed files, blocked files, build requirements, expected output, safety level, and cost risk.
7. Code X / Codex role: Code X / Codex is a senior engineer for scoped implementation, review, and safety validation. It is not an always-running worker.
8. Future agent rule: Copilot, OpenHands, and future agents must operate through issues and PRs, with the same safety gates and cost-control rules.
9. No automatic merge: no AI worker may automatically merge to `master` or `main`.
10. Stop condition: stop at the first serious FAIL, report the cause, and propose the next smallest safe task.

Proprietary arranger formats must be handled with safe readers, metadata extraction, hex/ASCII inspection, and adapter interfaces only. Premium library work is metadata, QA, and provenance first, not copied audio samples or unverified commercial claims.

## Cursor Cloud specific instructions

Scope for local dev/testing is the **Keyboard Manager** product = two services: the Express backend (`backend/`) and the Vite frontend (`frontend/`). Node 22 is used. Dependencies are installed per-directory (`backend/` and `frontend/`); the startup update script already runs `npm install` in both.

Run commands (already documented in the root `AGENTS.md` header and `package.json`):
- Backend: `cd backend && npm start` (Express `server.js`).
- Frontend: `cd frontend && npm run dev` (Vite, serves on `5173`, bound to `0.0.0.0`).

Non-obvious gotchas:
- The backend listens on **port 5199 by default** (`process.env.PORT || 5199`), but every frontend service module in `frontend/src/services/*` and `KeyboardManagerApp.jsx` defaults its API base to **`http://localhost:3001`**. To exercise backend-backed frontend code, start the backend with `PORT=3001 npm start` (its CORS allow-list already permits the `:5173` dev origin), or point the frontend at 5199 via a `frontend/.env` (`VITE_API_BASE` / `VITE_API_URL`). CORS only allows origins on ports 5173/5180/5199.
- The frontend actually rendered by `frontend/src/main.jsx` is `App.jsx` (a self-contained "UAOS Owner Review Console" that does client-side arranger generation/exports and does **not** call the backend). `KeyboardManagerApp.jsx` is the backend-driven UI but is **not** wired into `main.jsx` and imports `lucide-react`, which is not in `frontend/package.json` — importing it as-is will fail until that dep is added and it is mounted.
- Do NOT use the root `npm run setup`/`build`/`front`/`dev` scripts: they target a `uaos-live-clean/` directory that does not exist in this repo and will fail. Install and run inside `backend/` and `frontend/` directly.
- Tests: root uses `node --test` (`npm test`). Install `backend/` deps first (tests resolve `express` from `backend/node_modules`). ~16 tests fail out of ~283; these are pre-existing and assert against the missing `uaos-live-clean` frontend structure (routes/pages that don't exist here), not an environment problem. The backend API/parser/export tests pass.
- There is no ESLint config or lint script in `backend/`, `frontend/`, or root.
- A real Korg arranger set lives at `samples/Korg/sar.SET` (~260MB, 147 files) and is used by the library/analysis endpoints and tests; the backend inspects it safely (brand detection + metadata only, no decoding).
