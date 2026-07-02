# UAOS PA3X Parser Readiness Map 005

## Safe for next controlled parser
- Performance .prf: safe for read-only boundary probing because files are repeated and consistent.
- Pad .pad: safe for read-only boundary probing across 10 user banks.
- Style .sty: required for writer research, but must stay boundary-only first because it is large and central.
- Global .gbl/.mxp/.voc: safe for inventory and header comparison, deeper meaning remains blocked.
- SongBook .sbd/.sbl: safe for inventory and header comparison only.

## Unknown groups
- None from Run 004 classifier.

## Likely proprietary/sample/PCM blocked groups
- PCM/sample groups remain blocked for extraction or decoding. Run 003 did not detect PCM/sample files in this fixture.

## Required for real writer
- Style, Pad, Performance, Global, and likely SongBook structures need documented safe schemas before any writer can be discussed.

## Smallest safe next step
- Build a read-only section-boundary probe for STYLE, PAD, and PERFORMANCE using fixed windows, no value decoding, no keyboard output.
