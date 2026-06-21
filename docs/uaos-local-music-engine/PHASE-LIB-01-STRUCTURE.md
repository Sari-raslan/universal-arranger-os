# PHASE-LIB-01 — Safe Local Music Engine Structure

## Goal

Define safe local folders for UAOS Library + DAW + Sampler + Arrangement without copying large audio files and without touching real keyboard writer/output/parser layers.

## Safe locations

Inside app source:

- `uaos-live-clean/src/uaos-local-music-engine/library`
- `uaos-live-clean/src/uaos-local-music-engine/instruments`
- `uaos-live-clean/src/uaos-local-music-engine/presets`
- `uaos-live-clean/src/uaos-local-music-engine/metadata`
- `uaos-live-clean/src/uaos-local-music-engine/sampler`
- `uaos-live-clean/src/uaos-local-music-engine/daw`
- `uaos-live-clean/src/uaos-local-music-engine/arrangement`
- `uaos-live-clean/src/uaos-local-music-engine/qa`

Inside public standalone pages:

- `uaos-live-clean/public/uaos-local-music-engine/library-dashboard.html`
- `uaos-live-clean/public/uaos-local-music-engine/sampler-dashboard.html`
- `uaos-live-clean/public/uaos-local-music-engine/daw-workspace.html`
- `uaos-live-clean/public/uaos-local-music-engine/arrangement-workspace.html`
- `uaos-live-clean/public/uaos-local-music-engine/qa-dashboard.html`

## Strict boundaries

This phase does not:

- copy audio samples
- read fixtures
- modify fixtures
- create real keyboard writer
- create real keyboard output
- create production parser
- touch App.jsx
- create .STY/.SET/.PRS/.STL/.PAT/.MSP/.KST files

## Library plan

The library layer uses placeholders only:

- sample references are symbolic URLs or IDs
- zones are metadata only
- velocity layers are placeholders
- articulations are metadata only
- browser preview is mock only
