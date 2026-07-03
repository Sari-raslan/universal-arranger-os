# UAOS PA3X Run 037 USB Copy Script README

Status: PREPARED ONLY - NOT EXECUTED

Run 037 creates a copy script for a possible later owner-approved empty USB copy. The script was not run in this cycle.

## Files

- PREPARE_ONLY_COPY_TO_USB_RUN_037.ps1
- RUN_037_DO_NOT_RUN_UNTIL_APPROVED.cmd
- UAOS_PA3X_RUN_037_USB_COPY_SCRIPT_README.md
- UAOS_PA3X_RUN_037_QA_REPORT.md

## Source Package

E:\keyboard-manager-clean\uaos-ai-factory\pa3x-writer-track\run-035-isolated-usb-package-folder-only\USB_REVIEW_ONLY_DO_NOT_COPY_TO_USB

Expected candidate:
UAOS_PA3X_TEST_UNVERIFIED_035.SET\PERFORM\UAOS_TEST_UNVERIFIED_MINIMAL_003.PRF

## Safety

- The wrapper does not call the copy script.
- The PowerShell script requires an owner approval token.
- The PowerShell script checks that the selected USB folder exists and is empty.
- The PowerShell script stops before overwrite.
- Run 037 did not perform USB write, PA3X load, keyboard transfer, fixture modification, or App.jsx modification.

## Owner Gate

This cycle does not approve execution. Any future copy requires a separate owner decision naming the exact empty USB path.
