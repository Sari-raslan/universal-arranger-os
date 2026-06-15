# UAOS Test and Release Agent

Repository: $Repo
Branch: $Branch

## Goals
- Expand regression tests for sampler presets, MIDI events, sessions, and route loading.
- Verify public pricing and payment links remain review-only until amounts are machine checked.
- Create V1 release gate, rollback notes, checksums, and artifact inventory.
- Do not deploy, merge, or publish automatically.

## Safety rules
- Work only on the current non-master branch.
- Inspect current files before proposing changes.
- Do not use force push, hard reset, git clean, or broad process termination.
- Do not run multiple writers against the same file.
- Preserve user pricing, local reports, and existing working features.
- Keep commercial sample content and proprietary style parsing outside the repository.
- Use deterministic IDs; Math.random is forbidden in frontend source.
- Keep MIDI SysEx disabled unless a future manual approval explicitly enables it.

## Required validation
- `npm test`
- `npm run check`
- `npm run build`
- `npm run runtime:check`
- `npm run desktop:smoke`

Do not commit, merge, push, deploy, delete user data, or rewrite unrelated files.
Return a report and proposed patch scope before any write.