import { useLanguage } from '../i18n/LanguageContext.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';

export default function NavBar({ path, onNavigate }) {
  const { t } = useLanguage();
  const link = (to, label) => (
    <li>
      <a
        href={to}
        aria-current={path === to ? 'page' : undefined}
        onClick={(e) => {
          e.preventDefault();
          onNavigate(to);
        }}
      >
        {label}
      </a>
    </li>
  );

  return (
    <header className="navBar">
      <nav className="container" aria-label={t.nav.brand}>
        <a
          className="navBrand"
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/');
          }}
        >
          <span>{t.nav.brand}</span>
        </a>
        <ul className="navLinks">
          {link('/', t.nav.home)}
          {link('/products/arranger-studio/', t.nav.arranger)}
          {link('/products/midi-toolkit/', t.nav.midi)}
          {link('/products/singy/', t.nav.singy)}
          {link('/status/', t.nav.status)}
          {link('/support/', t.nav.support)}
        </ul>
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
