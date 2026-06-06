export const plans = [
  {
    id: 'early-access',
    name: 'UAOS Early Access',
    price: 25,
    currency: 'USD',
    payment: 'https://www.paypal.com/ncp/payment/4PHMPZL66YEG8'
  },
  {
    id: 'pro',
    name: 'UAOS Pro',
    price: 19,
    currency: 'USD/month',
    payment: 'COMING_SOON'
  }
];

export function listPlans() {
  return plans;
}
