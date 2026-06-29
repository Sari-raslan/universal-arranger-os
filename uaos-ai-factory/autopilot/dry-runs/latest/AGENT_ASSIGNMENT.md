# Agent Assignment

Selected task: AI-015 next local-only planning task
Assigned agent: release_manager

## Why This Agent

Report staging readiness without releasing.

## Allowed Files

- uaos-ai-factory/**/*.md
- uaos-ai-factory/**/*.json

## Forbidden Files

- .git/**
- node_modules/**
- .vercel/**
- uaos-live-clean/src/App.jsx

## Expected Output

Local-only planning note after owner review.

## Stop Conditions

- Stop at first serious FAIL.
- Stop if external account access becomes required.
- Stop if implementation is requested during this dry run.
