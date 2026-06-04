import React, { useEffect, useState } from 'react';

const PAYPAL_CLIENT_ID =
  import.meta.env.VITE_PAYPAL_CLIENT_ID || 'PASTE_PAYPAL_CLIENT_ID_HERE';

const API_BASE =
  import.meta.env.VITE_PAYPAL_API_BASE || 'http://localhost:3010/api/paypal';

export default function SecurePayPalCheckout() {
  const [email, setEmail] = useState('');
  const [license, setLicense] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID.includes('PASTE_')) {
      setError('Missing PayPal client ID.');
      return;
    }

    const existing = document.querySelector('script[data-uaos-paypal]');
    if (existing && window.paypal) return;

    const script = document.createElement('script');
    script.dataset.uaosPaypal = 'true';
    script.src =
      `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
    script.async = true;

    script.onerror = () => {
      setError('Failed to load PayPal SDK.');
    };

    document.body.appendChild(script);

    return () => {};
  }, []);

  useEffect(() => {
    if (!email || !window.paypal) return;

    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    container.innerHTML = '';

    window.paypal.Buttons({
      async createOrder() {
        setError('');

        const response = await fetch(`${API_BASE}/create-order`, {
          method: 'POST',
          headers: {
            'x-uaos-email': email
          }
        });

        const order = await response.json();

        if (!response.ok) {
          throw new Error(order.error || 'Order creation failed');
        }

        return order.id;
      },

      async onApprove(data) {
        const response = await fetch(`${API_BASE}/capture-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-uaos-email': email
          },
          body: JSON.stringify({
            orderID: data.orderID
          })
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          setError(result.error || 'Payment verification failed');
          return;
        }

        setLicense(result.licenseToken);
      },

      onError(err) {
        setError(err?.message || 'PayPal checkout failed.');
      }
    }).render('#paypal-button-container');
  }, [email]);

  return (
    <div style={{ padding: 24, border: '1px solid #333', borderRadius: 12 }}>
      <h2>Buy UAOS Early Access</h2>

      <p>Enter your email, then complete PayPal checkout.</p>

      <input
        style={{ padding: 12, width: '100%', marginBottom: 16 }}
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <div id="paypal-button-container"></div>

      {error && (
        <p style={{ color: 'tomato' }}>{error}</p>
      )}

      {license && (
        <div style={{ marginTop: 20 }}>
          <h3>Payment verified</h3>
          <p>Your UAOS license:</p>
          <code>{license}</code>
        </div>
      )}
    </div>
  );
}
