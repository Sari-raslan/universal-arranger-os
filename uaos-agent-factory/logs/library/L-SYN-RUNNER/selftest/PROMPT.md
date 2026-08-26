# UAOS Factory Task L-SYN-RUNNER

Lane: library
Title: Synthetic generic runner proof
Worktree: C:\keyboard-manager-clean\uaos-agent-factory\state\build-cache\synthetic-repos\iso-2026-08-14T14-28-12-345Z-l-syn-runner\task
Priority: 1

## Objective
Synthetic generic runner proof


## Allowed paths
- UAOS_GENERIC_MARKER.txt

## Forbidden paths
- node_modules/**

## Required commands after implementation
### preflight
### tests
### build
### acceptance

## Expected artifacts

## Deliverables
1. Implement the smallest honest change in the worktree.
2. Run the listed tests; leave raw logs.
3. Write RESULT.json at the artifact/evidence path with status PASS or FAIL, filesChanged[], testResults[].
4. Do not package Setup/Portable unless the task explicitly requires it.

GLOBAL SAFETY (NON-NEGOTIABLE):
- Never run remote publish actions (no push, no deploy, no npm publish, no payment activation)
- No USB, SysEx, KORG writer, or proprietary arranger binary outputs (.STY/.SET/.PRS/.PRF/.KST)
- Never rewrite owner history (no reset/clean/stash of owner trees)
- Never stage everything — exact paths only (never add-dot / add-all)
- No fabricated PASS
- Use D: for TEMP/TMP/large builds; C is low on space
- Offline product work; no accounts/cloud/telemetry

## Scout report
{
  "role": "SCOUT",
  "taskId": "L-SYN-RUNNER",
  "at": "2026-08-14T14:28:12.871Z",
  "rootCause": "queue_objective",
  "allowedPaths": [
    "UAOS_GENERIC_MARKER.txt"
  ],
  "testCommands": []
}