# UAOS Final External Activation Checklist

The application code, frontend build, regression tests, runtime checks,
desktop smoke checks, Stripe founders schedule code, and final launch gate
are complete.

The remaining work depends on private credentials, physical hardware,
legal approval, signing material, or an explicit publishing decision.

## Stripe test mode

- Install the official Stripe Node SDK.
- Create four recurring monthly Price IDs:
  - Studio introductory EUR 7.99.
  - Studio regular EUR 12.99.
  - Pro introductory EUR 19.99.
  - Pro regular EUR 29.99.
- Configure the webhook secret.
- Run a complete test-mode checkout.
- Confirm the subscription schedule changes after three paid months.
- Confirm duplicate webhook delivery is idempotent.
- Do not switch to live keys before the test report passes.

## PostgreSQL

- Create the managed PostgreSQL database.
- Store the private connection string outside Git.
- Review migrations 001, 002, and 003.
- Execute migrations manually after a backup.
- Verify account, subscription, customer, and schedule records.

## SMTP

- Configure the SMTP provider.
- Verify the sender domain.
- Send real verification and password-reset messages to a controlled address.
- Confirm tokens are not exposed in production responses.

## Legal and privacy

- Review Terms, Privacy Policy, subscription language, cancellation rules,
  founders-price wording, data retention, and refund policy.
- Set approval variables only after human review.

## Hardware and desktop

- Test a real MIDI keyboard.
- Test KORG/Yamaha/Roland/Ketron profiles with connected hardware.
- Obtain a Windows code-signing certificate.
- Sign and verify the Windows installer.

## Publishing

Publishing is intentionally excluded from the automatic launcher.
Commit, push, merge, domain connection, and deployment require explicit
approval after the private activation report passes.
