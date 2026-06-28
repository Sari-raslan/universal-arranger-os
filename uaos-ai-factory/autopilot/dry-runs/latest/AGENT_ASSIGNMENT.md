# Agent Assignment

Selected task: AI-002 vercel preview setup plan
Assigned agent: release_manager

## Why This Agent

Report staging readiness without releasing.

## Allowed Files

- uaos-ai-factory/integrations/vercel/*.md

## Forbidden Files

- .vercel/**
- vercel.json
- uaos-live-clean/src/App.jsx

## Expected Output

Preview-only plan with no production deployment.

## Stop Conditions

- Stop at first serious FAIL.
- Stop if external account access becomes required.
- Stop if implementation is requested during this dry run.
