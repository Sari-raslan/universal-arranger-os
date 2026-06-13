# UAOS V3 Architecture

V3 AI Labs is local, deterministic, and labelled experimental.

## Modules
- `ai/analysisPipeline.js`: audio analysis metadata and confidence.
- `ai/voiceToMidi.js`: voice segmentation and quantization.
- `ai/arrangementPlanner.js`: arrangement plans and schema validation.
- `ai/generators.js`: deterministic local rule-based MIDI generation.
- `ai/rhythmFramework.js`: original maqam and rhythm metadata.
- `ai/evaluation.js`: range, timing, stuck-note, density, and determinism checks.
- `ai/aiServices.js`: local job queue, cancellation, privacy deletion, and model registry.
- `components/AILabsPanel.jsx`: product UI integration.

## AI Notes
Cloud adapters are not configured. No trained commercial AI model is included or claimed.
