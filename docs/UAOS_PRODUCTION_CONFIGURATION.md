# UAOS Production Configuration

Production activation is intentionally false until external configuration is complete.

## Required Configuration

- PostgreSQL database URL and migration approval.
- SMTP host, credentials and verified sender.
- Stripe secret key, webhook secret, price IDs and billing approval.
- UAOS session secret and rotation policy.
- TLS, domain, proxy and backup configuration.
- Legal/privacy/commercial approvals.

## Current State

Local development can run the Phase 8 API with memory providers. This is not a production deployment.
