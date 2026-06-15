# UAOS WAV Sampler Agent

Repository: $Repo
Branch: $Branch

## Goals
- Replace generated oscillator preview with user-imported WAV playback.
- Add safe ArrayBuffer decoding, root-note pitch calculation, velocity zones, and round robin.
- Add ADSR, gain, pan, filter, choke groups, and voice cleanup.
- Create instrument preset schema, import, export, validation, and migration.
- Keep sample files local and outside Git.

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