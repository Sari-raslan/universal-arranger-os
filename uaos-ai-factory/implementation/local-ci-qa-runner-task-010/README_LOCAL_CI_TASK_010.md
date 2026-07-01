# UAOS Local CI QA Runner Task 010

This package adds a local CI-style QA runner for UAOS validation tasks 005 through 009.

## Purpose

Produce one final local QA status without deployment, product export, keyboard output, or external service use.

## Inputs

- Task 005 arranger plan validator results
- Task 006 library metadata validator results
- Task 007 monitor status aggregator results
- Task 008 product QA core results
- Task 009 validator regression runner results

## Run

```bash
node run-uaos-local-ci.js
```

## Outputs

- `UAOS_LOCAL_CI_TASK_010_RESULTS.json`
- `UAOS_LOCAL_CI_TASK_010_REPORT.md`
- `UAOS_LOCAL_CI_TASK_010_OWNER_SUMMARY.md`

## Safety

The runner reads existing result JSON files and writes only Task 010 outputs. It does not deploy, does not use Vercel, does not touch `App.jsx`, does not create keyboard output, and does not modify Jobcenter or final businessplan folders.
