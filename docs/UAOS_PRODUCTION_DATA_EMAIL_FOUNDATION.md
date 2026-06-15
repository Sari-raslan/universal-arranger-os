# UAOS Production Data and Email Foundation

Implemented:

- managed PostgreSQL repository for accounts;
- normalized users, sessions, email-token, reset-token and subscription tables;
- atomic SQL transactions;
- database migration script;
- SMTP verification and password-reset emails;
- production-only accounts server;
- strict environment validation;
- database and SMTP readiness reporting;
- automated contract, security and migration tests.

Safety:

- the production server refuses to start without PostgreSQL and SMTP settings;
- verification and reset tokens are emailed and never returned to the client;
- passwords continue to use scrypt;
- raw session/reset/verification tokens are not stored;
- password reset revokes all sessions;
- no database migration or email is executed by the default launcher.

Commands after private production configuration:

- `npm run db:migrate`
- `npm run production:integrations:readiness:strict`
- `npm run accounts:production`

Still open:

- payment-provider checkout/customer/subscription adapter;
- secure HttpOnly cookie migration;
- actual managed database and SMTP credentials;
- legal approval and deployment.