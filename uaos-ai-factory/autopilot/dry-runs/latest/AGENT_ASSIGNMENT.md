# Agent Assignment

Selected task: AI-006 qa build hardening
Assigned agent: qa_worker

## Why This Agent

Run scoped local validation.

## Allowed Files

- uaos-ai-factory/reports/*.md
- .github/workflows/*.yml

## Forbidden Files

- node_modules/**
- dist/**
- build/**

## Expected Output

QA plan for one-check validation.

## Stop Conditions

- Stop at first serious FAIL.
- Stop if external account access becomes required.
- Stop if implementation is requested during this dry run.
