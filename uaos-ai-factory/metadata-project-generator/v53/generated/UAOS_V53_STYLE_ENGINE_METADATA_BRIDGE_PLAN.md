# UAOS V53 Style Engine Metadata Bridge Plan

Planning only. Dry-run bridge only. No real style generation, no KORG output, no export.

## Mapping Table
- tempo: uaosproject.musicalIntent.tempo -> styleEngine.tempo
- timeSignature: uaosproject.musicalIntent.timeSignature -> styleEngine.timeSignature
- scaleMode: uaosproject.musicalIntent.scaleMode -> styleEngine.scaleMode
- chordProgression: uaosproject.musicalIntent.chordProgression -> styleEngine.chordProgression
- sections: uaosproject.musicalIntent.sections -> styleEngine.sections
- trackRoles: uaosproject.musicalIntent.trackRoles -> styleEngine.trackRoles
- rhythmDensity: uaosproject.musicalIntent.rhythmDensity -> styleEngine.rhythmDensity
- bassMovement: uaosproject.musicalIntent.bassMovement -> styleEngine.bassMovement
- chordRhythm: uaosproject.musicalIntent.chordRhythm -> styleEngine.chordRhythm
- orientalFeel: uaosproject.musicalIntent.orientalFeel -> styleEngine.orientalFeel
- dspIntent: dspPlan.channels -> styleEngine.dspIntent
- humanReviewStatus: uaosproject.musicalIntent.humanReviewStatus -> styleEngine.humanReviewStatus

## Missing Fields
- rhythmDensity must be confirmed by scoring or owner review
- bassMovement must be confirmed by scoring or owner review
- chordRhythm must be confirmed by scoring or owner review
- humanReviewStatus must come from owner decision workflow
