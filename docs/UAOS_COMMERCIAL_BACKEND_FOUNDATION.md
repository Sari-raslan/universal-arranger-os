# UAOS Commercial Backend Foundation

This phase adds a provider-neutral commercial backend foundation.

Implemented:

- EUR monthly plans at 19.99 and 49.99;
- public plan endpoint;
- server-only environment validation;
- HMAC payment-webhook verification;
- idempotent webhook event processing interface;
- signed, device-bound license tokens;
- license verification endpoint;
- protected internal license issuance endpoint;
- readiness reports and automated tests.

Not enabled:

- a real Stripe, PayPal or other provider connection;
- production account storage;
- production subscription storage;
- email delivery;
- tax/VAT calculation;
- deployment;
- real secrets.

The memory idempotency store is for development tests only. Production must use
a database adapter and provider-specific webhook semantics.

No secret is written to frontend source.