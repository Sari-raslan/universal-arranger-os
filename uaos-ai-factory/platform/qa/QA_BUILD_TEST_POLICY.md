# QA Build Test Policy

Command policy:
- Start with AI Factory safety check.
- Run cost guard before expensive operations.
- Run task-specific plan checks for planning artifacts.
- Run tests only when relevant.
- Run build only as a future controlled check for UI/build-sensitive changes.

Limits:
- One build maximum when needed.
- One retry maximum after a clear fix.
- Stop at first serious FAIL.

This policy does not claim production readiness.

