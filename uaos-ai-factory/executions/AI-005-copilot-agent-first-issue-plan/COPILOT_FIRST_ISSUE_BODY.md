# Ready-To-Copy GitHub Issue Body

Title: AI-005A: Add AI Factory status summary page/data file for local dashboard planning

## Context

UAOS AI Factory is local-only and safety-gated. This first Copilot-ready task should create a small status summary artifact for future dashboard planning without changing app core logic.

## Scope

Create or update a local AI Factory status summary data file or planning note.

## Allowed Files

- `uaos-ai-factory/**/*.md`
- `uaos-ai-factory/**/*.json`
- `uaos-ai-factory/reports/*.md`

## Forbidden Files

- `uaos-live-clean/src/App.jsx`
- `.git/**`
- `node_modules/**`
- `dist/**`
- `build/**`
- `samples/**`
- `audio/**`
- payment files
- deployment files

## Commands Allowed

- `npm run ai:factory:check`
- `npm run ai:factory:cost`
- `npm run ai:factory:status`

## Commands Forbidden

- `git push`
- `gh`
- `vercel`
- build commands unless separately approved
- deploy commands

## Acceptance Criteria

- A local AI Factory status summary artifact exists.
- Status remains prototype/demo/staging oriented.
- No app core logic is changed.
- Safety and cost checks pass.
- PR includes files touched, commands run, and cost-risk note.

## Safety Checklist

- [ ] No deploy
- [ ] No payment
- [ ] No real writer
- [ ] No real keyboard export
- [ ] No proprietary samples
- [ ] No false premium claims
- [ ] No App.jsx changes
- [ ] No automerge

## Cost Risk

LOW.

## Expected PR Output

One scoped branch and one PR with the status summary artifact and validation notes.

## Stop Conditions

- Stop if task needs app core changes.
- Stop if checks fail after one attempt.
- Stop if external account/API access is needed.
- Stop if scope expands beyond local docs/status files.

