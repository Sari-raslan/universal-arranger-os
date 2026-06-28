# QA Command Matrix

Planned commands and when allowed:

- `node scripts/uaos-ai-factory-safety-check.mjs`: always allowed for AI Factory changes.
- `npm run ai:factory:check`: always allowed for AI Factory changes.
- `npm run ai:factory:cost`: always allowed before expensive work.
- `npm run ai:factory:status`: allowed for local state review.
- `npm run ai:factory:next`: allowed to refresh the next task note.
- `npm run ai:factory:daily`: allowed to refresh local reporting.
- `npm run ai:factory:packet`: allowed for dry-run packet generation.
- `npm run ai:factory:review`: allowed for dry-run review preview.
- `npm run ai:factory:dry-run`: allowed for local dry-run only.
- `npm run ai:factory:identity`: allowed after platform identity changes.
- `npm run ai:factory:vercel-plan`: allowed after Vercel planning changes.
- `npm run ai:factory:linear-plan`: allowed after Linear planning changes.
- `npm run ai:factory:github-plan`: allowed after GitHub planning changes.
- `npm run ai:factory:copilot-plan`: allowed after Copilot planning changes.
- `npm test --if-present`: allowed when tests are relevant or package/test files changed.
- `npm run build --prefix uaos-live-clean`: controlled future check only when UI/build changes happen.

Build is controlled, not automatic for every planning task.

