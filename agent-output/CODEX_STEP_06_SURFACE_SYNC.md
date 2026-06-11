# Codex Step 06 - Web Desktop Android Sync

Date: 2026-06-11

Checklist item:
- Keep web, desktop, and Android synced.

Changes:
- Added `scripts/sync-web-surfaces.ps1` to copy `uaos-live-clean/dist` into:
  - `desktop/local-app`
  - `mobile/android/app/src/main/assets/public`
- Synced the current built web output into both desktop fallback and Android asset surfaces.

Verification:
- `powershell -ExecutionPolicy Bypass -File scripts\sync-web-surfaces.ps1` passed.
- `npm run build` passed.
- `node --test tests\style-timeline.test.js` passed.
- `node --test tests\web-midi.test.js` passed.
- `node --test tests\sample-map.test.js` passed.
- `node --test tests\desktop-load-policy.test.cjs` passed.
- `node --test tests\regression.test.js` passed.
- File counts match across `uaos-live-clean/dist`, `desktop/local-app`, and Android public assets: 4 files each.
- `index.html` SHA256 matches across all three surfaces: `8E957A8D06E3C9DAC7600FDE0213F2C5D2F9BFA5D83AC1241FF0E100617AB45B`.

Notes:
- Existing packaged desktop installer artifacts were not rebuilt or touched by this sync step.
- Existing pre-work changes were left untouched: `agent-output/UAOS_DESKTOP_FINAL_REPORT.txt`, `desktop/dist/uaos-desktop-1.0.0-x64.nsis.7z`, and the untracked checklist file.
