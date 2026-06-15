# UAOS MIDI and Hardware Agent

Repository: $Repo
Branch: $Branch

## Goals
- Validate MIDI input with KORG PA3X/PA5X, Yamaha Genos, Roland BK-9, Ketron SD9, and NI S88 MK3.
- Document channel mappings, sustain, pitch bend, pressure, transport, and panic.
- Add opt-in MIDI output only after manual hardware approval.
- Keep all SysEx disabled during automatic runs.

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