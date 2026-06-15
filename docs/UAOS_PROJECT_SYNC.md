# UAOS Project Sync

Phase 8 adds project metadata APIs and an offline-first sync foundation.

## Project APIs

- Create, list, read, update, archive, restore and delete project metadata.
- Store project revision and version snapshots.
- Track local-only asset references without uploading audio.

## Sync Status

Sync can report disabled, offline, metadata-ready and conflict states. Conflict classification is deterministic from local, remote and base revisions.

## Upload Policy

Raw audio, WAV uploads, DLL/plugin binaries and path traversal filenames are blocked by default.
