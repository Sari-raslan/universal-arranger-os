# Derived tasks from OWNER_MUSICAL_LISTENING_NEEDS_FIXES

Gate: `TASK-05-00605-MUSICAL_BRAIN_CONTRACT` remains OWNER_GATE.

| ID | Task | Result |
|---|---|---|
| DERIVED-LISTEN-001 | Independent musical sketch renderer (not V13 mixer) | `backend/src/render/musicalSketchRenderer.js` |
| DERIVED-LISTEN-002 | Original sketch material + arrangement event builder | `backend/src/render/uaosOriginalSketch.js` |
| DERIVED-LISTEN-003 | Understand → Decide → Arrange → Render pipeline | `backend/src/render/musicalListeningPipeline.js` |
| DERIVED-LISTEN-004 | Tests (sine refused, multi-pitch, A/B, catalog gates) | `tests/musical-sketch-render.test.mjs`, `tests/owner-listening-real-musical.test.mjs` |
| DERIVED-LISTEN-006 | Owner NEEDS_FIXES on 05: tonal context preservation; reject unrequested major rewrite; render in-context 05 | `backend/src/arranger/tonalContext.js`, `05-alternative-in-context.wav` |

No Commander writes. No `singy-integration` / `factory-clean-runtime-20260813` writes.
