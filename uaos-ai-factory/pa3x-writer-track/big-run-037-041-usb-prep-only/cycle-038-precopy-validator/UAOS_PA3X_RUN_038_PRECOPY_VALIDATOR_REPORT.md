# UAOS PA3X Run 038 Precopy Validator Report

Status: PASS - VALIDATOR CREATED

Run 038 creates a pre-copy validator for the Run 035 isolated review package. The validator performs local file and manifest checks only.

## Validator

validate-run-038-usb-precopy.js

## Checks Covered

- Run 035 folder exists.
- Manifest exists.
- Candidate exists at the expected isolated review path.
- Candidate remains TEST_UNVERIFIED.
- keyboardReady is false.
- usbWriteApproved is false.
- keyboardLoadApproved is false.
- overwriteAllowed is false.
- Exactly one PRF exists in the Run 035 package.
- Candidate hash and byte length match the manifest.

## Boundary

No USB write, keyboard transfer, PA3X load, fixture modification, App.jsx modification, or overwrite is performed by this validator.
