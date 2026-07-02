# UAOS PA3X Run 008 Scope

Status: READ ONLY.

This run creates structural boundary and length metadata only for PRF files.

## Allowed
- Load Run 007 structural map.
- Read controlled structural bytes from PRF files if needed.
- Compare offsets, region counts, region lengths, and fingerprints.
- Write JSON and Markdown reports outside the fixture folder.

## Forbidden
- No decoded values.
- No musical meaning decoding.
- No performance names/settings decoding.
- No generated keyboard files.
- No .SET/.STY/.PRS/.PRF/.KST output.
- No USB write or keyboard transfer.
- No fixture modification.
