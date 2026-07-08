# UAOS Rollback Map

Status: ROLLBACK_MAP_READY

Rollback principle:
Prefer non-destructive recovery.

Never:
- delete active project
- overwrite active project
- deploy during recovery
- activate payment during recovery
- issue invoices during recovery
