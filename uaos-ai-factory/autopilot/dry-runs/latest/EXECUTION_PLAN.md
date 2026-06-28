# Execution Plan

This is a dry run. No implementation was performed.

## What The Future Agent Would Do

- Inspect only the selected allowed local text/config files.
- Confirm no remote switch is attempted while transfer is postponed.
- Produce a local identity-normalization report or narrow docs/config change.

## Files It May Inspect

- uaos-ai-factory/integrations/github/*.md

## Files It May Edit

- uaos-ai-factory/integrations/github/*.md

## Commands It May Run

- npm run ai:factory:check
- npm run ai:factory:cost
- npm run ai:factory:status

## Commands It Must Not Run

- Do not run git push.
- Do not run git remote set-url.
- Do not run vercel.
- Do not run npm run build unless a separate approved task requires it.

## PASS/FAIL Conditions

- PASS: local-only output is produced and safety/cost checks pass.
- FAIL: task needs external access, forbidden files, push, deploy, payment, real writer/export, or broad scan.
