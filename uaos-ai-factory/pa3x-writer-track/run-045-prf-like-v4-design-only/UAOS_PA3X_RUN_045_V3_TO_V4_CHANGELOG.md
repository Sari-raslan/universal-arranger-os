# UAOS PA3X Run 045 V3 To V4 Changelog

Status: DESIGN CHANGELOG ONLY

## V3 Baseline

V3 was a local TEST_UNVERIFIED candidate from Run 032. It used stable-offset evidence and deterministic synthetic content. V3 remains plausible only and not verified.

## Proposed V4 Changes

- Make TEST_UNVERIFIED and local-only status more explicit in manifest expectations.
- Treat offsets 0, 17, and 23 as anchors only, not implied fields.
- Add unknown-region guard concepts for later binary inspection.
- Define stricter future validator requirements before any inspection claim.
- Require manifest fields for packageCopyApproved false and testUnverified true.
- Keep future output limited to one local-only PRF-like candidate if Run 046 is separately approved.

## No Changes To Safety

V4 design does not approve USB writing, package copying, PA3X loading, keyboard transfer, or fixture modification.
