# UAOS PA3X Run 045 V4 Validator Plan

Status: VALIDATOR DESIGN ONLY

## Future Run 046 Validator Requirements

- Confirm exactly one `.PRF` candidate exists.
- Confirm no `.SET`, `.STY`, `.PRS`, or `.KST` output files exist.
- Confirm candidate name is `UAOS_TEST_UNVERIFIED_MINIMAL_004_V4.PRF`.
- Confirm manifest has `testUnverified: true`.
- Confirm manifest has `keyboardReady: false`.
- Confirm manifest has `usbWriteApproved: false`.
- Confirm manifest has `keyboardLoadApproved: false`.
- Confirm manifest has `packageCopyApproved: false`.
- Confirm warning document says `DO NOT LOAD ON PA3X`.
- Confirm warning document says `DO NOT COPY TO USB`.
- Confirm fixture hashes or timestamps are unchanged where measured.
- Confirm Run 037 copy script was not executed.

## Future Validator Non-Goals

- No decoding.
- No compatibility claim.
- No hardware readiness claim.
- No USB path access.
- No package copy.
