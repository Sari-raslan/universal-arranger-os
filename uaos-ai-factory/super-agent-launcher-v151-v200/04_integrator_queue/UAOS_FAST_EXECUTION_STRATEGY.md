# UAOS Fast Execution Strategy

1. Agents prewrite.
2. Safety agent scans.
3. Validator agent checks forbidden output/claims.
4. Dashboard agent builds owner view.
5. Integrator assembles actual batch only when requested.
6. Commit only after validator success.
7. Never mark draft stages PASS.
