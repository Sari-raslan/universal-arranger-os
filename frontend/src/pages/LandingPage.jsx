import React from 'react';

export default function LandingPage() {
  return (
    <main style={{ padding: 40, maxWidth: 1100, margin: '0 auto' }}>
      <section style={{ textAlign: 'center', padding: '60px 0' }}>
        <h1>Universal Arranger OS</h1>
        <p style={{ fontSize: 22 }}>
          AI-powered arranger workstation for MIDI, sheet music, live audio,
          styles, sound libraries, and keyboard production.
        </p>

        <div style={{ marginTop: 30 }}>
          <a href="/pricing" style={{ margin: 10 }}>Buy Early Access</a>
          <a href="/downloads" style={{ margin: 10 }}>Download</a>
          <a href="/features" style={{ margin: 10 }}>AI Features</a>
          <a href="/demo" style={{ margin: 10 }}>Watch Demo</a>
          <a href="/app" style={{ margin: 10 }}>Open App</a>
        </div>
      </section>

      <section>
        <h2>What UAOS Does</h2>
        <ul>
          <li>Convert sheet music images into MIDI.</li>
          <li>Capture live melodies and generate arrangements.</li>
          <li>Manage SET, STY, MID, KMP, PAD and arranger files.</li>
          <li>Use factory sound libraries and sound engine foundations.</li>
          <li>Export and prepare music for desktop, Android, and studio workflows.</li>
        </ul>
      </section>

      <section>
        <h2>Platform Status</h2>
        <p>Web, Desktop, Android, OMR, Live Audio, PayPal, and Sound Library layers are active.</p>
      </section>
    </main>
  );
}
