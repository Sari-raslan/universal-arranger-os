# UAOS V40 Style Improvement Suggestions

Status: GENERATED

## V40-SEC-001 Add owner notes per section

- Category: sectionStructure
- Priority: medium
- Human review required: YES
- Field: styleChecklist.*.ownerNote
- Suggestion: Add optional ownerNote fields for intro, variations, fill, and ending.
- Safety: metadata-only, no auto-apply, no export approval

## V40-RHY-001 Define density targets by section

- Category: rhythmDensity
- Priority: high
- Human review required: YES
- Field: arrangerNotes.rhythmDensityBySection
- Suggestion: Add low/medium/high density intent for each section.
- Safety: metadata-only, no auto-apply, no export approval

## V40-BAS-001 Add bass movement contour

- Category: bassMovement
- Priority: medium
- Human review required: YES
- Field: arrangerNotes.bassMovementContour
- Suggestion: Add root_hold, passing_motion, and turnaround tags as metadata only.
- Safety: metadata-only, no auto-apply, no export approval

## V40-CHR-001 Add chord rhythm pattern labels

- Category: chordRhythm
- Priority: medium
- Human review required: YES
- Field: arrangerNotes.chordRhythmPatterns
- Suggestion: Add metadata labels such as stab, syncopated, held, and push.
- Safety: metadata-only, no auto-apply, no export approval

## V40-ORI-001 Separate feel from compatibility

- Category: orientalFeel
- Priority: high
- Human review required: YES
- Field: arrangerNotes.orientalFeelReference
- Suggestion: Keep maqam/feel notes as reference-only metadata.
- Safety: metadata-only, no auto-apply, no export approval

## V40-MEL-001 Add melody space map

- Category: melodySpace
- Priority: medium
- Human review required: YES
- Field: arrangerNotes.melodySpaceBySection
- Suggestion: Add sparse/medium/busy melody-space values per section.
- Safety: metadata-only, no auto-apply, no export approval

## V40-DSP-001 Add DSP intent confidence

- Category: dspIntent
- Priority: low
- Human review required: YES
- Field: dsp.channels[].intentConfidence
- Suggestion: Add low/medium/high confidence metadata for each DSP channel.
- Safety: metadata-only, no auto-apply, no export approval

## V40-HUM-001 Add reviewer checklist slots

- Category: humanReview
- Priority: high
- Human review required: YES
- Field: reviewStatus.humanReviewerNotes
- Suggestion: Add empty metadata-only reviewer note fields.
- Safety: metadata-only, no auto-apply, no export approval

## V40-SAFE-001 Keep export gates locked

- Category: safetyGate
- Priority: high
- Human review required: NO
- Field: safety.exportGates
- Suggestion: Mirror approvedForKorgExport, approvedForUsb, and approvedForKeyboardLoad as false.
- Safety: metadata-only, no auto-apply, no export approval
