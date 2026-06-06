export const plans = [
  {
    id: 'starter',
    name: 'UAOS Starter',
    price: '€19.99',
    description: 'Personal AI arranger access',
    payment: 'https://www.paypal.com/ncp/payment/4PHMPZL66YEG8',
    features: [
      'Web platform access',
      'Music taste AI profile',
      'Personalized arrangement engine',
      'MIDI generation beta',
      'Cloud sync beta'
    ]
  },

  {
    id: 'pro',
    name: 'UAOS Pro',
    price: '€49.99',
    description: 'Full professional arranger toolkit',
    payment: 'https://www.paypal.com/ncp/payment/2W2D2VXEDNTBU',
    features: [
      'Everything in Starter',
      'Advanced arranger engine',
      'OMR to MIDI tools',
      'Style generation tools',
      'Realtime AI assistant',
      'Priority updates'
    ]
  }
]

export function listPlans() {
  return plans
}
