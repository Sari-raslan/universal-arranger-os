# Owner Neutral 003 Planning From Review

LOCAL ONLY - PLANNING ONLY - DO NOT BUILD PACKAGE YET

## Source Files Reviewed

- `uaos-ai-factory/FINAL_OWNER_REVIEW_SEAL.md`
- `uaos-ai-factory/FINAL_LOCAL_HANDOFF_START_HERE.md`
- `uaos-ai-factory/OWNER_LOCAL_PROJECT_INDEX.md`
- `uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-002/OWNER_NEUTRAL_002.uaos-neutral.json`
- `uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-002/OWNER_FEEDBACK_FORM_V2.md`
- `uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-002/HUMAN_READABLE_OWNER_SUMMARY.md`

## What owner-neutral-002 Already Has

- Package ID: `owner-neutral-002`
- Status: `EXPERIMENTAL_NEUTRAL_PACKAGE`
- Safe extension: `.uaos-neutral.json`
- Owner-only local review flags.
- Keyboard-native output flag set to `false`.
- Real keyboard compatibility marked `UNVERIFIED`.
- Five metadata-only sections.
- Three metadata-only tracks.
- Tempo, tempo range, key center, time signature, mood, style intent, and arrangement notes.
- Chord/style placeholders as planning metadata only.
- Manifest and checksum references.
- Validation fields for neutral extension, no keyboard-native payload, no audio samples, no proprietary libraries, no public release claim, and no payment claim.

## Current Review Status

The owner feedback form exists but is not filled yet. SAFE-012 therefore plans `owner-neutral-003` from the review files and existing owner-neutral-002 structure only. The actual build should wait for explicit owner approval.

## What Should Improve In owner-neutral-003

- Use clearer section names that describe arrangement function without sounding like keyboard-native patterns.
- Use clearer track names that separate musical role, metadata-only status, and instrument family hint.
- Add owner feedback reference fields so future revisions can trace why values changed.
- Add stronger safety labels directly in the package.
- Add fuller validation fields for blocked keyboard-native output, blocked transfer, blocked proprietary content, and blocked deployment/payment.
- Keep chord/style placeholders useful while clearly marking them as metadata-only planning notes.

## Better Section Names

Suggested section names for owner review:

1. `Intro - gentle setup`
2. `Main Groove - verse foundation`
3. `Lift - chorus energy`
4. `Transition - short break`
5. `Outro - safe close`

Optional future section if the owner asks for more detail:

- `Bridge - contrast idea`

All sections must remain metadata-only.

## Better Track Names

Suggested track names for owner review:

1. `Lead Line Planning Metadata`
2. `Harmony Bed Planning Metadata`
3. `Rhythm Feel Planning Metadata`

Optional future metadata-only tracks if needed:

- `Bass Motion Planning Metadata`
- `Fill / Transition Planning Metadata`

All tracks must remain metadata-only and must not include MIDI, audio, samples, or keyboard-native pattern data.

## Better Metadata Fields

Recommended metadata additions:

- `source_package_id`
- `revision_reason`
- `owner_feedback_source`
- `owner_feedback_status`
- `review_round`
- `intended_review_audience`
- `local_only`
- `keyboard_transfer_allowed`
- `real_keyboard_output_created`
- `legacy_file_usage`
- `proprietary_content_status`
- `build_approval_required`

Existing musical metadata should remain:

- Tempo.
- Tempo range.
- Key center.
- Time signature.
- Mood.
- Style intent.
- Arrangement notes.

## Chord / Style Placeholder Improvements

Keep placeholders as planning text only:

- Include section IDs.
- Keep chord text readable.
- Add `metadata_only: true` to every placeholder.
- Add `not_keyboard_pattern_data: true`.
- Add `not_style_file_content: true`.
- Add `owner_review_note` explaining that chord/style text is not `.STY` content.

Do not add real arranger pattern data, sample references, MIDI files, audio files, or legacy `.STY` material.

## Validation Field Improvements

owner-neutral-003 should validate:

- Neutral extension only.
- Package ID exists.
- Source package ID exists.
- Status exists.
- Owner-only flag is true.
- `keyboard_native` is false.
- Real keyboard compatibility is `UNVERIFIED`.
- No keyboard transfer allowed.
- No `.SET` / `.STY` / keyboard-native extension.
- No audio samples.
- No proprietary libraries.
- No Kontakt / Native Instruments content.
- No public release claim.
- No production claim.
- No payment claim.
- Manifest reference exists.
- Checksum reference exists.
- Rollback notes exist.

## Safety Labels

Required safety labels:

- `EXPERIMENTAL`
- `NEUTRAL_UAOS_PACKAGE`
- `OWNER_REVIEW_ONLY`
- `LOCAL_ONLY`
- `NOT_KEYBOARD_NATIVE`
- `NOT_PUBLIC_RELEASE`
- `NOT_PRODUCTION`
- `REAL_KEYBOARD_COMPATIBILITY_UNVERIFIED`
- `NO_KEYBOARD_TRANSFER`
- `NO_SET_STY_OUTPUT`
- `NO_PROPRIETARY_SAMPLES`
- `NO_KONTAKT_NATIVE_INSTRUMENTS_CONTENT`

## Hard Blocks

- No keyboard-native output.
- No `.SET` / `.STY`.
- No `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST`.
- No proprietary samples.
- No Kontakt / Native Instruments content.
- No push/deploy/Vercel/payment.
- No keyboard transfer.

## Required Checks Before Building owner-neutral-003

- `git status --short`
- `git remote -v`
- `node scripts/uaos-ai-factory-safety-check.mjs`
- `npm run ai:factory:check`
- `npm run ai:factory:qa-command-dashboard`
- `npm run ai:factory:writer-sandbox-check`
- `npm run ai:factory:writer-manifest-validator`
- `npm run ai:factory:neutral-metadata-check`
- `npm run ai:factory:owner-local-status-dashboard`

## Build Gate

Do not build `owner-neutral-003` until the owner explicitly approves a bounded neutral metadata build task. Even after approval, output must remain `.uaos-neutral.json` only.
