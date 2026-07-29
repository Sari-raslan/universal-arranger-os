import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function ComparisonSection() {
  const { t } = useLanguage();

  return (
    <section className="section" aria-labelledby="comparison-heading">
      <div className="container">
        <div className="sectionHeader">
          <h2 id="comparison-heading">{t.comparison.title}</h2>
        </div>
        <div className="comparisonGrid">
          <div className="comparisonCard">
            <h3>{t.comparison.kidsLabel}</h3>
            <p>{t.comparison.kidsDesc}</p>
          </div>
          <div className="comparisonCard">
            <h3>{t.comparison.teenLabel}</h3>
            <p>{t.comparison.teenDesc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
