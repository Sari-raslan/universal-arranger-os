# Neutral Package Inspection Guide

LOCAL ONLY - OWNER REVIEW ONLY - NOT KEYBOARD-NATIVE

## Files To Inspect

- Package: `uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-002/OWNER_NEUTRAL_002.uaos-neutral.json`
- Manifest: `uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-002/MANIFEST.json`
- Checksum: `uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-002/CHECKSUMS.sha256`
- Validation: `uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-002/VALIDATION.json`

## How To Inspect JSON Safely

- Open the `.uaos-neutral.json` file as text only.
- Review labels, section names, track names, and metadata.
- Do not rename it to a keyboard extension.
- Do not transfer it to a keyboard.
- Do not mix it with legacy `.STY` files.

## Section Checklist

- Sections have clear names.
- Sections describe musical structure.
- Sections do not claim keyboard compatibility.
- Sections do not contain audio or proprietary sample content.

Acceptable: clear neutral metadata that helps plan a future arrangement.

Needs revision: unclear section names, missing order, confusing labels, or any compatibility claim.

## Track Checklist

- Tracks have readable names.
- Tracks describe roles such as drums, bass, chord, melody, or variation metadata.
- Tracks do not include audio samples.
- Tracks do not claim Kontakt, Native Instruments, or proprietary library ownership.

## Metadata Checklist

- Status says local-only / experimental / not public release.
- `keyboard_native` remains false.
- Compatibility remains unverified.
- Manifest and checksum references are present.
- Rollback notes are clear.

## Chord / Style Placeholder Checklist

- Placeholders are clearly marked as future metadata.
- Placeholders do not imply real `.STY` or `.SET` output.
- Placeholders are useful for a later safe writer design.

## Naming Checklist

- Package ID is clear.
- File name is clearly neutral.
- Labels are understandable to the owner.
- No production, public release, payment, or keyboard-transfer wording appears.

## Safety Label Checklist

- LOCAL ONLY.
- NOT PUBLIC RELEASE.
- NOT PRODUCTION.
- NOT KEYBOARD-NATIVE.
- REAL COMPATIBILITY UNVERIFIED.
- NO KEYBOARD TRANSFER.

## What Must Not Be Claimed

- Do not claim production readiness.
- Do not claim public release.
- Do not claim payment readiness.
- Do not claim real keyboard compatibility.
- Do not claim proprietary sample ownership.

## What Must Not Be Transferred To Keyboard

- `OWNER_NEUTRAL_002.uaos-neutral.json`
- Any manifest, checksum, or validation file.
- Any legacy `.STY` file.

## Revision Signals

Request a revision if sections, tracks, metadata, naming, missing fields, or labels are confusing.
