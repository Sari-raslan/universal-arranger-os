# UAOS Vercel Upload Size Audit

Created: 2026-07-05T11:26:05

App path: `E:\keyboard-manager-clean\uaos-live-clean`

Total app folder size: 4858.33 MB

Build output size: 9.82 MB

Estimated upload after core exclusions: 11.97 MB

## Largest Folders

- `E:\keyboard-manager-clean\uaos-live-clean\generated` - 4767.53 MB (7238 files)
- `E:\keyboard-manager-clean\uaos-live-clean\node_modules` - 67.4 MB (2361 files)
- `E:\keyboard-manager-clean\uaos-live-clean\dist` - 9.82 MB (1052 files)
- `E:\keyboard-manager-clean\uaos-live-clean\public` - 9.57 MB (1047 files)
- `E:\keyboard-manager-clean\uaos-live-clean\src` - 1.3 MB (275 files)
- `E:\keyboard-manager-clean\uaos-live-clean\reports` - 0.85 MB (500 files)
- `E:\keyboard-manager-clean\uaos-live-clean\backups` - 0.76 MB (38 files)
- `E:\keyboard-manager-clean\uaos-live-clean\android` - 0.27 MB (53 files)
- `E:\keyboard-manager-clean\uaos-live-clean\ios` - 0.25 MB (19 files)
- `E:\keyboard-manager-clean\uaos-live-clean\scripts` - 0.2 MB (129 files)
- `E:\keyboard-manager-clean\uaos-live-clean\specs` - 0.04 MB (33 files)
- `E:\keyboard-manager-clean\uaos-live-clean\.vercel` - 0.0 MB (2 files)

## Upload Risk

- `generated` is the dominant local artifact folder and is excluded.
- `node_modules`, `dist`, `reports`, and `backups` are excluded.
- Archive, audio, log, and backup patterns are excluded.
- Repo-level `uaos-ai-factory` exists outside the app folder and is excluded if deploy scope is widened.
- No deploy was executed in this prep run.
