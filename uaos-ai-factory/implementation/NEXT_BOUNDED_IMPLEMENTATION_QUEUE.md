# UAOS Next Bounded Implementation Queue

Status: READY_LOCAL_ONLY

Mode: LOCAL ONLY

Purpose: turn completed AI Factory and bounded agent planning into a small, executable local task board for future development steps without changing app source code yet.

## Safety Gates

- No push.
- No deploy.
- No Vercel execution.
- No external automation.
- No App.jsx changes.
- No frontend source changes.
- No app source changes.
- No payment flows.
- No production release files.
- No real keyboard writer/export.
- No real `.STY`, `.SET`, `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST` files.
- No Kontakt, Native Instruments, sample library, audio asset, or proprietary content copying.

## Task Board

### IMPL-001 - Owner Dashboard / README Polish

- Status: READY.
- Risk level: LOW.
- Goal: polish owner-facing docs/index wording and make the local status easier to review.
- Allowed paths: `uaos-ai-factory/**/*.md`, `uaos-ai-factory/**/*.json`, `docs/**/*.md`, `reports/**/*.md`.
- Forbidden paths: `uaos-live-clean/src/App.jsx`, `uaos-live-clean/src/**`, `backend/**`, `deploy/**`, `.git/**`, `node_modules/**`, `samples/**`, `audio/**`.
- Stop condition: stop after one local report and requested checks.
- Expected report path: `uaos-ai-factory/implementation/reports/IMPL-001_OWNER_DASHBOARD_README_POLISH_REPORT.md`.
- Commit allowed: YES, local only after checks pass.
- Owner approval required: NO.

### IMPL-002 - Demo Gateway Link Validation

- Status: PLANNED.
- Risk level: LOW.
- Goal: validate documented local/static demo gateway links against existing local notes and screenshot maps.
- Allowed paths: `uaos-ai-factory/**/*.md`, `uaos-ai-factory/**/*.json`, `docs/**/*.md`, `reports/**/*.md`.
- Forbidden paths: `deploy/**`, `uaos-live-clean/src/App.jsx`, `uaos-live-clean/src/**`, `backend/**`, `.vercel/**`, `.git/**`, `node_modules/**`.
- Stop condition: stop after a local validation report; do not edit hosting config or run deployment tooling.
- Expected report path: `uaos-ai-factory/implementation/reports/IMPL-002_DEMO_GATEWAY_LINK_VALIDATION_REPORT.md`.
- Commit allowed: YES, local only after checks pass.
- Owner approval required: NO for documentation validation; YES before any gateway/config change.

### IMPL-003 - Presentation Send Pack Assembly

- Status: PLANNED.
- Risk level: LOW.
- Goal: assemble a local checklist of PDF/PPT/deck/screenshot references for Jobcenter/supporter review.
- Allowed paths: `uaos-ai-factory/**/*.md`, `uaos-ai-factory/**/*.json`, `docs/**/*.md`, `reports/**/*.md`.
- Forbidden paths: `uaos-live-clean/src/App.jsx`, `uaos-live-clean/src/**`, `backend/**`, `deploy/**`, `.git/**`, `node_modules/**`, `samples/**`, `audio/**`.
- Stop condition: stop after local send-pack index and report; do not send anything externally.
- Expected report path: `uaos-ai-factory/implementation/reports/IMPL-003_PRESENTATION_SEND_PACK_ASSEMBLY_REPORT.md`.
- Commit allowed: YES, local only after checks pass.
- Owner approval required: NO for local assembly; YES before sending.

### IMPL-004 - QA Command Dashboard Improvement

- Status: PLANNED.
- Risk level: MEDIUM.
- Goal: improve local QA command visibility with scripts/docs only, preserving all safety gates.
- Allowed paths: `scripts/uaos-ai-factory-*.mjs`, `package.json`, `uaos-ai-factory/**/*.md`, `uaos-ai-factory/**/*.json`.
- Forbidden paths: `uaos-live-clean/src/App.jsx`, `uaos-live-clean/src/**`, `backend/**`, `deploy/**`, `.vercel/**`, `.git/**`, `node_modules/**`, `samples/**`, `audio/**`.
- Stop condition: stop after one script/docs improvement and local report; no deploy, Vercel, payment, writer/export, or external automation behavior.
- Expected report path: `uaos-ai-factory/implementation/reports/IMPL-004_QA_COMMAND_DASHBOARD_IMPROVEMENT_REPORT.md`.
- Commit allowed: YES, local only after checks pass.
- Owner approval required: YES before package script changes; NO for docs-only planning.

### IMPL-005 - App UI Implementation Proposal Only

- Status: BLOCKED_PENDING_OWNER_APPROVAL.
- Risk level: MEDIUM.
- Goal: write a proposal for future app UI implementation without editing App.jsx or frontend source.
- Allowed paths: `uaos-ai-factory/**/*.md`, `uaos-ai-factory/**/*.json`, `docs/**/*.md`, `reports/**/*.md`.
- Forbidden paths: `uaos-live-clean/src/App.jsx`, `uaos-live-clean/src/**`, `backend/**`, `deploy/**`, `.git/**`, `node_modules/**`.
- Stop condition: stop after proposal and report; owner approval is required before any App.jsx or frontend source work.
- Expected report path: `uaos-ai-factory/implementation/reports/IMPL-005_APP_UI_IMPLEMENTATION_PROPOSAL_REPORT.md`.
- Commit allowed: YES for proposal/docs only after checks pass.
- Owner approval required: YES.

## Next Ready Task

IMPL-001 is the next safe local task.

Ready for external automation: NO.
