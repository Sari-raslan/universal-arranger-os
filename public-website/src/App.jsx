import { useLanguage } from './i18n/LanguageContext.jsx';
import NavBar from './components/NavBar.jsx';
import Hero from './components/Hero.jsx';
import ProductSection from './components/ProductSection.jsx';
import ComparisonSection from './components/ComparisonSection.jsx';
import ComingLaterSection from './components/ComingLaterSection.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  const { t } = useLanguage();

  return (
    <>
      <a className="skipLink" href="#main-content">{t.skipLink}</a>
      <NavBar />
      <Hero />
      <main id="main-content">
        <ProductSection data={t.kids} />
        <ProductSection data={t.teen} />
        <ComparisonSection />
        <ComingLaterSection />
      </main>
      <Footer />
    </>
  );
}
