# SAR-14: Smoke Test on samples/Korg/sar.SET

Date: 2026-05-28

## Progress Update

- [x] Added a dedicated `npm run smoke:sar` script.
- [x] Verified `samples/Korg/sar.SET` exists and analyzes as the expected SET folder id.
- [x] Checked directory summary, deep parser marker, child previews, and expected Korg extension counts.
- [x] Preserved the existing general smoke test.

## Verification Notes

- `npm.cmd run smoke:sar`, `npm.cmd test`, build, and general smoke were run after the batch.
