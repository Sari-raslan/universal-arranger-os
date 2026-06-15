# UAOS DAW Project Schema

The DAW project schema is implemented in `uaos-live-clean/src/daw/dawPhase7.js`.

Core fields:

- project id, name, schema version, created/modified timestamps
- sample-rate and bit-depth metadata
- tempo map and time-signature map
- duration, loop, punch, markers, regions
- tracks and clips
- mixer and automation
- arranger, AI, and hardware links
- audio asset references and missing asset state
- autosave and recovery metadata

The schema stores references and metadata only. Raw audio buffers are not stored in session/localStorage.
