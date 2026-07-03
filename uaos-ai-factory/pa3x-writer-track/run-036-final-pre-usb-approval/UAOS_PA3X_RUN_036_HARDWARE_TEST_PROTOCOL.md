# UAOS PA3X Run 036 Hardware Test Protocol

Status: PROTOCOL ONLY - NO HARDWARE TEST APPROVED

Run 036 does not load PA3X and does not authorize keyboard transfer. This protocol exists only so the owner can decide whether a future Run 037 USB copy script should be prepared.

## Preconditions For Any Future Hardware Test

- Full PA3X backup is confirmed by the owner.
- Run 037 is separately approved by the owner.
- One empty USB path is explicitly selected by the owner.
- The USB contains no existing files or folders.
- The copied package remains TEST_UNVERIFIED.
- No overwrite or internal memory write is allowed.
- PA3X failure or rejection is acceptable and expected as a test outcome.

## Future Test Scope

The only possible future test scope is whether PA3X recognizes or rejects the isolated TEST_UNVERIFIED candidate package. A rejection is a valid outcome and must not trigger retries, overwrites, or internal memory writes.

## Forbidden Actions

- Do not write to internal keyboard memory.
- Do not overwrite any existing PA3X data.
- Do not load into a production set.
- Do not rename the candidate as ready or compatible.
- Do not continue if PA3X prompts for an unsafe write, overwrite, conversion, or internal memory action.

## Immediate Stop Conditions

Stop if the PA3X asks to overwrite, write internally, convert data, load into protected memory, or proceed with any step outside the isolated TEST_UNVERIFIED package review.

## Run 036 Boundary

Run 036 creates reports only. It performs no USB copy and no hardware action.
