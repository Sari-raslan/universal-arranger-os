# UAOS PA3X Run 044A V3 Limitation Analysis

Status: PASS - LIMITATION ANALYSIS ONLY

V3 is plausible because it used the stable-offset evidence from prior parser runs and stayed TEST_UNVERIFIED. It is not verified because parser evidence and local validation are not the same as device acceptance.

## Why V3 Is Plausible

- Runs 009 and 010 identify stable offsets at 0, 17, and 23 across 16 PRFs.
- Run 010 reports confidence score 0.915 for read-only parser v1 readiness.
- Run 031 translates those anchors into a local-only V3 blueprint.
- Run 032 validates local file existence, size, label, and manifest safety fields.

## Why V3 Is Not Verified

- Run 033 binary-inspection folder is missing at the expected path.
- No real USB copy has occurred.
- No PA3X recognition result exists.
- No hardware rejection or acceptance log exists.
- No checksum, footer, table, or semantic field model has been proven.
- Variable and unknown regions remain structurally labeled but undecoded.
- The V3 body is synthetic and cannot be treated as a proven native representation.

## Required Future Evidence

- More read-only comparison of real PRF banks.
- Stronger parser v2 validation rules.
- A separate empty USB verification run when a real USB exists.
- Owner-approved hardware observation only after safety gates are satisfied.

Run 044A does not create or modify any PRF candidate.
