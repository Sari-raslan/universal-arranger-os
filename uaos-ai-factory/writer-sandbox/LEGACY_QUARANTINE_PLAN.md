# IMPL-033 Legacy Forbidden File Quarantine Plan

LOCAL ONLY - DOCS/PLAN ONLY - NO MOVE - NO DELETE - NO COPY

## Inventory Source

Source: `uaos-ai-factory/implementation/reports/IMPL_032_LEGACY_FORBIDDEN_FILE_INVENTORY_REPORT.md`

IMPL-032 found:

- 300 legacy `.STY` files outside the IMPL-031 candidate folder.
- 0 forbidden keyboard-native files inside the IMPL-031 candidate folder.

## Current Quarantine Status

- Files moved: NO
- Files deleted: NO
- Files restored: NO
- Files copied: NO
- Keyboard transfer: NO

## Why Quarantine Is Needed

Legacy `.STY` files exist in the repository outside the current safe writer-sandbox candidate output. They can confuse future safety scans, create accidental keyboard-transfer risk, and blur the boundary between neutral metadata experiments and real keyboard-native files.

Quarantine planning is needed to isolate risk metadata before any future action. This stage does not perform quarantine.

## Recommended Future Quarantine Folder Name

`uaos-ai-factory/writer-sandbox/legacy-quarantine-dry-run/`

This should be metadata-only until separate owner approval exists.

## Recommended Metadata-Only Quarantine Manifest

Future IMPL-034 should create a dry-run manifest only, with fields:

- `inventory_source`
- `legacy_file_count`
- `planned_quarantine_folder`
- `paths`
- `extensions`
- `sizes`
- `classification`
- `do_not_delete`
- `do_not_copy_contents`
- `do_not_transfer_to_keyboard`
- `owner_approval_required_before_move_or_copy`

## Required Boundaries

- No deletion.
- No restore.
- No cleanup.
- No file move.
- No content copy.
- No keyboard transfer.
- No proprietary assumption.
- No compatibility claim.
- No use in owner trial.
- No push/deploy/Vercel/payment.

## Owner Approval Requirement

Owner approval is required before any move, copy, or quarantine action. Until then, only metadata-only plans are allowed.

## Next Safe Stage

IMPL-034 quarantine dry-run manifest only.
