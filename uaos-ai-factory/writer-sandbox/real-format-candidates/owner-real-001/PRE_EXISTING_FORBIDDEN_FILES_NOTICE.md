# Pre-Existing Forbidden Files Notice

LOCAL ONLY - READ-ONLY NOTICE - DO NOT DELETE - DO NOT RESTORE

## Summary

The IMPL-031 whole-repository forbidden extension scan found legacy/pre-existing `.SET` and `.STY` files outside the new IMPL-031 candidate folder.

These files were not created by IMPL-031. IMPL-031R does not delete, restore, clean, move, or modify them.

## Candidate Folder Exclusion

The new candidate folder is:

`uaos-ai-factory/writer-sandbox/real-format-candidates/owner-real-001/`

Direct scan result for that folder:

- `.STY`: 0
- `.SET`: 0
- `.PRS`: 0
- `.STL`: 0
- `.PAT`: 0
- `.MSP`: 0
- `.KST`: 0

## Example Pre-Existing Locations Observed Outside Candidate

Read-only sample from inspection:

- `samples/Korg/sar.SET/STYLE/FAVORITE01.STY`
- `samples/Korg/sar.SET/STYLE/USER01.STY`
- `uaos-live-clean/generated/uaos-korg-pa-manager-workflow-study/manual-test-input/sar.SET/STYLE/FAVORITE01.STY`
- `uaos-live-clean/generated/uaos-korg-pa-manager-workflow-study/manual-test-input/sar.SET/STYLE/USER01.STY`

## Required Follow-Up

Next safe step:

IMPL-032 legacy forbidden file inventory, read-only.

That stage should inventory legacy files without deleting, restoring, cleaning, moving, rewriting, or copying them.
