# SAR-5 Batch 1: Shared Explorer State Foundation

Date: 2026-05-27

## Architecture Findings

- Explorer state is currently owned by `frontend/src/main.jsx` in `App`.
- Backend `/api/library` owns source-of-truth item discovery, sorting, ids, directory flags, size, and timestamps.
- Frontend owns interaction state: active selection, busy/error state, upload, delete, and refresh.
- Export is intentionally link-based through `/api/export/:id`; it does not depend on selected analysis state.
- Web MIDI is isolated in `MidiMonitor` and should remain separate from library/explorer state.

## Implementation Guidance

- Keep raw library data as the API payload and derive explorer rows with `selectExplorerState`.
- Add future filters, tree expansion, counts, and grouping inside `selectExplorerState` before changing render paths.
- Keep selection id separate from selected analysis payload so row highlighting, deletion, and failed analysis have a stable control point.
- Preserve current flat library behavior until a dedicated tree expansion state is introduced.
- Keep export links row-scoped by id so exporting remains independent of selection.

## Regression Notes

- Library count and storage count are now derived from the shared explorer selector.
- Visible rows currently equal all library rows; no filtering or expansion behavior was changed.
- Selecting a row marks it active before analysis completes and clears the analysis pane on analysis failure.
- Deleting the selected row clears both the selected id and selected analysis payload.
- Upload still selects the returned analysis and refreshes the library.
- Web MIDI code path was not changed.
- Export URL generation remains `/api/export/${encodeURIComponent(row.id)}`.

## Verification Commands

```powershell
cd C:\Users\ssare\keyboard-manager\frontend
npm run build
# If PowerShell blocks npm.ps1 locally, use:
npm.cmd run build
```

```powershell
cd C:\Users\ssare\keyboard-manager\backend
npm start
```

```powershell
Invoke-RestMethod http://localhost:4000/api/library
Invoke-RestMethod http://localhost:4000/api/status
```

Manual checks:

- Refresh library and confirm visible rows/counts stay stable.
- Select a file or SET folder and confirm analysis still renders.
- Use Export JSON on a row without selecting it first.
- Delete a selected item only when using disposable/uploaded samples.
- Open the MIDI monitor in a Web MIDI-capable browser and confirm Connect still prompts/detects devices.

## Progress

- [x] Inspected current explorer architecture.
- [x] Identified state ownership.
- [x] Added shared derived selector foundation.
- [x] Stabilized visible rows/counts/selection flow.
- [x] Preserved export links.
- [x] Preserved Web MIDI isolation.
- [x] Preserved current flat explorer behavior.
- [x] Documented implementation guidance, regression notes, and verification commands.
