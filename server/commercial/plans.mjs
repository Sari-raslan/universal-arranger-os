const PLAN_ALIASES = Object.freeze({
  sing: "free",
  studio: "creator",
  pro: "professional",
  performer: "ultimate",
});

export const UAOS_PLANS = Object.freeze({
  free: Object.freeze({
    id: "free",
    productId: "sing",
    name: "UAOS Free / Sing",
    currency: "EUR",
    amountMinor: 0,
    launchAmountMinor: 0,
    regularAmountMinor: 0,
    launchMonths: 0,
    interval: null,
    requiresPayment: false,
    status: "available",
    features: Object.freeze([
      "UAOS account",
      "Basic voice workflow",
      "Limited local projects",
    ]),
  }),
  creator: Object.freeze({
    id: "creator",
    productId: "studio",
    name: "UAOS Studio",
    currency: "EUR",
    amountMinor: 1299,
    launchAmountMinor: 799,
    regularAmountMinor: 1299,
    launchMonths: 3,
    interval: "month",
    requiresPayment: true,
    status: "experimental",
    features: Object.freeze([
      "UAOS Studio",
      "Timeline and sessions",
      "Local WAV sampler",
      "Standard MIDI tools",
    ]),
  }),
  professional: Object.freeze({
    id: "professional",
    productId: "pro",
    name: "UAOS Pro Arranger",
    currency: "EUR",
    amountMinor: 2999,
    launchAmountMinor: 1999,
    regularAmountMinor: 2999,
    launchMonths: 3,
    interval: "month",
    requiresPayment: true,
    status: "experimental",
    features: Object.freeze([
      "Everything in Studio",
      "Pro Arranger",
      "Open Style Engine",
      "Advanced hardware profiles",
    ]),
  }),
  ultimate: Object.freeze({
    id: "ultimate",
    productId: "ultimate",
    name: "UAOS Ultimate / Performer",
    currency: "EUR",
    amountMinor: 4999,
    launchAmountMinor: null,
    regularAmountMinor: 4999,
    launchMonths: 0,
    interval: "month",
    requiresPayment: true,
    status: "planned",
    features: Object.freeze([
      "Future verified keyboard integrations",
      "Future premium libraries",
      "Future commercial support",
    ]),
  }),
});

export function getPublicPlans() {
  return Object.values(UAOS_PLANS).map((plan) => ({
    id: plan.id,
    productId: plan.productId,
    name: plan.name,
    currency: plan.currency,
    amountMinor: plan.amountMinor,
    launchAmountMinor: plan.launchAmountMinor,
    regularAmountMinor: plan.regularAmountMinor,
    launchMonths: plan.launchMonths,
    interval: plan.interval,
    requiresPayment: plan.requiresPayment,
    status: plan.status,
    features: [...plan.features],
  }));
}

export function getPlan(planId) {
  const requested = String(planId || "");
  const canonicalId = PLAN_ALIASES[requested] || requested;
  const plan = UAOS_PLANS[canonicalId];

  if (!plan) {
    throw new RangeError(`Unknown UAOS plan: ${planId}`);
  }

  return plan;
}