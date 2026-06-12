# UAOS V1 Architecture

UAOS V1 is a Vite React app built from `uaos-live-clean`. The root `npm run build` delegates to that app.

## Runtime Layers

- `src/core`: event bus, event names, diagnostics, feature flags, and music theory helpers.
- `src/audio`: real browser audio analysis helpers using Web Audio data and `pitchy`.
- `src/midi`: WebMIDI message parsing, transforms, panic messages, and formatting.
- `src/timeline`: throttled recording store for MIDI and audio-analysis events.
- `src/session`: local session persistence, validation, export/import, autosave, and migration foundation.
- `src/arranger`: deterministic V1 arranger state reducer, sections, lanes, scenes, and bar/beat clock helpers.
- `src/components`: panels wired into the active routes.

## Event Flow

Audio and MIDI panels publish normalized events to the shared event bus. The timeline panel subscribes and records only while recording is active, throttling audio-analysis events so localStorage is not filled every animation frame.

## Persistence

Sessions are JSON documents with `version: 1`. Imports are validated and migrated before use. Autosave writes to a separate key so a broken manual save is less likely to destroy the last explicit save.

