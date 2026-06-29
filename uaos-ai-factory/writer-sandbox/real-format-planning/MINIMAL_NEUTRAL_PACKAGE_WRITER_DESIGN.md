# IMPL-023 Minimal Neutral Package Writer Design

LOCAL ONLY - DESIGN ONLY - NO REAL KEYBOARD OUTPUT

## Neutral Package Purpose

The neutral UAOS package is a safe, readable, local-only metadata container for owner review and future conversion planning. It is intended to describe musical structure and project metadata without pretending to be a KORG, Yamaha, or other keyboard-native file.

## Proposed Safe Extension

`.uaos-neutral.json`

## Why It Is Not A Keyboard-Native File

`.uaos-neutral.json` is JSON metadata. It is not a `.SET`, `.STY`, `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST` file. It is not expected to load on a real keyboard and does not claim real keyboard compatibility.

## Required Fields

- `package_id`
- `status`
- `owner_only`
- `not_public_release`
- `not_production`
- `compatibility_status`
- `tracks`
- `sections`
- `metadata`
- `manifest_ref`
- `checksum_ref`
- `rollback_notes`

## Allowed Metadata

Allowed:

- Track names.
- Section names.
- Tempo metadata.
- Key/signature metadata.
- Arrangement order.
- Instrument category labels.
- Owner notes.
- Manifest/checksum references.

Blocked:

- Audio samples.
- Proprietary libraries.
- Kontakt content.
- Native Instruments content.
- Copied style data.
- Real keyboard binary payloads.

## Minimal Writer Flow Design

1. Receive owner-approved neutral metadata input.
2. Validate metadata contains no samples, binary data, proprietary library references, or keyboard-native extension output.
3. Build a `.uaos-neutral.json` object with required fields.
4. Write manifest and checksum references.
5. Validate safety labels and compatibility status.
6. Save only neutral JSON output in writer sandbox.
7. Stop if any step attempts real keyboard extension output.

## Future Conversion Path

Future conversion to real keyboard format may only happen after separate explicit approval. Real `.SET` and `.STY` output remains blocked until later high-risk gate approval.

## Validation Rules

- `status` must be `EXPERIMENTAL_NEUTRAL_PACKAGE`.
- `owner_only` must be `true`.
- `not_public_release` must be `true`.
- `not_production` must be `true`.
- `compatibility_status` must be `NEUTRAL_NOT_KEYBOARD_NATIVE`.
- `tracks` must be metadata only.
- `sections` must be metadata only.
- `manifest_ref` must exist.
- `checksum_ref` must exist.
- Forbidden keyboard extensions must not be written.
- Proprietary samples and libraries must not be included.

## Rollback / Safety Rules

- Backup before any future generated neutral package.
- Keep all future packages under `uaos-ai-factory/writer-sandbox`.
- Stop on validation failure.
- Keep real keyboard transfer blocked.
- Keep public release, payment, push, deploy, and Vercel blocked.
