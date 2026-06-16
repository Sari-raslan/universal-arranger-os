# sar.SET Notes

Source analyzed:

- `samples/Korg/sar.SET`

What it appears to be:

- A Korg arranger set directory.
- The sample tree is proprietary, so the reader should stay in safe-inspection mode unless a dedicated format parser is added later.

Observed structure:

- `147` files total.
- Approximate payload size: `259,606,448` bytes.
- Detected brand: `Korg`.
- Deep parser needed: `yes`.

Extension mix:

- `.PCM`: `99`
- `.PRF`: `16`
- `.STY`: `15`
- `.SBD`: `7`
- `.PCG`: `5`
- `.MXP`, `.GBL`, `.VOC`, `.KMP`, `.SBL`: `1` each

Top-level areas inside the set:

- `GLOBAL`
- `MULTISMP`
- `PCM`
- `PERFORM`
- `SONGBOOK`
- `SOUND`
- `STYLE`

Notes:

- The set is a directory-based arranger package, not a single flat binary.
- Safe inspection should keep extracting names, strings, headers, and binary metadata without assuming the proprietary layout.
- The backend now treats this kind of content as a protected sample library item. Delete operations hide uploaded items only and do not remove user sample content.
