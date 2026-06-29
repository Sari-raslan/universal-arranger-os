# IMPL-023 Neutral Writer Safety Rules

LOCAL ONLY - DESIGN ONLY - NO REAL KEYBOARD OUTPUT

## Risk Classification

| Output / Action | Risk | Status |
| --- | --- | --- |
| `.uaos-neutral.json` | LOW | Allowed for future sandbox design/scaffold only |
| `.uaos-trial.json` | LOW | Existing sandbox owner trial representation |
| Fake-safe simulation extension | MEDIUM | Future bounded task only, must not use keyboard-native extension |
| `.STY` / `.SET` | HIGH / blocked until explicit approval | Not allowed now |
| Proprietary samples | BLOCKED | Not allowed |

## Core Safety Rules

- No real keyboard output.
- No `.STY`, `.SET`, `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST` output.
- No audio samples.
- No proprietary library content.
- No Kontakt content.
- No Native Instruments content.
- No payment, public release, push, deploy, or Vercel.
- No App.jsx or frontend source changes.

## Neutral Package Rules

- Use `.uaos-neutral.json` only for future neutral package output.
- Mark status as `EXPERIMENTAL_NEUTRAL_PACKAGE`.
- Mark compatibility as `NEUTRAL_NOT_KEYBOARD_NATIVE`.
- Include manifest reference.
- Include checksum reference.
- Include rollback notes.
- Include only musical metadata.

## Stop Conditions

Stop immediately if:

- Any real keyboard extension is requested.
- Any binary keyboard payload is requested.
- Any proprietary sample or library is requested.
- Any public release, payment, deploy, Vercel, or push behavior is requested.
- Risk is unclear.

## Later Approval Boundary

Real keyboard-format output remains blocked until a later exact approval phrase and separate high-risk gate.
