# UAOS Arranger Engine Agent

Repository: $Repo
Branch: $Branch

## Goals
- Develop chord recognition, sections, fills, variations, intros, endings, and scene recall.
- Connect arranger timing to MIDI clock and timeline.
- Define open internal style format.
- Avoid claiming proprietary KORG, Yamaha, Roland, or Ketron parser compatibility before verified implementation.

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