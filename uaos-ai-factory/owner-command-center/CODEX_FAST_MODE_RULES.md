# UAOS Code X Fast Mode Rules

Purpose: reduce Code X slowness by limiting file reading, task scope, and unnecessary repository inspection.

## Required Operating Rules

- Do not scan the whole repository.
- Do not read `dist` folders unless the task is build/deploy verification.
- Do not read backups unless explicitly requested.
- Do not read PDF, PPTX, or ZIP binaries unless QA explicitly requires file existence or size.
- Do not inspect `node_modules`.
- Do not inspect `.git`.
- Do not inspect old generated reports unless named.
- Work only on explicitly listed files/folders.
- Prefer targeted checks over broad scans.
- Max one block at a time unless requested.
- Stop on first failure.
- Report if a task would require a broad repo scan.

## Default Exclusions

- `node_modules/`
- `.git/`
- `uaos-live-clean/dist/`
- `backups/`
- `**/pdf-output/`
- `**/ppt-output/`
- `**/*.zip`
- `**/*.pdf`
- `**/*.pptx`
- `**/*.png`
- `**/*.jpg`
- `**/*.mp4`
- `**/*.wav`
- `**/*.mp3`

## Scope Control

Use explicit file and folder targets. If a task cannot be completed without broad discovery, stop and report that broader scope is required before continuing.
