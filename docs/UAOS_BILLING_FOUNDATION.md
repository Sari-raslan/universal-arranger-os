# UAOS Billing Foundation

Phase 8 exposes billing plans and entitlement foundations without enabling real payment collection.

## Plans

- Studio Founders: approved intro price EUR 7.99.
- Pro Arranger Founders: approved regular price EUR 29.99.
- Ultimate: planned and not for sale.

## Stripe Safety

Checkout, portal and production webhook effects remain disabled until Stripe keys, price IDs, webhook secrets and commercial approval are configured.

## Entitlements

Entitlements are derived from known plan IDs only. Unknown plan IDs do not grant paid capabilities.
