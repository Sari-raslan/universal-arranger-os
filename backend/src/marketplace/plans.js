export const plans = [
  {
    id: 'starter',
    name: 'UAOS Starter',
    price: '€19.99',
    description: 'Personal AI arranger access for musicians, keyboard players, and early supporters.',
    payment: 'https://www.paypal.com/ncp/payment/4PHMPZL66YEG8',
    features: [
      'Web platform access',
      'Music taste AI profile',
      'Personalized arrangement engine',
      'MIDI planning beta',
      'Music taste upload panel',
      'Early access updates'
    ]
  },
  {
    id: 'pro',
    name: 'UAOS Pro',
    price: '€49.99',
    description: 'Full professional arranger toolkit for serious production and advanced workflows.',
    payment: 'https://www.paypal.com/ncp/payment/2W2D2VXEDNTBU',
    features: [
      'Everything in Starter',
      'Advanced arranger engine',
      'OMR to MIDI tools',
      'Style generation planning',
      'Realtime AI assistant',
      'Marketplace and release readiness tools',
      'Priority roadmap access'
    ]
  }
]

export function listPlans() {
  return plans
}
