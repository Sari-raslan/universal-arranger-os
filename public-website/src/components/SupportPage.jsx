import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function SupportPage() {
  const { t } = useLanguage();
  return (
    <main id="main-content" className="section">
      <div className="container">
        <h1>{t.support.title}</h1>
        <p>{t.support.body}</p>
        <p>
          <a href={`mailto:${t.support.email}`}>{t.support.email}</a>
        </p>
      </div>
    </main>
  );
}
