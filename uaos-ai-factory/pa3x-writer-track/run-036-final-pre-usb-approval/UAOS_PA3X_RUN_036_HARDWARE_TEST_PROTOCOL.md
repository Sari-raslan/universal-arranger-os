# UAOS PA3X Run 036 Hardware Test Protocol

Status: FUTURE PROTOCOL ONLY / NOT APPROVED

No hardware test happens in Run 036.

## Future Test Boundary

Any future hardware-path work must be split into separate gates:

1. Run 037 may only copy to an explicitly selected empty USB path if separately approved.
2. A later run or owner action must review the copied USB contents.
3. PA3X load is not approved by Run 036.
4. Internal keyboard memory overwrite is never allowed by default.

## Future Manual Test Principles

- Full PA3X backup must exist before any test.
- Empty USB only.
- TEST_UNVERIFIED labeling must remain visible.
- If the keyboard rejects the file, that is an acceptable test result.
- Stop after the first rejection or unexpected behavior.
- Do not retry repeatedly.
- Do not modify the fixture.

## Current State

This protocol is informational only because Run 035 was not found.
