export const launchOffer = Object.freeze({
  currency: "EUR",
  durationMonths: 3,
  cancellation: "Cancel any time",
  disclosure:
    "The regular monthly price starts after the first three paid months.",
  paymentScheduleVerified: false,
});

export const pricingPlans = Object.freeze([
  Object.freeze({
    id: "sing",
    backendPlanId: "free",
    name: "UAOS Free / Sing",
    launchPriceEur: 0,
    regularPriceEur: 0,
    launchMonths: 0,
    price: "Free",
    billingLabel: "Free",
    requiresPayment: false,
    checkoutEnabled: false,
    checkoutStatus: "not-required",
    status: "available",
    text:
      "Voice capture, basic pitch analysis, limited projects, and a safe introduction to UAOS.",
  }),
  Object.freeze({
    id: "studio",
    backendPlanId: "creator",
    name: "UAOS Studio",
    launchPriceEur: 7.99,
    regularPriceEur: 12.99,
    launchMonths: 3,
    price:
      "7.99 EUR/month for the first 3 months, then 12.99 EUR/month",
    billingLabel: "Founders launch offer",
    requiresPayment: true,
    checkoutEnabled: false,
    checkoutStatus: "intro-schedule-verification-required",
    status: "experimental",
    text:
      "Studio, timeline, sessions, core libraries, sampler foundations, MIDI tools, and creator exports.",
  }),
  Object.freeze({
    id: "pro",
    backendPlanId: "professional",
    name: "UAOS Pro Arranger",
    launchPriceEur: 19.99,
    regularPriceEur: 29.99,
    launchMonths: 3,
    price:
      "19.99 EUR/month for the first 3 months, then 29.99 EUR/month",
    billingLabel: "Founders launch offer",
    requiresPayment: true,
    checkoutEnabled: false,
    checkoutStatus: "intro-schedule-verification-required",
    status: "experimental",
    text:
      "Studio features plus professional arranger foundations, advanced libraries, device profiles, and higher AI limits.",
  }),
  Object.freeze({
    id: "ultimate",
    backendPlanId: "ultimate",
    name: "UAOS Ultimate / Performer",
    launchPriceEur: null,
    regularPriceEur: 49.99,
    launchMonths: 0,
    price: "49.99 EUR/month - planned",
    billingLabel: "Future professional tier",
    requiresPayment: true,
    checkoutEnabled: false,
    checkoutStatus: "planned",
    status: "planned",
    text:
      "Reserved for verified keyboard integrations, premium libraries, stable desktop delivery, and commercial support.",
  }),
]);

export function findPricingPlan(id) {
  return (
    pricingPlans.find(
      (plan) =>
        plan.id === id ||
        plan.backendPlanId === id,
    ) || null
  );
}