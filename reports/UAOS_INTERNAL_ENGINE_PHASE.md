# UAOS Internal Engine Phase

Applied: 2026-06-13 12:00:17
Branch: codex/uaos-electron-runtime-hardening

Implemented:

- open library manifest validation;
- safe relative library paths;
- key and velocity zones;
- deterministic round robin;
- sampler voice allocation;
- polyphony limits and oldest-voice stealing;
- choke groups;
- note-off and panic;
- incremental SHA-256 library scanner;
- read-only Windows hardware inventory;
- tests and documentation.

Safety:

- no source sample is moved or deleted;
- no filesystem root scan is allowed;
- no symbolic link is followed by the library scanner;
- no hardware setting or driver is changed;
- no MIDI message is sent during hardware discovery.

NOT MERGED / NOT DEPLOYED