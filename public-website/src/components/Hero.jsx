import { useLanguage } from '../i18n/LanguageContext.jsx';
import WaveBackground from './WaveBackground.jsx';

export default function Hero({ onNavigate }) {
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
            <button type="button" className="btn btnPrimary" onClick={() => onNavigate('/products/arranger-studio/')}>
              {t.hero.ctaArranger}
            </button>
            <button type="button" className="btn btnGhost" onClick={() => onNavigate('/products/midi-toolkit/')}>
              {t.hero.ctaMidi}
            </button>
            <button type="button" className="btn btnGhost" onClick={() => onNavigate('/products/singy/')}>
              {t.hero.ctaSingy}
            </button>
          </div>
          <p className="heroNote">{t.cta.pilot} · {t.cta.noPrice}</p>
        </div>
      </div>
    </section>
  );
}
