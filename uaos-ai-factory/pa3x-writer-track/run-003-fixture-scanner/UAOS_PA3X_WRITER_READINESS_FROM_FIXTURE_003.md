# UAOS PA3X Writer Readiness From Fixture 003

Generated: 2026-07-02T17:19:53+02:00

## Fixture result
- Fixture root scanned read-only: YES
- Files scanned: 39
- Total bytes indexed: 1580028
- Contains `.SET` folder: YES

## File types found
.gbl: 1, .md: 1, .mxp: 1, .pad: 10, .prf: 16, .sbd: 7, .sbl: 1, .sty: 1, .voc: 1

## Likely KORG / PA3X groups
- SET folders: 1
- Style-related files: 1
- Sound-related files: 0
- PAD-related files: 10
- PCM/sample-related files: 0
- GLOBAL/PERFORMANCE-related files: 19
- MIDI-related files: 0

## Likely parser/writer needs
- Folder-level `.SET` structure mapper.
- Extension-specific binary header classifier.
- Style/performance/sound/pad metadata parser after owner approval.
- Strict no-sample-extraction policy for PCM/sample-like files.
- Fixture diff tool that writes reports outside the fixture folder.
- Future writer design must be built from original UAOS content and validated against real PA3X load tests.

## What can be safely generated next
- Read-only structural map refinements.
- Extension classifier rules.
- Non-destructive fixture inventory reports.
- Parser design documents.
- Empty-output writer harness that refuses keyboard-native generation until approval.

## What remains blocked
- Real keyboard-native writer output.
- Any `.SET`, `.STY`, `.PRS`, `.KST` generation.
- USB write or keyboard transfer.
- Proprietary sample copying or decoding.
- PA3X-ready compatibility claim.

## Exact next phase
Run 004 should build a read-only fixture classifier and parser design pack. It should not generate writer output. It may classify known folder/file groups by extension and header signature, then create a parser roadmap and approval gate for any deeper analysis.
