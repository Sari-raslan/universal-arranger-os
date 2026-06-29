# Neutral Writer Output Policy

LOCAL ONLY - EXPERIMENTAL - NOT KEYBOARD-NATIVE - NOT PUBLIC RELEASE

## Allowed Future Output

- `.uaos-neutral.json` only.
- JSON metadata only.
- Musical structure metadata only.
- Manifest/checksum/validation references.

## Required Labels

All future neutral package output must clearly state:

- EXPERIMENTAL
- NEUTRAL UAOS PACKAGE
- NOT KEYBOARD-NATIVE
- NOT PUBLIC RELEASE
- NOT PRODUCTION

## Blocked

- `.STY`, `.SET`, `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST`.
- Real keyboard-native files.
- Audio samples.
- Proprietary sample libraries.
- Kontakt content.
- Native Instruments content.
- Public release, payment, push, deploy, or Vercel.

## Stop Rule

Stop immediately if any future writer task attempts to create a keyboard-native extension or include proprietary sample/audio content.
