# IMPL-021 First Real-Format Keyboard Candidate Plan

LOCAL ONLY - PLANNING ONLY - NO REAL KEYBOARD OUTPUT

## Goal

Define the safest path toward a future keyboard-native output without creating any real keyboard file in this stage.

## Target Keyboard Family Options

1. KORG PA-series
2. Yamaha style family
3. Generic neutral UAOS package

## Recommended First Safest Target

Recommended first target: generic neutral UAOS package.

Reason: a neutral UAOS package keeps the first planning step readable, reversible, and not tied to an unverified proprietary keyboard format. It allows manifest, checksum, backup, and owner review practices to mature before any real `.SET` or `.STY` output is attempted.

## Why Compatibility Is Unverified

Keyboard-native formats are device- and vendor-specific. The current sandbox candidate is a neutral `.uaos-trial.json` representation, not a verified KORG PA-series, Yamaha style-family, or other keyboard-native format. No device compatibility test has been performed.

## Why Real `.SET` / `.STY` Output Remains Blocked

Real `.SET` or `.STY` output could be mistaken for a loadable keyboard package. Without verified format rules, test fixtures, checksums, backups, and owner risk approval, creating those files is too risky. Real extensions remain blocked until a later explicit approval gate.

## Required Test Data Policy

- Use original, owner-created metadata only.
- Use tiny synthetic metadata fixtures where needed.
- Do not include proprietary samples, audio, styles, multisamples, presets, or library content.
- Keep future test artifacts local-only and clearly experimental.
- Every future artifact must have manifest, checksum, backup, and validation.

## No Proprietary Sample Policy

No proprietary samples, Kontakt content, Native Instruments content, sample libraries, or third-party audio assets may be copied, embedded, referenced as owned, or packaged.

## Manifest / Checksum / Backup Requirement

Every future candidate must include:

- `MANIFEST.json`
- `CHECKSUMS.sha256`
- Validation result
- Backup path
- Rollback notes
- Owner approval reference

## Rollback Plan

- Keep every future candidate inside `uaos-ai-factory/writer-sandbox`.
- Keep a backup before writing or changing candidate artifacts.
- If validation fails, stop and do not proceed.
- If owner review fails, delete or ignore the candidate and keep the manifest/report for audit.

## Owner Feedback Loop

1. Owner reviews the plan.
2. Owner selects or confirms target family.
3. Owner reviews risk matrix.
4. Owner approves next stage only when comfortable.
5. If risk is unclear, stop and stay with neutral package planning.

## Next Stages

1. IMPL-022 format target selection seal.
2. IMPL-023 minimal real-format writer design.
3. IMPL-024 fake-safe binary/header simulation or neutral package only.
4. IMPL-025 owner approval gate before any real extension output.

## Later Approval Phrase Required Before Real Extension Output

`I approve experimental real keyboard-format output locally for owner testing only, with manifest, checksum, backup, no push, no deploy, no Vercel, no payment, no proprietary samples, and I accept the risk that the keyboard may reject the file.`
