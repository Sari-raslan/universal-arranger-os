# UAOS PA3X Run 044A Validator V2 Requirements

Status: REQUIREMENTS ONLY

## Required Checks

- Confirm fixture root exists.
- Confirm PRF count and path list.
- Hash every PRF without copying content.
- Confirm no fixture file timestamp changes before and after validation.
- Confirm no new PRF/STY/SET/PRS/KST output candidate file is created.
- Validate stable offsets 0, 17, and 23 against all available PRFs.
- Report per-offset present ratio, window count, and outlier count.
- Report region-class counts without decoding fields.
- Mark unknown regions as stop-zones.
- Emit JSON and markdown reports only.

## Required Safety Fields

- fixtureModified: false
- usbWritePerformed: false
- packageCopyPerformed: false
- keyboardTransferPerformed: false
- pa3xLoadPerformed: false
- nativeCandidateGenerated: false
- copyScriptExecuted: false

## Disallowed Validator Behavior

- No sample extraction.
- No proprietary content copying.
- No external-drive copy.
- No binary candidate generation.
- No Run 037 script execution.
