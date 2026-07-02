# UAOS PA3X Read-Only Analysis Plan 002

Status: PLAN ONLY - DO NOT RUN UNTIL OWNER FIXTURE EXISTS

## Purpose
Once the owner places a copied PA3X Oriental backup under the expected fixture path, UAOS can perform read-only inventory and structural analysis.

## Allowed future read-only analysis
- Confirm fixture folder exists.
- List file names, relative paths, sizes, and timestamps.
- Generate cryptographic hashes into a report outside the fixture folder.
- Detect known extensions and folder naming patterns.
- Build a non-destructive structure map.
- Compare structure against future research notes.
- Identify which files are unknown and require owner review.

## Disallowed analysis
- Opening or extracting proprietary sample content.
- Copying samples into UAOS libraries.
- Modifying or normalizing files.
- Creating keyboard-native output.
- Writing anything back into the fixture folder.
- Running a writer against the fixture.

## Future output location
Read-only analysis reports should be written to a new run folder, for example:
`uaos-ai-factory/pa3x-writer-track/run-003-fixture-readonly-analysis/`

## First future commands should be safe
Use commands that only read metadata and write reports outside the fixture folder. Stop immediately if any command would modify the fixture.
