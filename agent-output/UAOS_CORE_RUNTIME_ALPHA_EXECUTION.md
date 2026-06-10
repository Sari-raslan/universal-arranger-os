# UAOS Core Runtime Alpha — Agent Execution Contract

Active execution order:
1. SAR-118
2. SAR-128
3. SAR-119
4. SAR-120
5. SAR-129
6. SAR-130
7. SAR-121
8. SAR-131
9. SAR-123
10. SAR-138

Rules:
- Preserve V1 stability.
- Never break build.
- Use small reversible commits.
- Run health + frontend build before commit.
- Update Linear issue notes after each execution step.
- Stop only on architecture conflict, failed build, deployment risk, or destructive operation.

Current target:
- backend monitoring stable
- deployment pipeline stable
- realtime MIDI routing foundation
- arranger transition foundation
- sampler playback foundation
- hardware abstraction foundation
