# UAOS Frontend Accounts UI

Implemented:

- global Account button without changing the existing UAOS page router;
- registration form;
- local development verification-token workflow;
- login form;
- saved account session;
- account profile and subscription display;
- logout;
- password-reset request and confirmation;
- Arabic/English labels;
- responsive dark futuristic interface;
- local Accounts API health indicator.

Local API:

- `http://127.0.0.1:3041`

Production requirements still open:

- managed database;
- real verification/reset email delivery;
- payment-provider customer and subscription adapter;
- secure HttpOnly cookie session migration;
- final privacy and legal approval.

No payment provider, production secret, commit, push, merge, or deployment
is performed by this phase.