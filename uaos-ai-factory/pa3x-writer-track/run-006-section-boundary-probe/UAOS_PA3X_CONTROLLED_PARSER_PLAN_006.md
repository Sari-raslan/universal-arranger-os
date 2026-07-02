# UAOS PA3X Controlled Parser Plan 006

## Safest next group
Performance-related .prf files are the safest next group because there are 16 comparable bank files and the next parser can stay tiny: offset inventory only, no values.

## Windows suggesting structure
- Offset 0 appears as a consistent header window.
- Fixed offsets 256, 512, and 1024 are safe comparison points.
- Middle and final windows help identify broad container shape without full decode.

## What Run 007 should read
- STYLE/PAD/PERFORMANCE fixed windows already used in Run 006.
- Only marker positions, zero-region spans, and repeated boundary offsets.
- No musical values and no meaning assignment to byte fields.

## Must remain blocked
- Full decode.
- Value decoding.
- Sample/audio extraction.
- Keyboard-native output.
- USB or keyboard transfer.

## Still missing for real writer
- A controlled parser schema.
- Synthetic minimal output design.
- Owner approval for output gates.
- Isolated USB test and physical PA3X load result.
