# UAOS Backend Architecture

The Phase 8 backend is an Express foundation mounted into `backend/server.js`.

## Modules

- `server/cloud/phase8Platform.cjs`: configuration, auth, RBAC, projects, sync, billing, email, audit and observability.
- `backend/server.js`: process entry and route mounting.

## Storage

The current storage adapter is memory-backed for development and automated tests. The public API is shaped so PostgreSQL can replace the memory state after migration review.

## Production Boundary

The backend exposes readiness information but does not mark production activation ready. Real deployment requires PostgreSQL, SMTP, Stripe, TLS, secrets, backups and legal/commercial approval.
