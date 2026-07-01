# UAOS Local QA Entry Point Task 011

This package provides an owner-friendly local QA launcher for Task 010.

## Safety Banner

`LOCAL QA ONLY - NO DEPLOY - NO EXPORT - NO KEYBOARD OUTPUT`

## Run From This Folder

```bash
node runLocalQAOnly.js
```

## Root Launcher

```bat
RUN_UAOS_LOCAL_QA_ONLY_TASK_011.cmd
```

The root launcher changes into this Task 011 folder, runs `node runLocalQAOnly.js`, and pauses so the result can be read.

## Outputs

- `UAOS_LOCAL_QA_ENTRYPOINT_TASK_011_RESULTS.json`
- `UAOS_LOCAL_QA_ENTRYPOINT_TASK_011_REPORT.md`

## Safety

This is a local QA launcher only. It does not deploy, does not use Vercel, does not export a product, does not touch `App.jsx`, and does not create keyboard output.
