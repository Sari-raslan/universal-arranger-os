# SAR-6: Debounced Explorer Search

Date: 2026-05-28

## Progress Update

- [x] Added explorer query state in `App`.
- [x] Added a debounced query value before selector execution.
- [x] Kept filtering inside `selectExplorerState`.
- [x] Filtered visible rows by name, path/id, extension, category, and available analysis metadata/string candidates.
- [x] Kept selection stable when filtered out; detail panel is not cleared by search.
- [x] Preserved flat explorer rendering.
- [x] Preserved export URL behavior.
- [x] Preserved Web MIDI code path.
- [x] Preserved backend parser pipeline.

## Files Touched

- `frontend/src/main.jsx`
- `frontend/src/styles.css`
- `frontend/dist/index.html`
- `frontend/dist/assets/index-CdKiSonF.css`
- `frontend/dist/assets/index-DoWm1SxO.js`
- `docs/sar-6-progress.md`

## Regression Notes

- Typing updates local `query` immediately, while row filtering waits for the debounced value.
- Clearing the search restores all library rows because an empty query returns the unfiltered selector rows.
- Library dashboard count now uses filtered `visibleCount`; storage total is derived from the filtered visible rows.
- `totalCount` remains available for context and empty-state decisions.
- Search candidates include selected analysis details when available, including strings, metadata, extension counts, child summaries, parser, and brand.
- Export links still use row ids and do not depend on the current selection.
- Search does not clear `selectedId` or selected analysis when the selected row is hidden by filtering.
- Web MIDI and backend parsing files were not changed.

## Verification Results

```powershell
cd C:\Users\ssare\keyboard-manager\frontend
npm.cmd run build
```

Result: passed.

```powershell
cd C:\Users\ssare\keyboard-manager\frontend
cmd /c npm run build
```

Result: passed.

PowerShell note: direct `npm run build` can hit the local `npm.ps1` execution-policy block on this machine, so `cmd /c npm run build` was used to verify the requested npm script path.
