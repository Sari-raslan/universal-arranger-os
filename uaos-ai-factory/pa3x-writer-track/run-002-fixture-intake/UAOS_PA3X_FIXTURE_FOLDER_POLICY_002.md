# UAOS PA3X Fixture Folder Policy 002

## Fixture root
`uaos-ai-factory/pa3x-writer-track/owner-fixtures/`

## Placeholder folder
`owner-fixtures/PLACE_PA3X_BACKUP_HERE/`

This placeholder exists only to show the owner where future copied fixtures belong.

## Expected copied fixture folder
`owner-fixtures/pa3x-oriental-backup-001/`

## Read-only rules
- Treat fixture files as immutable.
- Do not edit, rename, delete, move, compress, or normalize fixture files.
- Do not write analysis files inside the fixture folder.
- Write reports only under run-specific output folders.
- Use hash and file inventory output outside the fixture folder.
- Never assume a file is safe to modify because it is local.

## Blocked actions
- No USB write.
- No keyboard transfer.
- No keyboard-native file generation.
- No destructive cleanup.
- No proprietary sample extraction or copying.
