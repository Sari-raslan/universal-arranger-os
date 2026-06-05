import React from 'react';
import messages from '../i18n/messages.json';
import { detectLanguage } from '../i18n/detectLanguage';

const INTRO_VIDEO_URL = 'https://uaos-animated-explainer-logo-737954605821.europe-west3.run.app';

export default function LaunchHero() {
  const lang = detectLanguage();
  const t = messages[lang] || messages.en;
  const direction = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <section className="launchHero" dir={direction}>
      <div className="launchHeroText">
        <p className="eyebrow">UAOS Super Launch</p>
        <h1>{t.title}</h1>
        <p className="launchSubtitle">{t.subtitle}</p>

        <div className="launchActions">
          <a className="primaryLink" href="/launch/payment.html">{t.buy}</a>
          <a className="secondaryLink" href="#music-taste">{t.taste}</a>
          <a className="secondaryLink" href="/app">{t.cta}</a>
        </div>
      </div>

      <div className="launchVideo" aria-label="UAOS launch video">
        {INTRO_VIDEO_URL ? (
          <iframe
            src={INTRO_VIDEO_URL}
            title="UAOS Intro Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <p>{t.videoUnavailable}</p>
        )}
      </div>
    </section>
  );
}
