# UAOS Accounts And Authentication

Phase 8 implements account foundations for local development and tests.

## Account Flow

- Register with normalized email and password policy validation.
- Verify email through a generated verification token.
- Login after verification.
- Request password reset and reset with a token.
- Logout one session or all sessions.

## Session Safety

Sessions use opaque tokens, server-side records, HttpOnly cookie metadata in Express responses and CSRF tokens for state-changing account/session operations.

## Password Safety

Passwords are hashed with salted PBKDF2. Plaintext passwords are not returned by APIs or audit payloads.
