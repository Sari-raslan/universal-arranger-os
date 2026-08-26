import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function ProductPage({ product, onHome }) {
  const { t } = useLanguage();

  return (
    <main id="main-content" className="section productPage">
      <div className="container">
        <button type="button" className="btn btnGhost" onClick={onHome}>
          ← {t.nav.home}
        </button>
        <span className="statusPill">{product.status}</span>
        <h1>{product.title}</h1>
        <p className="productTagline">{product.tagline}</p>
        <p className="proofLine">{product.proof}</p>
        <p className="ctaLine">{t.cta.pilot} · {t.cta.noPrice}</p>

        <section className="block" aria-labelledby="how-heading">
          <h2 id="how-heading">{t.sections.how}</h2>
          <ol className="pointList numbered">
            {product.howItWorks.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="block" aria-labelledby="feat-heading">
          <h2 id="feat-heading">{t.sections.features}</h2>
          <ul className="pointList">
            {product.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>

        <section className="block" aria-labelledby="lim-heading">
          <h2 id="lim-heading">{t.sections.limits}</h2>
          <ul className="pointList">
            {product.limitations.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>

        <section className="block" aria-labelledby="faq-heading">
          <h2 id="faq-heading">{t.sections.faq}</h2>
          <dl className="faqList">
            {product.faq.map((item) => (
              <div key={item.q}>
                <dt>{item.q}</dt>
                <dd>{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="block">
          <h2>{t.support.title}</h2>
          <p>{t.support.body}</p>
          <p>
            <a href={`mailto:${t.support.email}`}>{t.support.email}</a>
          </p>
        </section>
      </div>
    </main>
  );
}
