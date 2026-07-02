# UAOS PA3X Expanded Safety Validator Rules

Status: EXECUTABLE LOCAL VALIDATOR

Rules:
- Fail on .SET, .STY, .PRS, .KST inside overnight-local-run.
- Fail on fixture output paths.
- Fail on unsafe positive wording for device action.
- Write JSON results.
