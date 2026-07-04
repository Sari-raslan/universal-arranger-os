# UAOS V74 Hardened Export Validation Rules

status: "LOCAL_VALIDATION_ONLY"

## Required Checks
- V71 MIDI exists, starts with `MThd`, and contains `MTrk`.
- V72 `.uaos.json` exists, parses as JSON, and includes all required package fields.
- V73 ZIP exists, opens, and contains only `.mid`, `.json`, `.md`, `.txt`, and `.html`.
- Forbidden KORG and audio file extensions remain absent: `.SET`, `.STY`, `.PRF`, `.PRS`, `.KST`, `.WAV`, `.MP3`.
- USB paths, PA3X load text, KORG writer text, compatibility claims, and PA3X-ready claims remain absent.
- App.jsx, React integration, deploy, and payment remain blocked.

## Scope
This validator reads V71, V72, V73, the V71-V73 batch folder, and V74 validation files. It does not create KORG output, write USB media, load PA3X, deploy, or mutate source application files.
