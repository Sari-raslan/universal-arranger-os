# Read-Only UI Selected Package Proposal

LOCAL ONLY - PROPOSAL ONLY - NO UI SOURCE CHANGES

## Goal

Plan a future read-only UI surface for showing the selected neutral package, currently `owner-neutral-003`.

## Proposed Data Sources

- `uaos-ai-factory/writer-sandbox/neutral-package-writer/NEUTRAL_PACKAGE_CATALOG.json`
- `uaos-ai-factory/VALIDATION_AGGREGATE_STATUS.json`
- `uaos-ai-factory/writer-sandbox/neutral-package-writer/OWNER_SELECTED_NEUTRAL_REVIEW_TARGET.md`
- `uaos-ai-factory/writer-sandbox/neutral-package-writer/outputs/owner-neutral-003/VALIDATION.json`

## Proposed UI Content

- Selected package ID.
- Package status.
- Validation status.
- Keyboard-native flag.
- Compatibility status.
- Safety labels.
- File paths to open manually.
- Blocked actions.

## Design Boundary

This proposal does not modify `App.jsx`, frontend source, routing, build scripts, deploy scripts, payment code, or writer/export code.

## Future Implementation Boundary

Future implementation must be read-only:

- No editing package files.
- No exporting keyboard files.
- No keyboard transfer instructions.
- No deploy/payment/public URL actions.
- No external automation.

## Stop Conditions

Stop if implementation requires App.jsx changes without explicit owner approval, frontend changes without approval, keyboard-native output, or external automation.
