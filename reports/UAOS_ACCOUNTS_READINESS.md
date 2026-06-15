# UAOS Accounts and Authentication Readiness

Generated: 2026-06-13T19:14:33.560Z

Code ready: true
Production configured: false

## Files

- [x] server/accounts/passwords.mjs
- [x] server/accounts/tokens.mjs
- [x] server/accounts/stores.mjs
- [x] server/accounts/accountService.mjs
- [x] server/accounts/server.mjs
- [x] tests/accounts-auth.test.mjs
- [x] .env.accounts.example

## Production configuration

- [ ] production-database-adapter
- [ ] production-email-provider
- [ ] email-from-address
- [ ] public-base-url

## Security

- Passwords use scrypt with per-user salts.
- Raw session, verification and reset tokens are not stored.
- Password reset revokes existing sessions.
- Development tokens are hidden automatically in production mode.
- Production still requires a managed database and email provider.
