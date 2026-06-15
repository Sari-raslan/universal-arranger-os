# UAOS Sampler Architecture Foundation

The current sampler foundation provides deterministic, testable behavior:

- maximum polyphony;
- note-on and note-off;
- oldest-voice stealing;
- choke groups;
- panic/all-notes-off;
- deterministic round-robin selection through the library engine.

This phase does not claim finished disk streaming, proprietary instrument
parsing, or commercial sample content. Those require later implementation and
licensed assets.

NOT MERGED / NOT DEPLOYED