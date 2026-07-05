# UAOS Super Agent Execution Order

1. Agents prewrite.
2. Safety agent scans.
3. Validator agent checks forbidden output and claims.
4. Dashboard agent builds owner view.
5. Integrator assembles actual batch only when requested.
6. Commit only after validator success.
7. Never mark draft stages complete or PASS.
