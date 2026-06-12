# UAOS V3 Architecture

V3 adds experimental AI Arranger Labs on top of V2:

- `ai/analysisPipeline.js`: signal analysis with versioned confidence outputs.
- `ai/voiceToMidi.js`: pitch contour segmentation and editable MIDI-note estimates.
- `ai/arrangementPlanner.js`: deterministic schema-validated arrangement plans.
- `ai/generators.js`: local rule-based generator, test-only mock adapter, capability metadata, lane/region regeneration, and range validation.
- `ai/rhythmFramework.js`: extensible original rhythm metadata for common meters and oriental cycles.
- `ai/evaluation.js`: timing, range, stuck-note, density, determinism, and human rating fields.
- `ai/aiServices.js`: job queue, cancellation, model registry, privacy deletion.

The active UI exposes `#/ai` and labels the feature experimental.

