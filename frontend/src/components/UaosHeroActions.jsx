import React from 'react';
import { UAOS_LINKS } from '../services/uaosLinks.js';

export default function UaosHeroActions() {
  return (
    <section className="uaosProductBand uaosHeroActions">
      <div>
        <p className="eyebrow">Product Demo</p>
        <h2>Watch UAOS in Action</h2>
        <p>
          See how UAOS turns music ideas, sheet images, MIDI files, and keyboard styles
          into a personalized arrangement workflow.
        </p>
      </div>

      <div className="uaosVideoFrame">
        <iframe
          src={UAOS_LINKS.explainer}
          title="UAOS Explainer"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <div className="uaosActions" aria-label="UAOS product actions">
        <a href="/pricing" className="primaryLink">View Pricing</a>
        <a href={UAOS_LINKS.starterPayPal} className="secondaryLink">Buy Starter EUR 19.99</a>
        <a href={UAOS_LINKS.proPayPal} className="secondaryLink">Buy Pro EUR 49.99</a>
        <a href={UAOS_LINKS.logoShowcase} className="secondaryLink">Logo Showcase</a>
      </div>
    </section>
  );
}
