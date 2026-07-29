import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function ComingLaterSection() {
  const { t } = useLanguage();

  return (
    <section className="section comingLater" id="coming-later" aria-labelledby="coming-later-heading">
      <div className="container">
        <h2 id="coming-later-heading">{t.comingLater.title}</h2>
        <p className="comingLaterCard">{t.comingLater.message}</p>
      </div>
    </section>
  );
}
