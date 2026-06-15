# UAOS Real WAV Sampler Phase

Implemented:

- local multi-WAV import;
- browser-side AudioBuffer decoding;
- root-note inference from names such as `Oud_C4.wav` and `Piano_root60.wav`;
- key and velocity mapping;
- round-robin sample selection;
- sample gain and pan;
- ADSR;
- low-pass cutoff and resonance;
- master gain;
- MIDI note, velocity, sustain and panic integration;
- local instrument preset JSON import/export;
- preset relinking by WAV file name;
- deterministic event IDs;
- automated pure-function and UI source tests.

Safety:

- WAV files remain in browser memory;
- files are not copied into Git;
- no upload endpoint was added;
- SysEx remains disabled;
- MIDI output remains disabled;
- no commit, merge, push or deploy is performed.

Limitations:

- preset JSON stores mappings and file names, not copyrighted audio bytes;
- imported preset audio must be relinked by selecting the WAV files again;
- loop points, disk streaming, time stretching and proprietary sampler formats
  remain future work.