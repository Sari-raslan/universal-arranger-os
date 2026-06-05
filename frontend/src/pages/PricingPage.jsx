import React from 'react';

const PAYPAL_LINK = 'https://www.paypal.com/ncp/payment/4PHMPZL66YEG8';

export default function PricingPage() {
  return (
    <main style={{ padding: 40, maxWidth: 900, margin: '0 auto' }}>
      <h1>UAOS Early Access</h1>
      <p>Support development and get early access to Universal Arranger OS.</p>

      <div style={{
        border: '1px solid #444',
        borderRadius: 16,
        padding: 30,
        marginTop: 30
      }}>
        <h2>Early Access License</h2>
        <h3>$25</h3>
        <ul>
          <li>Windows desktop build</li>
          <li>Android APK access</li>
          <li>Web platform access</li>
          <li>OMR to MIDI beta</li>
          <li>Live audio to MIDI arranger</li>
          <li>Future updates during beta</li>
        </ul>

        <a href={PAYPAL_LINK}>
          Buy / Support UAOS
        </a>
      </div>
    </main>
  );
}
