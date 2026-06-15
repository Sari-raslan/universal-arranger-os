function objectId(value) {
  return typeof value === "string"
    ? value
    : value?.id || null;
}

function canonicalPlanId(planId) {
  if (planId === "studio" || planId === "creator") {
    return "creator";
  }

  if (
    planId === "pro" ||
    planId === "professional"
  ) {
    return "professional";
  }

  throw new Error(`Founders schedule is not available for: ${planId}`);
}

export function foundersScheduleConfigured(config) {
  return Boolean(
    config?.foundersScheduleEnabled &&
    config?.creatorIntroPriceId &&
    config?.creatorRegularPriceId &&
    config?.professionalIntroPriceId &&
    config?.professionalRegularPriceId,
  );
}

export function foundersPricePair(config, planId) {
  const canonical = canonicalPlanId(planId);

  if (canonical === "creator") {
    return {
      planId: canonical,
      introPriceId: config.creatorIntroPriceId,
      regularPriceId: config.creatorRegularPriceId,
    };
  }

  return {
    planId: canonical,
    introPriceId: config.professionalIntroPriceId,
    regularPriceId: config.professionalRegularPriceId,
  };
}

export function buildFoundersScheduleUpdate({
  config,
  planId,
  schedule,
  subscription,
}) {
  if (!foundersScheduleConfigured(config)) {
    throw new Error("Founders Stripe schedule is not fully configured.");
  }

  const pair = foundersPricePair(config, planId);
  const startDate =
    schedule?.current_phase?.start ||
    schedule?.phases?.[0]?.start_date ||
    subscription?.current_period_start;

  if (!Number.isInteger(Number(startDate))) {
    throw new Error("Stripe subscription schedule start date is missing.");
  }

  return {
    end_behavior: "release",
    metadata: {
      uaosFoundersSchedule: "true",
      uaosPlanId: pair.planId,
      uaosIntroMonths: "3",
    },
    phases: [
      {
        start_date: Number(startDate),
        items: [
          {
            price: pair.introPriceId,
            quantity: 1,
          },
        ],
        duration: {
          interval: "month",
          interval_count: 3,
        },
        proration_behavior: "none",
        metadata: {
          uaosPricingPhase: "founders-intro",
          uaosPlanId: pair.planId,
        },
      },
      {
        items: [
          {
            price: pair.regularPriceId,
            quantity: 1,
          },
        ],
        proration_behavior: "none",
        metadata: {
          uaosPricingPhase: "regular",
          uaosPlanId: pair.planId,
        },
      },
    ],
  };
}

export async function ensureFoundersSubscriptionSchedule({
  stripe,
  config,
  planId,
  subscription,
  eventId,
}) {
  if (!foundersScheduleConfigured(config)) {
    return {
      enabled: false,
      scheduleId: objectId(subscription?.schedule),
      created: false,
      updated: false,
    };
  }

  const existingScheduleId = objectId(subscription?.schedule);

  if (existingScheduleId) {
    const existing =
      await stripe.subscriptionSchedules.retrieve(
        existingScheduleId,
      );

    if (
      existing.metadata?.uaosFoundersSchedule === "true"
    ) {
      return {
        enabled: true,
        scheduleId: existing.id,
        created: false,
        updated: false,
      };
    }

    throw new Error(
      "Subscription already has a non-UAOS Stripe schedule.",
    );
  }

  const idempotencyBase =
    String(eventId || subscription.id);

  const created =
    await stripe.subscriptionSchedules.create(
      {
        from_subscription: subscription.id,
      },
      {
        idempotencyKey:
          `uaos-founders-create-${idempotencyBase}`,
      },
    );

  const update = buildFoundersScheduleUpdate({
    config,
    planId,
    schedule: created,
    subscription,
  });

  const updated =
    await stripe.subscriptionSchedules.update(
      created.id,
      update,
      {
        idempotencyKey:
          `uaos-founders-update-${idempotencyBase}`,
      },
    );

  return {
    enabled: true,
    scheduleId: updated.id || created.id,
    created: true,
    updated: true,
  };
}

