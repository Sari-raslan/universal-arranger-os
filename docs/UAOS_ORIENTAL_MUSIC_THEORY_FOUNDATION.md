# UAOS Oriental Music Theory Foundation

Status: experimental metadata foundation.

UAOS Phase 5 includes an explicit Oriental music theory layer for maqam-aware metadata, manual correction, and safe MIDI approximation. It does not claim perfect maqam recognition or direct quarter-tone playback through ordinary MIDI.

## Implemented Metadata

- Rast
- Bayati
- Hijaz
- Nahawand
- Kurd
- Ajam
- Saba
- Sikah

Each maqam entry includes:

- Schema version
- Tonic metadata
- Jins metadata
- Scale degrees
- Cents offsets
- Quarter-tone degree metadata
- Temperament note
- MIDI approximation warning
- Pitch-bend requirement flag
- Confidence field
- Manual correction support

## MIDI Limitation

Traditional 12-TET MIDI note numbers do not directly represent quarter tones. Accurate Oriental tuning requires pitch bend, MPE, or an explicit tuning system. UAOS stores this requirement as metadata and treats automatic Oriental analysis as experimental.

## Manual Correction

All maqam results are intended to be manually editable before serious musical use. Confidence values are heuristic and are not legal, scholarly, or production certification.
