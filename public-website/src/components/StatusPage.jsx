import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function StatusPage() {
  const { t } = useLanguage();
  return (
    <main id="main-content" className="section">
      <div className="container">
        <h1>{t.statusPage.title}</h1>
        <ul className="pointList">
          {t.statusPage.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </main>
  );
}
