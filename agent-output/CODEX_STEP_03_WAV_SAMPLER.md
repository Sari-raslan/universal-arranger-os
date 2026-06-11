# Codex Step 03 - Real WAV Sampler Playback

Date: 2026-06-11

Checklist item:
- Add real WAV sampler playback.

Changes:
- Added `uaos-live-clean/src/lib/sampleMap.js` to normalize sampler maps, select WAV samples by note/velocity/channel/role, and calculate playback-rate pitch shifts from root note.
- Updated the shipped `uaos-live-clean/src/main.js` playback engine to use decoded WAV samples when `/api/sampler/map` provides mapped audio.
- Kept oscillator playback as a legal fallback when no WAV sample is mapped or available.
- Added active source tracking so Stop halts scheduled oscillator and sample playback.
- Added a visible Sampler state card in the active app shell.
- Rebuilt the public `uaos-live-clean/dist` bundle.

Verification:
- `npm run build` passed.
- `node --test tests\sample-map.test.js` passed.
- `node --test tests\desktop-load-policy.test.cjs` passed.
- `node --test tests\regression.test.js` passed.
- In-app browser check passed on `http://127.0.0.1:5179`: no console errors, no detected horizontal overflow, and sampler state settles to fallback when the API is unavailable.

Notes:
- WAV decoding is deferred until Play so browsers do not block startup on audio-policy user gesture rules.
- Existing pre-work changes were left untouched: `agent-output/UAOS_DESKTOP_FINAL_REPORT.txt`, `desktop/dist/uaos-desktop-1.0.0-x64.nsis.7z`, and the untracked checklist file.
