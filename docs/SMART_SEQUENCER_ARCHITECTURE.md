# Smart Sequencer Architecture

## Vertical slice
1. Accept owned WAV/MP3.
2. Extract safe metadata.
3. Create private UMS project.
4. Show editable timeline/sections/tracks.
5. Save and reopen.
6. Export UMS package and standards-based MIDI.
7. Record analysis as not-analyzed until a provider runs.

## Provider contracts
MetadataProvider, TempoProvider, StructureProvider, ChordProvider,
StemProvider, TranscriptionProvider, MaqamProvider, StyleBuilderProvider.
