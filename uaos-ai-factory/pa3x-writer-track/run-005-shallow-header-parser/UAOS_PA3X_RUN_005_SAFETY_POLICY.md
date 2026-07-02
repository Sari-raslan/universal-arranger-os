# UAOS PA3X Run 005 Safety Policy

Status: READ ONLY.

Run 005 is approved only for a shallow header parser against the owner-provided PA3X Oriental fixture copy.

## Allowed
- Load Run 003 metadata.
- Load Run 004 classifier results.
- Read controlled shallow header bytes from fixture files.
- Default proprietary/header read limit: 256 bytes per file.
- Read small documentation/metadata-like text files up to 4096 bytes for structural inspection only.
- Use Run 003 SHA256 values and compare current file state for unchanged verification.
- Write reports, JSON maps, parser code, and QA outside the fixture folder.

## Forbidden
- No fixture modification.
- No delete, rename, or copy-out of proprietary fixture content.
- No proprietary audio/sample decoding.
- No generated .SET, .STY, .PRS, .KST, .PCG, or keyboard-native output.
- No USB write.
- No keyboard transfer.
- No real writer output.
- No App.jsx.

If any step requires native keyboard-format writing, the run stops.
