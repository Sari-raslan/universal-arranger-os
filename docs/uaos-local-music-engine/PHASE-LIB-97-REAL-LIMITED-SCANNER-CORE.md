# PHASE-LIB-97 — Real Limited Scanner v1 Core

Created:

`src/uaos-local-music-engine/real-limited-scanner-v1/realLimitedScannerV1.mjs`

## Runtime requirements

The scanner only runs if:

- approval decision JSON is valid
- approval is true
- exact approval phrase matches
- selected folder exists

## Scanner scope

- selected folder only
- direct children only by default
- name
- extension
- sizeBytes
- modifiedTime
- kind

## Locked

- no file content reading
- no copy/move/delete
- no archives
- no parser
- no keyboard writer/output
- no MIDI/audio export
- no deploy
