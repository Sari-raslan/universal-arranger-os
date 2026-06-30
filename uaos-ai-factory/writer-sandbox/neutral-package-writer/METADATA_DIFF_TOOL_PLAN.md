# Metadata Diff Tool Plan

LOCAL ONLY - PLAN ONLY - NO KEYBOARD OUTPUT

## Goal

Plan a future local read-only metadata diff tool for comparing `owner-neutral-002` and `owner-neutral-003`.

## Scope

The future tool should compare neutral metadata concepts only:

- Package identity and status.
- Safety labels.
- Section names and order.
- Track names and roles.
- Metadata fields.
- Chord/style placeholders.
- Validation fields.
- Manifest/checksum references.

## Inputs

- `uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-002/OWNER_NEUTRAL_002.uaos-neutral.json`
- `uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-003/OWNER_NEUTRAL_003.uaos-neutral.json`
- Optional validation files from each package folder.

## Planned Output

Future output should be local docs/status only:

- A Markdown comparison.
- A JSON comparison summary.
- PASS/ATTENTION labels for owner review.

## Hard Boundaries

- Do not create keyboard-native output.
- Do not output `.SET`, `.STY`, `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST`.
- Do not read binary legacy files.
- Do not move, delete, restore, or copy legacy files.
- Do not use proprietary samples.
- Do not copy Kontakt or Native Instruments content.
- Do not push/deploy/Vercel/payment.

## Future CLI Shape

Suggested future command:

`npm run ai:factory:neutral-metadata-diff`

The command should be read-only and should fail if either package is missing, keyboard-native, or compatibility is not `UNVERIFIED`.

## Stop Conditions

Stop if the task asks for binary export, keyboard transfer, real format generation, or legacy file content inspection.
