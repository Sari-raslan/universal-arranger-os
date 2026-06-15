# UAOS MIDI-to-Sampler Integration

Implemented:

- Web MIDI permission requested only by user action;
- `sysex: false`;
- MIDI input enumeration and reconnect handling;
- note-on and note-off;
- velocity;
- MIDI channel filter;
- sustain pedal CC64;
- all-sound-off CC120;
- all-notes-off CC123;
- pitch-bend parsing and monitoring;
- device profile matching for KORG PA3X/PA5X, Yamaha Genos,
  Roland BK-9, Ketron SD9, and NI Kontrol S88 MK3;
- computer keyboard Aâ€“K note input;
- local MIDI event recording and JSON export;
- panic/all-notes-off.

Current limitations:

- generated Web Audio tone is used for engine validation;
- no proprietary style-file parser;
- no device-specific SysEx;
- no commercial sample content;
- hardware behavior must be verified manually with the device connected.

NOT MERGED / NOT DEPLOYED