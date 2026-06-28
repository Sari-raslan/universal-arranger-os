# Cost Control Policy

The user has invested significant self-work already, so cost control matters.

Rules:
- Start with issue-scoped inspection.
- Do not scan `node_modules`, `dist`, `build`, `.git`, generated archives, or sample/audio libraries.
- Do not run broad agents or loops.
- Run each expensive command once unless a clear fix was made.
- Prefer the next smallest safe task.

