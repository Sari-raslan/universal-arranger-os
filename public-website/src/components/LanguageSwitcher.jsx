import { useLanguage } from '../i18n/LanguageContext.jsx';

const LABELS = { en: 'EN', de: 'DE', ar: 'AR' };

export default function LanguageSwitcher() {
  const { lang, setLang, t, supported } = useLanguage();

  return (
    <div className="langSwitcher" role="group" aria-label={t.nav.languageLabel}>
      {supported.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
