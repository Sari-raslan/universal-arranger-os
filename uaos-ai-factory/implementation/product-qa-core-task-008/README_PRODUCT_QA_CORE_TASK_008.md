# UAOS Product QA Core Task 008

`productQACore` connects validator tasks 005 and 006 with monitor status aggregator task 007.

## Purpose

Create one safe local QA command that returns a clear product-level `PASS`, `PARTIAL_PASS`, or `FAIL` status for UAOS development progress.

## Inputs

- `implementation/arranger-plan-validator-task-005/UAOS_ARRANGER_PLAN_VALIDATOR_TASK_005_RESULTS.json`
- `implementation/library-metadata-validator-task-006/UAOS_LIBRARY_METADATA_VALIDATOR_TASK_006_RESULTS.json`
- `implementation/monitor-status-aggregator-task-007/UAOS_MONITOR_STATUS_AGGREGATED_TASK_007.json`

## Run

```bash
node run-product-qa-core.js
```

## Outputs

- `UAOS_PRODUCT_QA_CORE_TASK_008_RESULTS.json`
- `UAOS_PRODUCT_QA_CORE_TASK_008_REPORT.md`
- `UAOS_PRODUCT_QA_CORE_TASK_008_OWNER_SUMMARY.md`

## Safety

This task reads only the named validator and aggregator outputs and writes only Task 008 files. It does not deploy, does not touch `App.jsx`, does not create keyboard output, and does not copy proprietary sample material.
