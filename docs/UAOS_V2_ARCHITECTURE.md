# UAOS V2 Architecture

V2 extends the V1 runtime with professional arranger workstation modules while preserving all V1 routes and checks.

## Modules

- `src/timing/proClock.js`: PPQ clock helpers, bar/beat/tick positions, tempo changes, quantization, swing, deterministic humanization, and look-ahead scheduling windows.
- `src/arranger/proArranger.js`: V2 section list, nine-lane arranger state, lane configuration, boundary-based section transitions, scene snapshots, split/chord-mode state, and active lane resolution.
- `src/pattern/patternEditor.js`: UAOS-native pattern format, validation, create/edit/delete/duplicate, loop metadata, import/export, undo/redo, and playback event generation.
- `src/chords/chordRecognition.js`: deterministic chord recognition for common triads, sevenths, suspended, diminished, augmented, sixth chords, slash bass labels, and recognition zones.
- `src/song/songSetlist.js`: song structure and setlist save/navigation foundations.
- `src/devices/deviceProfiles.js`: verified generic profile and unverified mapping templates for KORG/Yamaha/Roland/Ketron/foot controllers.
- `src/mixer/mixerStore.js`: per-lane volume, pan, mute, solo, scene save/recall, reset, and panic integration.
- `src/desktop/desktopProjectStore.js`: adapter-based offline project save/load foundation for Electron IPC or test adapters.

## UI

`ProfessionalArrangerPanel` is integrated into the existing `pro` route and labelled experimental. It does not claim proprietary hardware style conversion.

