# IMPL-021 Format Target Decision

LOCAL ONLY - DECISION PLANNING ONLY - NO REAL KEYBOARD OUTPUT

## Options Reviewed

### KORG PA-Series

Potentially relevant for arranger/SET-style workflows, but real `.SET` output is high risk until format requirements are verified. No `.SET` file is created in IMPL-021.

### Yamaha Style Family

Potentially relevant for `.STY`-style workflows, but real `.STY` output is high risk until format requirements are verified. No `.STY` file is created in IMPL-021.

### Generic Neutral UAOS Package

Safest first target. It can remain JSON/metadata-first, local-only, checksum-backed, and reversible. It avoids pretending that a device-native format is already known.

## Decision

Recommended first target: generic neutral UAOS package.

## Rationale

- Lowest risk.
- No real keyboard extension.
- Easy owner inspection.
- Compatible with manifest/checksum/backup process.
- Allows future format mapping before any real device-targeted output.

## What Remains Blocked

- Real `.SET` output.
- Real `.STY` output.
- Any `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST` output.
- Keyboard transfer package.
- Proprietary samples or libraries.
- Public release, payment, push, deploy, or Vercel.

## Next Selection Seal

IMPL-022 should seal the selected target as generic neutral UAOS package unless the owner explicitly redirects with a new safe approval.
