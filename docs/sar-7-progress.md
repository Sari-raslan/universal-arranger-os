# SAR-7: Sortable Explorer Columns

Date: 2026-05-28

## Progress Update

- [x] Added shared sort state for explorer rows.
- [x] Added sortable name, type, size, and updated columns.
- [x] Kept sorting client-side inside `selectExplorerState`.
- [x] Preserved current flat explorer behavior and selection behavior.
- [x] Preserved export, Web MIDI, and parser paths.

## Regression Notes

- Sorting is applied after debounced search and category filtering.
- Re-clicking the same column toggles ascending and descending order.
- Row actions still use each row id directly for export, analyze, and delete.
