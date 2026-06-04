# SAR-11: Visible Count Category Chips

Date: 2026-05-28

## Progress Update

- [x] Added category chips derived from shared explorer rows.
- [x] Chips show visible counts after debounced search is applied.
- [x] Added category filtering for all, SET folders, MIDI, SysEx, arranger, and binary rows.
- [x] Kept selection stable when the active category hides the selected row.
- [x] Preserved row-scoped export URLs.
- [x] Preserved backend parser pipeline and Web MIDI code path.

## Regression Notes

- Category counts are derived in `selectExplorerState` from the searched row set.
- Empty category chips are hidden except the all chip.
- The dashboard visible count follows the active search/category filter.
