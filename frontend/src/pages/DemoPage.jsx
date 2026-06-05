import React from 'react';

const DEMO_VIDEO = 'https://uaos-animated-explainer-logo-737954605821.europe-west3.run.app';

export default function DemoPage() {
  return (
    <main style={{ padding: 40, maxWidth: 900, margin: '0 auto' }}>
      <h1>Demo Video</h1>

      <p>Watch the UAOS intro and feature preview.</p>

      <a href={DEMO_VIDEO}>
        Open Demo Video
      </a>

      <div style={{ marginTop: 30 }}>
        <p>If the demo link is not active yet, replace it in launch config before sharing invitations.</p>
      </div>
    </main>
  );
}
