# UAOS V2 Architecture

V2 is a deterministic professional arranger layer inside `uaos-live-clean/src`.

## Modules
- `timing/proClock.js`: PPQ timing, quantization, swing, humanization, schedule windows, and tempo state.
- `arranger/proArranger.js`: nine-lane arranger state, sections, boundary commits, and lane patches.
- `pattern/patternEditor.js`: editable pattern storage, undo/redo, validation, and playback event conversion.
- `chords/chordRecognition.js`: chord recognition foundation.
- `song/songSetlist.js`: Song Book and Setlist data model.
- `mixer/mixerStore.js`: mixer lane state, scenes, recall, and panic messages.
- `devices/deviceProfiles.js`: honest MIDI mapping templates for target hardware.
- `components/ProfessionalArrangerPanel.jsx`: product UI integration.

## Hardware Notes
MIDI device mapping and reconnect behavior require manual tests with physical hardware. The current release does not parse proprietary commercial style files.
