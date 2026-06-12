# UAOS Audio And MIDI Limitations

- Microphone capture requires browser permission and a secure context such as HTTPS, localhost, or 127.0.0.1.
- Pitch detection is an estimate and depends on input level, noise, instrument timbre, and browser audio behavior.
- Chord naming is based on available MIDI notes and confidence heuristics; it is not a complete harmonic analysis engine.
- MediaRecorder downloads use the MIME type actually supported by the browser. WebM/Opus is not labeled as WAV.
- WebMIDI is browser-dependent. Chrome-family browsers usually provide the best support.
- Real device validation still requires actual MIDI hardware for input, output, thru, panic, and learn workflows.
- Electron MIDI bridge support depends on `easymidi` availability on the desktop host.

