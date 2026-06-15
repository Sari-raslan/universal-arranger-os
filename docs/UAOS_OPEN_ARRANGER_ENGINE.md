# UAOS Open Arranger Engine

Implemented:

- deterministic MIDI-note chord recognition;
- major, minor, diminished, augmented, suspended and seventh qualities;
- inversion/slash-chord naming;
- Intro, Variation, Fill, Break and Ending sections;
- bar-boundary section queue and commit;
- eight open accompaniment lanes;
- tempo and transport;
- lane mute controls;
- local open-style JSON import/export;
- MIDI note input without SysEx or MIDI output;
- automated tests.

This is an open internal arranger format. It does not claim compatibility with
proprietary KORG, Yamaha, Roland or Ketron style formats.

The current phase generates style state, recognition and event snapshots.
Actual accompaniment audio/MIDI rendering is the next phase.

NOT COMMITTED / NOT PUSHED / NOT MERGED / NOT DEPLOYED