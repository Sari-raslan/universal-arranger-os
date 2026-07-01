# UAOS Cycle 009 MIDI-Only Demo Generator Plan

Status: SPEC ONLY

## Purpose

Define a future-safe demo generator that creates arrangement-plan metadata for MIDI-oriented demos without creating MIDI files, keyboard output, transfer paths, or restricted hardware-native formats.

## Generator Inputs

- Song idea
- Preset family from Cycle 007
- Maqam hint
- Tempo
- Meter
- Target energy
- Library metadata availability

## Generator Outputs

- Arrangement plan JSON
- Track-role map JSON
- Section timeline JSON
- QA report markdown

## Explicitly Not Generated

- MIDI files
- Keyboard-native files
- Hardware transfer packages
- Audio files
- Frontend export buttons

## Safe Implementation Steps

1. Read Cycle 007 preset taxonomy.
2. Select section defaults.
3. Apply maqam behavior metadata.
4. Select lead/support instrument categories.
5. Write JSON-only arrangement plan.
6. Run validator and no-false-claims QA.

## Owner Approval Gate

Any real file exporter requires explicit owner approval and a separate task.
