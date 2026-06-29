# Agent Assignment

Selected task: AI-010 release gate staging only
Assigned agent: release_manager

## Why This Agent

Report staging readiness without releasing.

## Allowed Files

- uaos-ai-factory/integrations/vercel/*.md
- uaos-ai-factory/reports/*.md

## Forbidden Files

- .vercel/**

## Expected Output

Staging-only release gate checklist.

## Stop Conditions

- Stop at first serious FAIL.
- Stop if external account access becomes required.
- Stop if implementation is requested during this dry run.
