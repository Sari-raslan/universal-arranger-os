import React from 'react';

const plans = [
  {
    id: 'starter',
    name: 'UAOS Starter',
    price: '€19.99',
    payment: 'https://www.paypal.com/ncp/payment/4PHMPZL66YEG8',
    description: 'Personal AI arranger access.',
    features: [
      'Web platform access',
      'Music taste AI profile',
      'Personalized arrangement engine',
      'MIDI planning beta',
      'Early access updates'
    ]
  },
  {
    id: 'pro',
    name: 'UAOS Pro',
    price: '€49.99',
    payment: 'https://www.paypal.com/ncp/payment/2W2D2VXEDNTBU',
    description: 'Full professional arranger toolkit.',
    features: [
      'Everything in Starter',
      'Advanced arranger engine',
      'OMR to MIDI tools',
      'Style generation planning',
      'Realtime AI assistant',
      'Priority roadmap access'
    ]
  }
];

export default function PricingPage() {
  return (
    <main style={{ minHeight: '100vh', padding: 48, background: '#111514', color: 'white' }}>
      <h1>UAOS Early Access</h1>
      <p>Choose your Universal Arranger OS access plan.</p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        marginTop: 32
      }}>
        {plans.map((plan) => (
          <section key={plan.id} style={{ border: '1px solid #6d6255', borderRadius: 16, padding: 28 }}>
            <h2>{plan.name}</h2>
            <h3>{plan.price}</h3>
            <p>{plan.description}</p>

            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <a
              href={plan.payment}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                marginTop: 16,
                padding: '12px 18px',
                borderRadius: 10,
                background: '#ffd166',
                color: '#111',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              Buy {plan.name}
            </a>
          </section>
        ))}
      </div>
    </main>
  );
}
