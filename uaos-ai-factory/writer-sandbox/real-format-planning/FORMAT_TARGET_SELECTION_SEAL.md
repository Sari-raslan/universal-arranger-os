# IMPL-022 Format Target Selection Seal

LOCAL ONLY - DOCS/SEAL ONLY - NO REAL KEYBOARD OUTPUT

## Selected First Safe Target

Generic neutral UAOS package.

## Deferred Targets

- KORG PA-series: DEFERRED
- Yamaha style family: DEFERRED

## Blocked Output

- Real `.SET` output: BLOCKED
- Real `.STY` output: BLOCKED
- Real `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST` output: BLOCKED
- Keyboard transfer package: BLOCKED

## Why Neutral UAOS Package Is Safest First

The generic neutral UAOS package is the safest first target because it can remain local-only, readable, manifest-backed, checksum-backed, and reversible. It avoids pretending that a KORG PA-series or Yamaha style-family binary format is already verified.

## Required Safety Rules

- No proprietary samples.
- No Kontakt content.
- No Native Instruments content.
- No copied sample libraries.
- Manifest required.
- Checksum required.
- Backup required.
- Owner feedback loop required.
- No payment, public release, push, deploy, or Vercel.

## Next Stage

IMPL-023 minimal neutral package writer design.

## Later High-Risk Stage

Real keyboard extension output requires separate exact owner approval.

Required phrase:

`I approve experimental real keyboard-format output locally for owner testing only, with manifest, checksum, backup, no push, no deploy, no Vercel, no payment, no proprietary samples, and I accept the risk that the keyboard may reject the file.`

## Current Result

Format target selection is sealed as Generic neutral UAOS package. Real keyboard output remains blocked.
