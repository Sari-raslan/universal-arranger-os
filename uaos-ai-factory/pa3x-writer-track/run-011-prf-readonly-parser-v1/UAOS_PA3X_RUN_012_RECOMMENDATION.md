# UAOS PA3X Run 012 Recommendation

Decision: A. Move to STYLE structural probe

## What PRF parser v1 gives us
- A read-only structural catalogue for 16 PRF files.
- Region labels, offsets, lengths, confidence, and unknown regions.
- Non-keyboard JSON only.

## Why this still does not allow writer output
- PRF is only one part of a PA3X SET.
- No values, names/settings, or musical meaning are decoded.
- STYLE/PAD/GLOBAL relationships are not mapped enough for any output design.

## Needed next
- STYLE structural probe, read-only, fixed windows only, no value decoding.
