# AI-006 QA Build Hardening

- Title: QA build hardening
- Owner agent: qa_worker
- Status: READY
- Risk: MEDIUM
- Goal: Plan conservative validation so checks are useful without wasting credits.
- Allowed files: uaos-ai-factory/reports/*.md, .github/workflows/*.yml
- Forbidden files: node_modules/**, dist/**, build/**
- Safety gates: One build maximum per task. Stop at first serious FAIL. No deploy.
- Expected output: QA validation plan.
- Definition of done: Plan documents command limits and failure handling.
- Notes: Build execution is not required for this planning task.

