# UAOS PA3X Run 044A PRF Parser V2 Plan

Status: PLAN ONLY - NO IMPLEMENTATION

## Goals

- Preserve strict read-only fixture handling.
- Strengthen stable-anchor validation at offsets 0, 17, and 23.
- Track variable, repeated, and unknown regions without decoding values.
- Produce confidence scores per region class.
- Refuse to emit native keyboard files.

## Proposed V2 Features

1. Metadata-only fixture inventory with hashes and length bands.
2. Stable-anchor validator requiring all 16 PRFs or an explicit threshold.
3. Region class summarizer for fileHeader, stableRegion, repeatedRegion, variableRegion, and unknownRegion.
4. Length-delta model that separates bank-size variation from parser confidence.
5. Stop-zone tracking for unknown and trailing regions.
6. Safety manifest requiring no fixture modification and no native output.

## Non-Goals

- No field decoding.
- No sample extraction.
- No native PRF/STY/SET/PRS/KST generation.
- No USB workflow.
- No keyboard transfer or PA3X load.

## Success Criteria

Parser v2 is successful only if it improves read-only explanations and validation confidence without creating any keyboard output candidate.
