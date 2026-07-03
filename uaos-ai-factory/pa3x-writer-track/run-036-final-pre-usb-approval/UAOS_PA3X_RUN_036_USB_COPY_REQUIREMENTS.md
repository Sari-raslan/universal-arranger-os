# UAOS PA3X Run 036 USB Copy Requirements

Status: REQUIREMENTS ONLY - NO USB COPY APPROVED

Run 036 does not copy to USB and does not authorize USB writing. These requirements define the minimum gate for a possible future Run 037 only.

## Source Package

Run 035 isolated review folder:
E:\keyboard-manager-clean\uaos-ai-factory\pa3x-writer-track\run-035-isolated-usb-package-folder-only\USB_REVIEW_ONLY_DO_NOT_COPY_TO_USB

Candidate relative path:
UAOS_PA3X_TEST_UNVERIFIED_035.SET\PERFORM\UAOS_TEST_UNVERIFIED_MINIMAL_003.PRF

## Mandatory Run 037 Conditions

- Owner must separately approve Run 037 before any USB copy.
- The USB path must be explicitly selected by the owner.
- The USB must be empty before copy.
- No overwrite is allowed.
- No internal keyboard memory access is allowed.
- No fixture modification is allowed.
- The copy must preserve the isolated .SET folder structure exactly.
- The copied folder must remain labeled TEST_UNVERIFIED.
- The candidate must remain UAOS_TEST_UNVERIFIED_MINIMAL_003.PRF.
- No PA3X-ready or compatibility claim may be made.

## Forbidden In Run 036

- USB write
- Keyboard transfer
- PA3X load
- Overwrite
- Internal keyboard memory access
- Fixture modification
- App.jsx modification
- New native PA3X files beyond the existing Run 035 isolated review copy

## Stop Conditions

Stop before any copy if the USB is not empty, the path is ambiguous, the owner has not approved Run 037 separately, the source differs from Run 035, or any step would overwrite existing data.
