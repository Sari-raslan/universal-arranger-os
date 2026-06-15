# UAOS Open Library Format

UAOS libraries use open JSON metadata and relative sample paths.

Required manifest fields:

- `libraryId`
- `name`
- `vendor`
- `licenseStatus`
- `instrumentFamily`
- `keyRange`
- `velocityRange`
- `filePath`

Supported license states:

- `original-uaos`
- `user-owned`
- `licensed`
- `public-domain`
- `license-review-required`
- `excluded`

The format supports root note, tuning metadata, articulation, loop mode,
round-robin group, microphone position, tags, hash, and status.

Paths must be relative to a configured library root. Parent traversal and
absolute Windows paths are rejected.

NOT MERGED / NOT DEPLOYED