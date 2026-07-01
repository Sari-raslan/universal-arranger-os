# UAOS Cycle 002 Safe MIDI Plan

Status: SAFE PLAN ONLY

## Purpose

Define how the arranger intelligence layer can describe MIDI-oriented arrangement intent without creating MIDI files, keyboard output, or hardware transfer paths.

## Allowed In Cycle 002

- Section plan JSON.
- Track-role metadata.
- Instrument choice metadata.
- Maqam behavior metadata.
- Note-intent descriptions.
- Test cases and QA criteria.

## Not Created

- MIDI files.
- Hardware-native files.
- Real keyboard writer.
- Device transfer flow.
- Export buttons.

## Safe Planning Fields

- `sectionName`
- `bars`
- `energy`
- `leadInstrumentCategory`
- `supportInstrumentCategories`
- `maqamHint`
- `articulationHint`
- `transitionIntent`
- `humanizationIntent`

## Tomorrow Implementation Path

1. Create a pure JSON arrangement-plan generator.
2. Validate generated plans against Cycle 002 test cases.
3. Keep all outputs as JSON reports.
4. Request owner approval before any real file exporter.
