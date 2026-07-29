import { useLanguage } from '../i18n/LanguageContext.jsx';
import SingyMark from './SingyMark.jsx';
import WaveBackground from './WaveBackground.jsx';

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="hero" id="top">
      <WaveBackground />
      <div className="container heroInner">
        <div className="heroContent">
          <span className="eyebrow">{t.hero.eyebrow}</span>
          <h1 className="heroTitle">{t.hero.title}</h1>
          <p className="heroSubtitle">{t.hero.subtitle}</p>
          <div className="heroActions">
            <a className="btn btnPrimary" href={`#${t.kids.id}`}>{t.hero.ctaKids}</a>
            <a className="btn btnGhost" href={`#${t.teen.id}`}>{t.hero.ctaTeen}</a>
          </div>
        </div>
        <div className="heroVisual">
          <div className="glassOrb">
            <SingyMark title={t.hero.markAlt} />
          </div>
        </div>
      </div>
    </section>
  );
}
