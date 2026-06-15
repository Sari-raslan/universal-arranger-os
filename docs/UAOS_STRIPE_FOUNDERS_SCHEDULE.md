# UAOS Stripe Founders Schedule

This code supports the approved founders offer:

- Studio: EUR 7.99/month for the first 3 paid months, then EUR 12.99/month.
- Pro: EUR 19.99/month for the first 3 paid months, then EUR 29.99/month.

## Safe activation model

1. Checkout creates the subscription using the introductory Price ID.
2. The verified `checkout.session.completed` webhook retrieves the subscription.
3. UAOS creates a Stripe Subscription Schedule from that existing subscription.
4. UAOS updates the schedule with two phases:
   - phase 1: introductory price, duration 3 months;
   - phase 2: regular price, continuing afterward.
5. `end_behavior=release` keeps the subscription running at the regular price
   after the schedule is released.
6. UAOS refuses to overwrite an existing schedule that it did not create.

The feature is disabled by default. Enabling it requires the four Price IDs in
`.env.stripe.production.example`, the Stripe SDK, test-mode validation, webhook
validation, database migrations 001-003, and explicit production approval.

No Stripe request, payment, charge, migration, deployment, commit, or push is
performed by the code-generation launcher.

