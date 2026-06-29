# AI-018 First Bounded Agent Packet

Status: READY_LOCAL_ONLY

Selected task: Agent A - project docs consolidation.

## Scope

Consolidate project docs, AI Factory plans, local reports, and handoff notes into one local report. Keep the work limited to docs, plans, reports, and factory metadata.

## Allowed

- `docs/**/*.md`
- `reports/**/*.md`
- `uaos-ai-factory/**/*.md`
- `uaos-ai-factory/**/*.json`

## Forbidden

- No app source changes.
- No `uaos-live-clean/src/App.jsx`.
- No `uaos-live-clean/src/**`.
- No backend feature changes.
- No deploy folder changes.
- No proprietary assets.
- No sample library copying.
- No production release.
- No hosting publication.
- No Vercel execution.
- No payment or paid-flow work.
- No real keyboard writer/export.
- No external automation.

## Stop Condition

Stop after creating `uaos-ai-factory/agents/reports/AGENT_A_PROJECT_DOCS_CONSOLIDATION_REPORT.md` and running the requested local checks.

## Commit Rule

A local commit is allowed only after checks pass. External automation remains blocked.
