# UAOS Accounts and Authentication Foundation

Implemented:

- account registration;
- normalized unique email addresses;
- scrypt password hashing with per-user salts;
- email-verification tokens;
- login and opaque sessions;
- logout and session revocation;
- password-reset tokens;
- password reset revokes all account sessions;
- subscription state linked to approved UAOS plans;
- local JSON development store with atomic writes;
- local API server, origin restrictions and basic rate limiting;
- automated tests and readiness reporting.

Not enabled:

- production database;
- real verification or reset email delivery;
- OAuth/social login;
- payment-provider customer creation;
- public deployment.

Development verification/reset tokens may be returned by the local server.
They are automatically hidden when NODE_ENV=production.

Production must replace the local JSON store with a managed database adapter.