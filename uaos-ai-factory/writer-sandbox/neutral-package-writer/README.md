# IMPL-024 Neutral Package Writer Scaffold

LOCAL ONLY - SCAFFOLD/CHECK MODE ONLY - NO REAL KEYBOARD OUTPUT

This folder defines the future safe writer scaffold for neutral UAOS packages. It is not a real keyboard writer and does not create `.STY`, `.SET`, `.PRS`, `.STL`, `.PAT`, `.MSP`, or `.KST` output.

## Intended Future Output

- Safe extension: `.uaos-neutral.json`
- Package type: neutral UAOS metadata package
- Compatibility: not keyboard-native
- Status: experimental, local-only, not public release, not production

## Current Command

```text
npm run ai:factory:neutral-package-writer
```

For IMPL-024 this command runs scaffold/check mode only. It verifies the scaffold and refuses forbidden keyboard-native extensions and proprietary sample/audio folders.
