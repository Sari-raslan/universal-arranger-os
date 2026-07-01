# UAOS Validator Regression Runner Task 009

This package adds a local regression runner for the UAOS validator chain.

## Connected Tasks

- Task 005: `arrangerPlanValidator`
- Task 006: `libraryMetadataValidator`
- Task 007: `monitorStatusAggregator`
- Task 008: `productQACore`

## Run

```bash
node run-validator-regression.js
```

## Outputs

- `UAOS_VALIDATOR_REGRESSION_TASK_009_RESULTS.json`
- `UAOS_VALIDATOR_REGRESSION_TASK_009_REPORT.md`
- `UAOS_VALIDATOR_REGRESSION_TASK_009_OWNER_SUMMARY.md`

## Safety

The runner uses JSON fixtures only. It does not deploy, does not touch `App.jsx`, does not create keyboard output, and does not copy proprietary sample material.
