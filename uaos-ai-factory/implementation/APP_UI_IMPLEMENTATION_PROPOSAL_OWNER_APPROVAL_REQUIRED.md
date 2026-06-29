# App UI Implementation Proposal - Owner Approval Required

Status: PROPOSAL_ONLY

Mode: LOCAL ONLY

No implementation is included in this proposal. App.jsx and frontend source remain blocked.

## Exact UI Goal

Create a small owner-facing UI panel inside the existing app later that shows:

- Local project status.
- AI Factory freeze status.
- Bounded agents completion status.
- Implementation queue status.
- Safe next task.
- Blocked gates: no push, no deploy, no Vercel, no payment, no real keyboard writer/export.

The UI goal is a small status/dashboard improvement only. It must not add production release behavior, payment behavior, export behavior, deployment behavior, external automation, or public URL behavior.

## Why App.jsx Is Currently Blocked

`uaos-live-clean/src/App.jsx` is currently blocked because all previous work was planning, documentation, safety, and queue preparation only. The project has not yet received explicit owner approval to change frontend source.

App.jsx is also high-impact because it can alter the visible product experience. A later implementation must be bounded, backed up, checked locally, and reversible.

## Proposed Smallest Safe UI Change Later

For IMPL-006, the smallest safe change would be:

- Add one compact local status panel.
- Use static text/data only.
- No network calls.
- No backend calls.
- No payment UI.
- No export buttons.
- No deploy/Vercel behavior.
- No external automation controls.
- No route restructuring unless explicitly approved.

Suggested panel title:

`Local Project Status`

Suggested panel states:

- `FINAL_LOCAL_FACTORY_FREEZE`
- `BOUNDED_LOCAL_AGENTS_COMPLETE`
- `READY_LOCAL_ONLY`
- `EXTERNAL_AUTOMATION_BLOCKED`

## Files That Would Need Owner Approval

Owner approval is required before touching:

- `uaos-live-clean/src/App.jsx`
- Any file under `uaos-live-clean/src/**`
- Any app source file that changes UI behavior
- Any package/build configuration connected to the frontend

No such files are changed by IMPL-005.

## Expected Backup Requirement

Before IMPL-006 touches App.jsx, create a local backup note that records:

- Current HEAD commit.
- Current `git status --short`.
- Exact files planned for edit.
- Owner approval phrase.
- Rollback plan.

Do not use destructive rollback commands. If rollback is needed, create a normal corrective local commit or ask the owner for explicit instructions.

## Expected Build / Check Commands

Expected local checks for a later approved IMPL-006:

- `node scripts/uaos-ai-factory-safety-check.mjs`
- `npm run ai:factory:check`
- `npm run ai:factory:agent-queue-check`
- `npm run ai:factory:qa-command-dashboard`
- A local frontend build/check command only if already available and owner-approved for that implementation run.

No deploy, Vercel, push, payment, or writer/export command may be run.

## Rollback Plan

If the later UI change fails checks:

1. Stop immediately.
2. Do not push.
3. Do not deploy.
4. Do not run Vercel.
5. Document the failure in the implementation report.
6. Restore by a normal local edit or corrective local commit only after owner approval.
7. Keep the previous known-good commit reference in the report.

## Safety Gates

- No App.jsx work without owner approval.
- No frontend source work without owner approval.
- No push.
- No deploy.
- No Vercel.
- No payment.
- No production release.
- No real keyboard writer/export.
- No real `.STY`, `.SET`, `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST` files.
- No Kontakt, Native Instruments, sample library, audio asset, or proprietary content copying.
- No external automation.

## Forbidden Claims

Do not claim:

- Public launch.
- Production readiness.
- Live customer use.
- Payment readiness.
- Public URL availability.
- GitHub transfer completion.
- Vercel deployment.
- External automation approval.
- Real keyboard writer/export readiness.
- Proprietary sample/library ownership.

## Required Owner Approval Phrase

Before any App.jsx or frontend source work, the owner must provide this exact phrase:

`I approve bounded App.jsx UI implementation for IMPL-006 local-only, with backup, build check, no push, no deploy, no Vercel, no payment, no real keyboard writer/export.`

Without that exact phrase, IMPL-006 must remain blocked.
