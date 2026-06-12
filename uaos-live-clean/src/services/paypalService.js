export function initializePayPalSubscription(planName, price) {
  console.log(`💳 [PayPal API] Creating gateway for ${planName} at ${price} EUR/month`);
  // هيكلية الخصم: 3 أشهر مخفضة ثم العودة التلقائية للسعر الرسمي الشائع
  return {
    gateway: "LIVE_PRODUCTION",
    currency: "EUR",
    billingCycle: "MONTHLY",
    promoPeriodMonths: 3,
    status: "SUBSCRIBE_NOW_ACTIVE",
    successUrl: "https://universal-arranger-os.vercel.app/success"
  };
}
