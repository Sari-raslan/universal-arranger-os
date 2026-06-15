# sar.SET Safe Analysis Notes

Analyzed path: samples/Korg/sar.SET
Kind: directory
Possible brand: Korg
Total files: 147
Total size: 259606448 bytes
Deep parser needed: true

This is a safe metadata inspection of a user-provided directory-style arranger set. Proprietary Korg subformats are not decoded; the app records extension counts, limited strings, hex previews, and child summaries only.

Extension counts:
- .gbl: 1
- .kmp: 1
- .mxp: 1
- .pcg: 5
- .pcm: 99
- .prf: 16
- .sbd: 7
- .sbl: 1
- .sty: 15
- .voc: 1

Next parser work:
- Keep proprietary files in safe-inspection mode unless public documentation is available.
- Add per-folder summaries for STYLE, SOUND, PCM, PERFORM, SONGBOOK, GLOBAL and MULTISMP.
- Preserve no-crash behavior for unknown binary files and empty folders.
