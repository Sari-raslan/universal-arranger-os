# UAOS PA3X Run 042 USB Detector README

Status: DETECTOR AND EMPTY VERIFICATION ONLY

Run 042 creates a read-only USB detector and empty-path verifier. It does not copy the Run 035 package, does not write to USB, does not load PA3X, and does not approve hardware testing.

## Files

- DETECT_AND_VERIFY_EMPTY_USB_RUN_042.ps1
- RUN_042_DETECT_ONLY_DO_NOT_COPY.cmd
- UAOS_PA3X_RUN_042_USB_DETECTOR_RESULTS.json
- UAOS_PA3X_RUN_042_EMPTY_USB_VERIFICATION_REPORT.md
- UAOS_PA3X_RUN_042_OWNER_USB_SELECTION_FORM.md
- UAOS_PA3X_RUN_042_QA_REPORT.md
- UAOS_PA3X_RUN_042_MASTER_INDEX.md

## Detector Scope

The detector lists removable drives reported by Windows. If the owner later provides an explicit path, the same script can verify whether that path exists, whether it is on a removable drive, and whether it is empty.

## Safety

- No copy command is executed by Run 042.
- No USB write is performed.
- No keyboard transfer is performed.
- No PA3X load is performed.
- No fixture is modified.
- App.jsx is not touched.
- No PA3X-ready or compatibility claim is made.
