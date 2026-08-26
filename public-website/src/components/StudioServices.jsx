import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function StudioServices() {
  const { t } = useLanguage();
  return (
    <section className="section" id="studio-services" aria-labelledby="studio-heading">
      <div className="container">
        <div className="productCard">
          <h2 id="studio-heading">{t.studioServices.title}</h2>
          <p className="productTagline">{t.studioServices.message}</p>
        </div>
      </div>
    </section>
  );
}
