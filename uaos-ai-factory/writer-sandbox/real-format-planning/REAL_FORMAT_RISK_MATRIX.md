# IMPL-021 Real Format Risk Matrix

LOCAL ONLY - PLANNING ONLY - NO REAL KEYBOARD OUTPUT

| Option | Risk | Routing | Notes |
| --- | --- | --- | --- |
| Neutral `.uaos-trial.json` | LOW | Local planning / owner review | Readable JSON, not keyboard-native, reversible. |
| Fake-safe simulation with non-keyboard extension | MEDIUM | Future bounded implementation with validation | Must avoid real keyboard extensions and must be clearly marked not loadable. |
| Real `.STY` / `.SET` output | HIGH / OWNER APPROVAL REQUIRED | Block until exact approval gate | Compatibility is unverified and keyboard may reject the file. |
| Proprietary sample inclusion | BLOCKED | Do not perform | No Kontakt, Native Instruments, sample libraries, or third-party audio. |
| Public release / deploy / payment | BLOCKED | Do not perform | Violates local-only sandbox boundary. |

## Current Classification

- Current candidate `OWNER_TRIAL_001.uaos-trial.json`: LOW
- Real keyboard transfer now: NOT RECOMMENDED
- Real keyboard output now: BLOCKED

## Required Controls Before Higher Risk Work

- Manifest required.
- Checksum required.
- Backup required.
- Validation required.
- Owner approval required.
- No proprietary samples.
- No push/deploy/Vercel/payment.

## Stop Conditions

Stop if:

- A task would create `.STY`, `.SET`, `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST` without exact approval.
- A task requires proprietary samples or audio.
- A task claims production readiness.
- A task creates public release, deploy, payment, or automation behavior.
