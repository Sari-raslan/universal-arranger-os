import { useLanguage } from '../i18n/LanguageContext.jsx';
import SingyMark from './SingyMark.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';

export default function NavBar() {
  const { t } = useLanguage();

  return (
    <header className="navBar">
      <nav className="container" aria-label={t.nav.brand}>
        <a className="navBrand" href="#top">
          <SingyMark title={t.nav.brand} />
          <span>{t.nav.brand}</span>
        </a>
        <ul className="navLinks">
          <li><a href="#top">{t.nav.home}</a></li>
          <li><a href={`#${t.kids.id}`}>{t.nav.kids}</a></li>
          <li><a href={`#${t.teen.id}`}>{t.nav.teen}</a></li>
          <li><a href="#coming-later">{t.nav.comingLater}</a></li>
        </ul>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
