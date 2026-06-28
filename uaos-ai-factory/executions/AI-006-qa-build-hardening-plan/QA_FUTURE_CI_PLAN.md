# QA Future CI Plan

Future GitHub Actions should:
- Install dependencies only as needed.
- Run AI Factory safety check.
- Run cost guard.
- Run task-specific plan checks.
- Run tests if available.
- Run frontend build only when applicable.
- Avoid deployment steps.

CI should produce clear PASS/FAIL output and stop at the first serious failure.

