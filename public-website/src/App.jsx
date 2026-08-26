import { useEffect, useState } from 'react';
import { useLanguage } from './i18n/LanguageContext.jsx';
import NavBar from './components/NavBar.jsx';
import Hero from './components/Hero.jsx';
import ProductCard from './components/ProductCard.jsx';
import ProductPage from './components/ProductPage.jsx';
import StudioServices from './components/StudioServices.jsx';
import StatusPage from './components/StatusPage.jsx';
import SupportPage from './components/SupportPage.jsx';
import Footer from './components/Footer.jsx';

function normalizePath(pathname) {
  let p = pathname || '/';
  if (!p.endsWith('/')) p += '/';
  return p;
}

export default function App() {
  const { t } = useLanguage();
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const onNav = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onNav);
    return () => window.removeEventListener('popstate', onNav);
  }, []);

  const go = (to) => {
    const next = normalizePath(to);
    if (normalizePath(window.location.pathname) !== next) {
      window.history.pushState({}, '', next);
    }
    setPath(next);
    window.scrollTo(0, 0);
  };

  let page = null;
  if (path === '/products/arranger-studio/') page = <ProductPage product={t.products.arranger} onHome={() => go('/')} />;
  else if (path === '/products/midi-toolkit/') page = <ProductPage product={t.products.midi} onHome={() => go('/')} />;
  else if (path === '/products/singy/') page = <ProductPage product={t.products.singy} onHome={() => go('/')} />;
  else if (path === '/status/') page = <StatusPage />;
  else if (path === '/support/') page = <SupportPage />;
  else {
    page = (
      <main id="main-content">
        <Hero onNavigate={go} />
        <section className="section" aria-label="Products">
          <div className="container productGrid">
            <ProductCard product={t.products.arranger} onOpen={() => go(t.products.arranger.path)} />
            <ProductCard product={t.products.midi} onOpen={() => go(t.products.midi.path)} />
            <ProductCard product={t.products.singy} onOpen={() => go(t.products.singy.path)} />
          </div>
        </section>
        <StudioServices />
      </main>
    );
  }

  return (
    <>
      <a className="skipLink" href="#main-content">{t.skipLink}</a>
      <NavBar path={path} onNavigate={go} />
      {page}
      <Footer onNavigate={go} />
    </>
  );
}
