# Codex Step 01 - Desktop Stability

Date: 2026-06-11

Checklist item:
- Improve desktop app stability.

Changes:
- Added `desktop/desktopLoadPolicy.cjs` for desktop URL trust, external-link, and offline-startup decisions.
- Updated `desktop/main.js` to recover to the bundled offline app when the public app fails to load or the renderer exits.
- Kept untrusted external links out of the Electron window by opening them in the system browser.
- Added `tests/desktop-load-policy.test.cjs` for the desktop load policy.

Verification:
- `npm run build` passed.
- `node --test tests\desktop-load-policy.test.cjs` passed.
- `node --test tests\regression.test.js` passed.

Notes:
- Existing pre-work changes were left untouched: `agent-output/UAOS_DESKTOP_FINAL_REPORT.txt`, `desktop/dist/uaos-desktop-1.0.0-x64.nsis.7z`, and the untracked checklist file.
