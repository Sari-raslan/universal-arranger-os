import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="siteFooter">
      <div className="container">
        <p>© {year} {t.footer.platformName}. {t.footer.rights}</p>
        <ul className="footerLinks">
          <li><a href="/legal/impressum.html">{t.footer.impressum}</a></li>
          <li><a href="/legal/datenschutz.html">{t.footer.datenschutz}</a></li>
        </ul>
      </div>
    </footer>
  );
}
