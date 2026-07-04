# UAOS V45 Manual Decision Import Template



Manual decision import only. This does not apply metadata, does not approve export, and does not save automatically.



Allowed decisions:



- accept_for_future_metadata_plan_only

- reject

- needs_more_review

- defer



## V43-DEC-001 Add owner notes per section

- Source suggestion: V40-SEC-001
- Category: sectionStructure
- Selected decision: pending
- Owner note: 
- Proposed metadata change: Add optional ownerNote fields for intro, variations, fill, and ending.
- Safety: metadata-only, dry-run only, canAutoApply false

## V43-DEC-002 Define density targets by section

- Source suggestion: V40-RHY-001
- Category: rhythmDensity
- Selected decision: pending
- Owner note: 
- Proposed metadata change: Add low/medium/high density intent for each section.
- Safety: metadata-only, dry-run only, canAutoApply false

## V43-DEC-003 Add bass movement contour

- Source suggestion: V40-BAS-001
- Category: bassMovement
- Selected decision: pending
- Owner note: 
- Proposed metadata change: Add root_hold, passing_motion, and turnaround tags as metadata only.
- Safety: metadata-only, dry-run only, canAutoApply false

## V43-DEC-004 Add chord rhythm pattern labels

- Source suggestion: V40-CHR-001
- Category: chordRhythm
- Selected decision: pending
- Owner note: 
- Proposed metadata change: Add metadata labels such as stab, syncopated, held, and push.
- Safety: metadata-only, dry-run only, canAutoApply false

## V43-DEC-005 Separate feel from compatibility

- Source suggestion: V40-ORI-001
- Category: orientalFeel
- Selected decision: pending
- Owner note: 
- Proposed metadata change: Keep maqam/feel notes as reference-only metadata.
- Safety: metadata-only, dry-run only, canAutoApply false

## V43-DEC-006 Add melody space map

- Source suggestion: V40-MEL-001
- Category: melodySpace
- Selected decision: pending
- Owner note: 
- Proposed metadata change: Add sparse/medium/busy melody-space values per section.
- Safety: metadata-only, dry-run only, canAutoApply false

## V43-DEC-007 Add DSP intent confidence

- Source suggestion: V40-DSP-001
- Category: dspIntent
- Selected decision: pending
- Owner note: 
- Proposed metadata change: Add low/medium/high confidence metadata for each DSP channel.
- Safety: metadata-only, dry-run only, canAutoApply false

## V43-DEC-008 Add reviewer checklist slots

- Source suggestion: V40-HUM-001
- Category: humanReview
- Selected decision: pending
- Owner note: 
- Proposed metadata change: Add empty metadata-only reviewer note fields.
- Safety: metadata-only, dry-run only, canAutoApply false

## V43-DEC-009 Keep export gates locked

- Source suggestion: V40-SAFE-001
- Category: safetyGate
- Selected decision: pending
- Owner note: 
- Proposed metadata change: Mirror approvedForKorgExport, approvedForUsb, and approvedForKeyboardLoad as false.
- Safety: metadata-only, dry-run only, canAutoApply false
