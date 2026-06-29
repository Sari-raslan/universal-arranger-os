# IMPL-014 Owner Writer Sandbox Safety Plan

LOCAL ONLY - PLANNING/SAFETY ONLY - NO REAL KEYBOARD OUTPUT

## Writer Sandbox Goal

Prepare a limited owner-only writer sandbox path for future experiments, without creating real keyboard/organ output and without enabling production behavior. The sandbox exists to make the next steps safer before any first test candidate is considered.

## What Is Allowed Now

- Planning documents.
- Safety gates.
- Future scaffold design.
- Manifest and checksum requirements.
- Backup requirements.
- Local-only owner review.

## What Is Blocked Now

- Real writer implementation.
- Real organ/keyboard trial package.
- Real keyboard file output.
- `.STY`, `.SET`, `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST` output.
- Public release.
- Payment flow.
- Push, deploy, or Vercel action.
- App.jsx or frontend source changes.
- Kontakt, Native Instruments, sample library, or proprietary content copying.

## Why Real Keyboard Output Is Still Blocked

Real keyboard output can affect external devices, user expectations, compatibility claims, and proprietary format boundaries. It must remain blocked until a separate sandbox scaffold, manifest process, validator, backup rule, checksum rule, and explicit owner approval are complete.

## Sandbox-Only Output Policy

Until a later approval gate is passed, future sandbox output may only be harmless planning or dry-run artifacts. Any future generated file must avoid real keyboard extensions and must clearly say sandbox-only, dry-run, and not loadable on a real keyboard.

## Manifest-Only Requirement

Every future sandbox candidate must have a manifest before it can be reviewed. The manifest must list:

- Purpose.
- Generated paths.
- File type.
- Whether the artifact is dry-run or candidate.
- Source inputs.
- Safety gates.
- Owner approval reference.

## Checksum / Hash Requirement

Every future candidate must include checksums or hashes in the manifest so the owner can verify exactly what was created and detect accidental changes.

## Backup Requirement

Before any future writer-related file or scaffold change, a local backup must be created for touched files. Before any future candidate package, a backup folder must preserve the manifest and candidate metadata.

## No Proprietary Sample Policy

No future sandbox step may copy or embed proprietary samples, sample libraries, Kontakt content, Native Instruments content, or third-party audio assets. Metadata may describe owner-owned or future original libraries only when clearly marked as metadata-only.

## No Payment / Public Release

The writer sandbox is not a product release, not a payment feature, not a customer feature, and not public. It is owner-only local preparation.

## No Push / Deploy / Vercel

Writer sandbox work remains local. No push, deploy, or Vercel action is allowed.

## No App.jsx Changes

IMPL-014 does not authorize App.jsx, frontend source, or app source changes.

## Staged Path

1. IMPL-014 safety plan.
2. IMPL-015 writer sandbox scaffold.
3. IMPL-016 dry-run package builder.
4. IMPL-017 manifest validator.
5. IMPL-018 owner approval gate for first test candidate.

## Required Approval Phrase Before Any Real Test Candidate

`I approve creating the first owner keyboard trial candidate locally, sandbox-only, with manifest, checksum, backup, no push, no deploy, no Vercel, no payment, no proprietary samples, and I understand it is experimental.`

## Current Result

IMPL-014 creates the plan only. No real writer, no real trial package, and no real keyboard output were created.
