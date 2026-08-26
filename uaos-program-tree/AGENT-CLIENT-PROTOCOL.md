# UAOS Agent Client Protocol

Supported clients:
- CURSOR_SUBAGENT
- CODEX_LOCAL
- NODE_LOCAL_WORKER
- POWERSHELL_LOCAL_WORKER
- TEST_REVIEW_AGENT
- HUMAN_REVIEW
- FUTURE_UAOS_COMMANDER (contract only)

Each client must:
1. Register
2. Request task
3. Obtain atomic claim
4. Obtain lease
5. Send heartbeat
6. Respect allowed paths
7. Write only in dedicated worktree
8. Run tests
9. Emit evidence
10. Submit result
11. Release lease
12. Never claim the same task twice
