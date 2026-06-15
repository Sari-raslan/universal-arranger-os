import {
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { getPlan } from "../commercial/plans.mjs";
import {
  ensureFoundersSubscriptionSchedule,
  foundersScheduleConfigured,
} from "./foundersStripeSchedule.mjs";

const PRODUCTION_SESSION_COOKIE = "__Host-uaos_session";
const DEVELOPMENT_SESSION_COOKIE = "uaos_session";
const PRODUCTION_CSRF_COOKIE = "__Host-uaos_csrf";
const DEVELOPMENT_CSRF_COOKIE = "uaos_csrf";

function required(environment, name) {
  const value = String(environment[name] || "").trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function booleanValue(value, fallback = false) {
  if (value == null || value === "") {
    return fallback;
  }

  return /^(1|true|yes|on)$/i.test(String(value));
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function objectId(value) {
  return typeof value === "string"
    ? value
    : value?.id || null;
}

function unixToIso(seconds) {
  return seconds
    ? new Date(Number(seconds) * 1000).toISOString()
    : null;
}

function parseCookies(header = "") {
  const cookies = {};

  for (const section of String(header).split(";")) {
    const index = section.indexOf("=");

    if (index <= 0) {
      continue;
    }

    const name = section.slice(0, index).trim();
    const rawValue = section.slice(index + 1).trim();

    try {
      cookies[name] = decodeURIComponent(rawValue);
    } catch {
      cookies[name] = rawValue;
    }
  }

  return cookies;
}

async function loadStripeSdk(secretKey) {
  let imported;

  try {
    imported = await import("stripe");
  } catch (error) {
    const nextError = new Error(
      "Stripe SDK is not installed. Run npm run stripe:sdk:install after the npm SSL issue is resolved.",
    );
    nextError.cause = error;
    throw nextError;
  }

  const StripeConstructor =
    imported.default ||
    imported.Stripe ||
    imported;

  return new StripeConstructor(secretKey, {
    maxNetworkRetries: 2,
  });
}

export function readStripeConfig(
  environment = process.env,
  { strict = true } = {},
) {
  const foundersScheduleEnabled = booleanValue(
    environment.UAOS_STRIPE_FOUNDERS_SCHEDULE_ENABLED,
    false,
  );

  const config = {
    secretKey: String(
      environment.UAOS_STRIPE_SECRET_KEY || "",
    ),
    webhookSecret: String(
      environment.UAOS_STRIPE_WEBHOOK_SECRET || "",
    ),
    creatorPriceId: String(
      environment.UAOS_STRIPE_PRICE_CREATOR || "",
    ),
    professionalPriceId: String(
      environment.UAOS_STRIPE_PRICE_PROFESSIONAL || "",
    ),
    foundersScheduleEnabled,
    creatorIntroPriceId: String(
      environment.UAOS_STRIPE_PRICE_CREATOR_INTRO || "",
    ),
    creatorRegularPriceId: String(
      environment.UAOS_STRIPE_PRICE_CREATOR_REGULAR ||
      environment.UAOS_STRIPE_PRICE_CREATOR ||
      "",
    ),
    professionalIntroPriceId: String(
      environment.UAOS_STRIPE_PRICE_PROFESSIONAL_INTRO ||
      "",
    ),
    professionalRegularPriceId: String(
      environment.UAOS_STRIPE_PRICE_PROFESSIONAL_REGULAR ||
      environment.UAOS_STRIPE_PRICE_PROFESSIONAL ||
      "",
    ),
    automaticTax: booleanValue(
      environment.UAOS_STRIPE_AUTOMATIC_TAX,
      false,
    ),
    allowPromotionCodes: booleanValue(
      environment.UAOS_STRIPE_ALLOW_PROMOTION_CODES,
      true,
    ),
  };

  if (strict) {
    required(environment, "UAOS_STRIPE_SECRET_KEY");
    required(environment, "UAOS_STRIPE_WEBHOOK_SECRET");

    if (foundersScheduleEnabled) {
      required(
        environment,
        "UAOS_STRIPE_PRICE_CREATOR_INTRO",
      );
      required(
        environment,
        "UAOS_STRIPE_PRICE_CREATOR_REGULAR",
      );
      required(
        environment,
        "UAOS_STRIPE_PRICE_PROFESSIONAL_INTRO",
      );
      required(
        environment,
        "UAOS_STRIPE_PRICE_PROFESSIONAL_REGULAR",
      );
    } else {
      required(environment, "UAOS_STRIPE_PRICE_CREATOR");
      required(
        environment,
        "UAOS_STRIPE_PRICE_PROFESSIONAL",
      );
    }
  }

  return Object.freeze(config);
}

export function stripeStatus(environment = process.env) {
  const foundersScheduleEnabled = booleanValue(
    environment.UAOS_STRIPE_FOUNDERS_SCHEDULE_ENABLED,
    false,
  );

  const checks = [
    {
      name: "stripe-secret-key",
      passed: Boolean(environment.UAOS_STRIPE_SECRET_KEY),
    },
    {
      name: "stripe-webhook-secret",
      passed: Boolean(
        environment.UAOS_STRIPE_WEBHOOK_SECRET,
      ),
    },
  ];

  if (foundersScheduleEnabled) {
    checks.push(
      {
        name: "creator-intro-price",
        passed: Boolean(
          environment.UAOS_STRIPE_PRICE_CREATOR_INTRO,
        ),
      },
      {
        name: "creator-regular-price",
        passed: Boolean(
          environment.UAOS_STRIPE_PRICE_CREATOR_REGULAR,
        ),
      },
      {
        name: "professional-intro-price",
        passed: Boolean(
          environment.UAOS_STRIPE_PRICE_PROFESSIONAL_INTRO,
        ),
      },
      {
        name: "professional-regular-price",
        passed: Boolean(
          environment.UAOS_STRIPE_PRICE_PROFESSIONAL_REGULAR,
        ),
      },
    );
  } else {
    checks.push(
      {
        name: "creator-price",
        passed: Boolean(
          environment.UAOS_STRIPE_PRICE_CREATOR,
        ),
      },
      {
        name: "professional-price",
        passed: Boolean(
          environment.UAOS_STRIPE_PRICE_PROFESSIONAL,
        ),
      },
    );
  }

  return {
    foundersScheduleEnabled,
    checks,
    configured: checks.every((check) => check.passed),
  };
}

function cookieNames(production) {
  return {
    session: production
      ? PRODUCTION_SESSION_COOKIE
      : DEVELOPMENT_SESSION_COOKIE,
    csrf: production
      ? PRODUCTION_CSRF_COOKIE
      : DEVELOPMENT_CSRF_COOKIE,
  };
}

export function createSessionCookies(
  token,
  { production = true } = {},
) {
  const csrf = randomBytes(24).toString("base64url");
  const names = cookieNames(production);
  const secure = production ? "; Secure" : "";

  return {
    csrf,
    headers: [
      `${names.session}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`,
      `${names.csrf}=${encodeURIComponent(csrf)}; Path=/; SameSite=Lax; Max-Age=2592000${secure}`,
    ],
  };
}

export function clearSessionCookies(
  { production = true } = {},
) {
  const names = cookieNames(production);
  const secure = production ? "; Secure" : "";

  return [
    `${names.session}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
    `${names.csrf}=; Path=/; SameSite=Lax; Max-Age=0${secure}`,
  ];
}

export function readSessionToken(
  request,
  { production = true } = {},
) {
  const names = cookieNames(production);
  const cookies = parseCookies(
    request.headers.cookie || "",
  );

  if (cookies[names.session]) {
    return cookies[names.session];
  }

  const match = /^Bearer\s+(.+)$/i.exec(
    String(request.headers.authorization || ""),
  );

  return match?.[1] || null;
}

export function assertCsrf(
  request,
  {
    origin,
    production = true,
  },
) {
  if (String(request.headers.origin || "") !== origin) {
    throw new Error("CSRF origin check failed.");
  }

  const names = cookieNames(production);
  const cookies = parseCookies(
    request.headers.cookie || "",
  );
  const headerToken = String(
    request.headers["x-uaos-csrf"] || "",
  );

  if (!safeEqual(cookies[names.csrf], headerToken)) {
    throw new Error("CSRF token check failed.");
  }
}

export class StripeBilling {
  constructor({
    config,
    publicBaseUrl,
    pool,
    stripe = null,
  }) {
    this.config = config;
    this.publicBaseUrl = String(publicBaseUrl).replace(
      /\/+$/,
      "",
    );
    this.pool = pool;
    this.injectedStripe = stripe;
    this.stripePromise = stripe
      ? Promise.resolve(stripe)
      : null;
  }

  async client() {
    if (!this.stripePromise) {
      this.stripePromise = loadStripeSdk(
        this.config.secretKey,
      ).catch((error) => {
        this.stripePromise = null;
        throw error;
      });
    }

    return this.stripePromise;
  }

  foundersEnabled() {
    return foundersScheduleConfigured(this.config);
  }

  price(planId) {
    const plan = getPlan(planId);
    const canonicalPlanId = plan.id;

    if (this.foundersEnabled()) {
      return canonicalPlanId === "creator"
        ? this.config.creatorIntroPriceId
        : this.config.professionalIntroPriceId;
    }

    return canonicalPlanId === "creator"
      ? this.config.creatorPriceId
      : this.config.professionalPriceId;
  }

  plan(priceId) {
    const creatorPrices = new Set([
      this.config.creatorPriceId,
      this.config.creatorIntroPriceId,
      this.config.creatorRegularPriceId,
    ].filter(Boolean));

    const professionalPrices = new Set([
      this.config.professionalPriceId,
      this.config.professionalIntroPriceId,
      this.config.professionalRegularPriceId,
    ].filter(Boolean));

    if (creatorPrices.has(priceId)) {
      return "creator";
    }

    if (professionalPrices.has(priceId)) {
      return "professional";
    }

    throw new Error(`Unknown Stripe price: ${priceId}`);
  }

  async ensureFoundersSchedule({
    subscription,
    planId,
    eventId,
  }) {
    const stripe = await this.client();

    return ensureFoundersSubscriptionSchedule({
      stripe,
      config: this.config,
      planId,
      subscription,
      eventId,
    });
  }

  async checkout({
    user,
    customerId,
    planId,
  }) {
    const stripe = await this.client();
    const metadata = {
      uaosUserId: user.id,
      uaosPlanId: planId,
      uaosEmail: user.email,
      uaosFoundersSchedule:
        this.foundersEnabled() ? "true" : "false",
    };

    const session =
      await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: this.price(planId),
            quantity: 1,
          },
        ],
        success_url:
          `${this.publicBaseUrl}/#/account?checkout=success`,
        cancel_url:
          `${this.publicBaseUrl}/#/pricing?checkout=cancelled`,
        client_reference_id: user.id,
        ...(customerId
          ? { customer: customerId }
          : { customer_email: user.email }),
        billing_address_collection: "required",
        allow_promotion_codes:
          this.config.allowPromotionCodes,
        automatic_tax: {
          enabled: this.config.automaticTax,
        },
        metadata,
        subscription_data: {
          metadata,
        },
      });

    if (!session.url) {
      throw new Error("Stripe Checkout URL missing.");
    }

    return {
      id: session.id,
      url: session.url,
    };
  }

  async portal(customerId) {
    if (!customerId) {
      throw new Error("Stripe customer is not linked.");
    }

    const stripe = await this.client();
    const session =
      await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url:
          `${this.publicBaseUrl}/#/account`,
      });

    return {
      id: session.id,
      url: session.url,
    };
  }

  async event(rawBody, signature) {
    const stripe = await this.client();

    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.config.webhookSecret,
    );
  }

  normalizeStatus(value) {
    if (value === "active" || value === "trialing") {
      return "active";
    }

    if (value === "canceled") {
      return "cancelled";
    }

    if (
      value === "unpaid" ||
      value === "incomplete_expired"
    ) {
      return "expired";
    }

    return "past_due";
  }

  record(subscription) {
    return {
      planId: this.plan(
        subscription.items?.data?.[0]?.price?.id,
      ),
      status: this.normalizeStatus(
        subscription.status,
      ),
      customerId: objectId(
        subscription.customer,
      ),
      subscriptionId: subscription.id,
      scheduleId: objectId(subscription.schedule),
      currentPeriodEnd: unixToIso(
        subscription.current_period_end,
      ),
    };
  }

  async customerForUser(userId) {
    const result = await this.pool.query(
      `
        SELECT stripe_customer_id
        FROM uaos_users
        WHERE id = $1
      `,
      [userId],
    );

    return result.rows[0]?.stripe_customer_id || null;
  }

  async claim(event) {
    const result = await this.pool.query(
      `
        INSERT INTO uaos_payment_events (
          event_id,
          event_type,
          status
        )
        VALUES ($1, $2, 'processing')
        ON CONFLICT (event_id) DO NOTHING
        RETURNING event_id
      `,
      [event.id, event.type],
    );

    return result.rowCount > 0;
  }

  async complete(eventId, userId = null) {
    await this.pool.query(
      `
        UPDATE uaos_payment_events
        SET
          status = 'completed',
          user_id = COALESCE($2, user_id),
          completed_at = NOW(),
          error_message = NULL
        WHERE event_id = $1
      `,
      [eventId, userId],
    );
  }

  async fail(eventId, error) {
    await this.pool.query(
      `
        UPDATE uaos_payment_events
        SET
          status = 'failed',
          error_message = $2
        WHERE event_id = $1
      `,
      [
        eventId,
        String(error?.message || error).slice(0, 1000),
      ],
    );
  }

  async save(userId, record) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `
          UPDATE uaos_users
          SET stripe_customer_id = $2
          WHERE id = $1
        `,
        [userId, record.customerId],
      );

      await client.query(
        `
          INSERT INTO uaos_subscriptions (
            user_id,
            plan_id,
            status,
            provider_customer_id,
            provider_subscription_id,
            provider_schedule_id,
            current_period_end,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (user_id)
          DO UPDATE SET
            plan_id = EXCLUDED.plan_id,
            status = EXCLUDED.status,
            provider_customer_id =
              EXCLUDED.provider_customer_id,
            provider_subscription_id =
              EXCLUDED.provider_subscription_id,
            provider_schedule_id =
              EXCLUDED.provider_schedule_id,
            current_period_end =
              EXCLUDED.current_period_end,
            updated_at = NOW()
        `,
        [
          userId,
          record.planId,
          record.status,
          record.customerId,
          record.subscriptionId,
          record.scheduleId,
          record.currentPeriodEnd,
        ],
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async userForCustomer(customerId) {
    const result = await this.pool.query(
      `
        SELECT id
        FROM uaos_users
        WHERE stripe_customer_id = $1
      `,
      [customerId],
    );

    return result.rows[0]?.id || null;
  }

  async process(event) {
    if (!(await this.claim(event))) {
      return {
        accepted: true,
        duplicate: true,
      };
    }

    let userId = null;

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        if (session.mode === "subscription") {
          userId =
            session.metadata?.uaosUserId ||
            session.client_reference_id;

          const stripe = await this.client();
          const subscription =
            await stripe.subscriptions.retrieve(
              objectId(session.subscription),
            );

          const foundersSchedule =
            await this.ensureFoundersSchedule({
              subscription,
              planId:
                session.metadata?.uaosPlanId ||
                this.plan(
                  subscription.items?.data?.[0]?.price?.id,
                ),
              eventId: event.id,
            });

          const record = this.record(subscription);
          record.scheduleId =
            foundersSchedule.scheduleId ||
            record.scheduleId;

          await this.save(userId, record);
        }
      } else if (
        [
          "customer.subscription.created",
          "customer.subscription.updated",
          "customer.subscription.deleted",
        ].includes(event.type)
      ) {
        const record = this.record(
          event.data.object,
        );

        userId = await this.userForCustomer(
          record.customerId,
        );

        if (!userId) {
          throw new Error(
            "Stripe customer is not linked.",
          );
        }

        await this.save(userId, record);
      } else if (
        event.type === "invoice.payment_failed"
      ) {
        await this.pool.query(
          `
            UPDATE uaos_subscriptions
            SET
              status = 'past_due',
              updated_at = NOW()
            WHERE provider_customer_id = $1
          `,
          [
            objectId(
              event.data.object.customer,
            ),
          ],
        );
      }

      await this.complete(event.id, userId);

      return {
        accepted: true,
        duplicate: false,
      };
    } catch (error) {
      await this.fail(event.id, error);
      throw error;
    }
  }
}
