# QA Build Hardening Plan

This is a local planning document. No build was run for Stage 9.

Future strategy:
- Run local AI Factory checks first.
- Run cost guard before expensive operations.
- Use package-level checks when the task changes scripts or validation policy.
- Run frontend build only when UI/build-sensitive changes happen.
- Run tests when available and relevant.
- No deploy.
- No production readiness claim.
- Manual validation remains required for real browser permissions, MIDI hardware, and real device workflows.

