# Agent Run Policy 24H

A 24h-style run is bounded production management, not an infinite loop.

Rules:

- Bounded tasks only.
- No infinite loops.
- No full repo scans.
- No unsafe deploys.
- No keyboard output without explicit approval.
- No payment flow.
- Commit per block.
- Morning handoff report after each large run.
- Stop and write failure report if a serious gate fails.
