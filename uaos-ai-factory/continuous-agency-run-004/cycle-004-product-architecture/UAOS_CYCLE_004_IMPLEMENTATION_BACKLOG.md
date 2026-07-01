# UAOS Cycle 004 Implementation Backlog

Status: READY

## Safe Implementation Items

1. Build `arrangerPlanValidator` using Cycle 001 validation patterns.
2. Build `libraryMetadataValidator` for Cycle 003 metadata model.
3. Create `monitorStatusAggregator` that reads run-004 status files and writes one dashboard JSON.
4. Create test fixtures for three arranger scenarios from Cycle 002.
5. Add oriental strings maqam metadata fixtures.
6. Create QA report generator for no-false-claims checks.
7. Create owner approval memo for UI integration.
8. Create plugin manifest draft for metadata-only modules.

## Not Safe Without Owner Approval

- UI route creation.
- App.jsx changes.
- Export buttons.
- Device or hardware transfer paths.
- Deployment.

## First Coding Task Tomorrow

Implement `arrangerPlanValidator` and run it against Cycle 002 tests. Keep output as JSON and markdown only.
