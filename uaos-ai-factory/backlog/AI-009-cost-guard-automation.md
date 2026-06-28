# AI-009 Cost Guard Automation

- Title: Cost guard automation
- Owner agent: cost_guard
- Status: READY
- Risk: LOW
- Goal: Improve local-only checks that catch unsafe or expensive task requests.
- Allowed files: scripts/uaos-ai-factory-cost-guard.mjs, uaos-ai-factory/autopilot/*.json
- Forbidden files: node_modules/**, .git/**
- Safety gates: No external automation. No loops. No broad repo scan.
- Expected output: Local cost guard improvement plan.
- Definition of done: Guard remains no-network and short-output.
- Notes: External orchestration stays inactive.

