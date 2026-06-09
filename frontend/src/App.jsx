<<<<<<< HEAD
import "./uaos-force-visual-final.css";
import StatusPage from './pages/StatusPage.jsx';
import React from 'react';
import KeyboardManagerApp from './KeyboardManagerApp.jsx';
import DemoPage from './pages/DemoPage.jsx';
import DownloadsPage from './pages/DownloadsPage.jsx';
import FeaturesPage from './pages/FeaturesPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import MediaPage from './pages/MediaPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import UaosWorkspacePage from './pages/UaosWorkspacePage.jsx';
import PublicRuntimeStatus from './components/PublicRuntimeStatus.jsx';
=======
﻿import React, { useMemo, useState } from 'react';
import './App.css';

const LINKS = {
  website: 'https://uaos-public.vercel.app',
  github: 'https://github.com/Sari-raslan/universal-arranger-os',
  release: 'https://github.com/Sari-raslan/universal-arranger-os/releases/tag/v0.1.0-debug',
  apk: 'https://github.com/Sari-raslan/universal-arranger-os/releases/download/v0.1.0-debug/UAOS-debug.apk',
  paypal: 'https://www.paypal.com/paypalme/YOURNAME'
};

const T = {
  ar: {
    dir: 'rtl',
    name: 'العربية',
    navHome: 'الرئيسية',
    navApp: 'التطبيق',
    navMedia: 'الوسائط',
    navFeatures: 'المميزات',
    navPricing: 'الدعم / PayPal',
    navDownloads: 'التحميل',
    navDemo: 'التجربة',
    heroTitle: 'UAOS — Universal Arranger OS',
    heroSub: 'نظام Arranger ذكي للموسيقيين، العازفين، المنتجين، والموزعين.',
    heroText: 'واجهة ويب وتطبيق Android مع دعم MIDI، صفحات متعددة، وتجهيز مستقبلي لأدوات ذكاء اصطناعي موسيقية.',
    ctaDemo: 'فتح الموقع',
    ctaApk: 'تحميل Android APK',
    ctaGithub: 'GitHub',
    appTitle: 'واجهة التطبيق',
    appText: 'واجهة UAOS مخصصة للتحكم الحي: إيقاعات، أكوردات، أقسام Arranger، Mixer، وربط MIDI مستقبلي.',
    mediaTitle: 'الوسائط والبراند',
    mediaText: 'استخدم شعار UAOS الرسمي وصور البروفايل والكفر والبوست لنشر المشروع على كل المنصات.',
    featuresTitle: 'المميزات الأساسية',
    f1: 'واجهة متعددة اللغات: عربي، إنجليزي، ألماني.',
    f2: 'Android APK جاهز للتجربة.',
    f3: 'React / Vite / Capacitor.',
    f4: 'تصميم مخصص للموسيقيين وأجهزة Arranger.',
    pricingTitle: 'الدعم و PayPal',
    pricingText: 'هذه صفحة الدعم الرسمية. إذا أردت دعم تطوير UAOS، استخدم رابط PayPal التالي.',
    paypalBtn: 'الدعم عبر PayPal',
    paypalMissing: 'رابط PayPal لم يتم ضبطه بعد. ضع رابطك داخل السكربت في المتغير PayPalLink.',
    downloadsTitle: 'التحميل',
    downloadsText: 'حمّل نسخة Android التجريبية أو افتح صفحة الإصدار على GitHub.',
    demoTitle: 'التجربة',
    demoText: 'يمكنك تجربة الواجهة من الموقع العام، أو تحميل APK للتجربة على Android.',
    statusTitle: 'حالة المشروع',
    statusText: 'تم بناء APK وتشغيل الصفحات الأساسية محليًا بنجاح. النسخة الحالية Debug/Test وليست إصدار متجر نهائي.',
    footer: 'UAOS by AE Platform — مشروع موسيقي قيد التطوير.'
  },
  en: {
    dir: 'ltr',
    name: 'English',
    navHome: 'Home',
    navApp: 'App',
    navMedia: 'Media',
    navFeatures: 'Features',
    navPricing: 'Support / PayPal',
    navDownloads: 'Downloads',
    navDemo: 'Demo',
    heroTitle: 'UAOS — Universal Arranger OS',
    heroSub: 'A smart arranger system for musicians, performers, producers, and arrangers.',
    heroText: 'A web interface and Android app with MIDI direction, multi-page UI, and future AI-assisted music tools.',
    ctaDemo: 'Open Website',
    ctaApk: 'Download Android APK',
    ctaGithub: 'GitHub',
    appTitle: 'Application Interface',
    appText: 'UAOS is designed for live control: rhythms, chords, arranger sections, mixer lanes, and future MIDI integration.',
    mediaTitle: 'Media and Branding',
    mediaText: 'Use the official UAOS logo, profile images, covers, and social posts to publish the project everywhere.',
    featuresTitle: 'Core Features',
    f1: 'Multilingual UI: Arabic, English, German.',
    f2: 'Android APK ready for testing.',
    f3: 'React / Vite / Capacitor.',
    f4: 'Designed for musicians and arranger-keyboard workflows.',
    pricingTitle: 'Support and PayPal',
    pricingText: 'This is the official support page. To support UAOS development, use the PayPal link below.',
    paypalBtn: 'Support via PayPal',
    paypalMissing: 'PayPal link is not configured yet. Put your real link in the PayPalLink variable.',
    downloadsTitle: 'Downloads',
    downloadsText: 'Download the Android test build or open the GitHub release page.',
    demoTitle: 'Demo',
    demoText: 'Try the web interface on the public website, or download the APK for Android testing.',
    statusTitle: 'Project Status',
    statusText: 'APK build and core routes have been verified locally. Current APK is a Debug/Test build, not a final store release.',
    footer: 'UAOS by AE Platform — music technology project in development.'
  },
  de: {
    dir: 'ltr',
    name: 'Deutsch',
    navHome: 'Start',
    navApp: 'App',
    navMedia: 'Medien',
    navFeatures: 'Funktionen',
    navPricing: 'Support / PayPal',
    navDownloads: 'Downloads',
    navDemo: 'Demo',
    heroTitle: 'UAOS — Universal Arranger OS',
    heroSub: 'Ein intelligentes Arranger-System für Musiker, Live-Performer, Produzenten und Arrangeure.',
    heroText: 'Web-Oberfläche und Android-App mit MIDI-Ausrichtung, mehrsprachiger Struktur und zukünftigen KI-Musikwerkzeugen.',
    ctaDemo: 'Website öffnen',
    ctaApk: 'Android APK herunterladen',
    ctaGithub: 'GitHub',
    appTitle: 'App-Oberfläche',
    appText: 'UAOS ist für Live-Steuerung gedacht: Rhythmen, Akkorde, Arranger-Sektionen, Mixer-Spuren und zukünftige MIDI-Integration.',
    mediaTitle: 'Medien und Branding',
    mediaText: 'Nutze das offizielle UAOS-Logo, Profilbilder, Cover und Social-Posts für die Veröffentlichung auf allen Plattformen.',
    featuresTitle: 'Kernfunktionen',
    f1: 'Mehrsprachige Oberfläche: Arabisch, Englisch, Deutsch.',
    f2: 'Android APK bereit zum Testen.',
    f3: 'React / Vite / Capacitor.',
    f4: 'Entwickelt für Musiker und Arranger-Keyboard-Workflows.',
    pricingTitle: 'Support und PayPal',
    pricingText: 'Dies ist die offizielle Support-Seite. Um die Entwicklung von UAOS zu unterstützen, nutze den PayPal-Link unten.',
    paypalBtn: 'Über PayPal unterstützen',
    paypalMissing: 'PayPal-Link ist noch nicht konfiguriert. Trage deinen echten Link in die Variable PayPalLink ein.',
    downloadsTitle: 'Downloads',
    downloadsText: 'Lade die Android-Testversion herunter oder öffne die GitHub-Release-Seite.',
    demoTitle: 'Demo',
    demoText: 'Teste die Web-Oberfläche auf der öffentlichen Website oder lade die APK für Android herunter.',
    statusTitle: 'Projektstatus',
    statusText: 'APK-Build und Hauptseiten wurden lokal erfolgreich geprüft. Die aktuelle APK ist ein Debug/Test-Build, kein finaler Store-Release.',
    footer: 'UAOS by AE Platform — Musiktechnologie-Projekt in Entwicklung.'
  }
};

function useRoute(){
  const path = window.location.pathname.toLowerCase();
  if(path.includes('/media')) return 'media';
  if(path.includes('/features')) return 'features';
  if(path.includes('/pricing') || path.includes('/paypal')) return 'pricing';
  if(path.includes('/downloads')) return 'downloads';
  if(path.includes('/demo')) return 'demo';
  if(path.includes('/app')) return 'app';
  return 'home';
}

function LinkButton({href, children, secondary=false}){
  return <a className={secondary ? 'btn secondary' : 'btn'} href={href} target="_blank" rel="noreferrer">{children}</a>;
}

export default function App(){
  const saved = localStorage.getItem('uaos_lang') || 'ar';
  const [lang,setLang] = useState(T[saved] ? saved : 'ar');
  const t = T[lang];
  const route = useRoute();

  const page = useMemo(() => {
    if(route === 'app') return {title:t.appTitle, text:t.appText};
    if(route === 'media') return {title:t.mediaTitle, text:t.mediaText};
    if(route === 'features') return {title:t.featuresTitle, text:null};
    if(route === 'pricing') return {title:t.pricingTitle, text:t.pricingText};
    if(route === 'downloads') return {title:t.downloadsTitle, text:t.downloadsText};
    if(route === 'demo') return {title:t.demoTitle, text:t.demoText};
    return {title:t.statusTitle, text:t.statusText};
  }, [route, t]);

  function changeLang(v){
    setLang(v);
    localStorage.setItem('uaos_lang', v);
  }

  const paypalReady = LINKS.paypal && !LINKS.paypal.includes('YOURNAME') && LINKS.paypal.startsWith('http');
>>>>>>> 53251bd (Fix Vite build and initialize UAOS launcher)

  return (
    <main className="uaos" dir={t.dir}>
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brandMark">♪</span>
          <span>
            <strong>UAOS</strong>
            <small>Universal Arranger OS</small>
          </span>
        </a>

        <nav>
          <a href="/">{t.navHome}</a>
          <a href="/app">{t.navApp}</a>
          <a href="/media">{t.navMedia}</a>
          <a href="/features">{t.navFeatures}</a>
          <a href="/pricing">{t.navPricing}</a>
          <a href="/downloads">{t.navDownloads}</a>
          <a href="/demo">{t.navDemo}</a>
        </nav>

        <select value={lang} onChange={e=>changeLang(e.target.value)} aria-label="Language">
          <option value="ar">العربية</option>
          <option value="en">English</option>
          <option value="de">Deutsch</option>
        </select>
      </header>

      <section className="hero">
        <div className="heroText">
          <p className="kicker">AE Platform presents</p>
          <h1>{t.heroTitle}</h1>
          <h2>{t.heroSub}</h2>
          <p>{t.heroText}</p>
          <div className="actions">
            <LinkButton href={LINKS.website}>{t.ctaDemo}</LinkButton>
            <LinkButton href={LINKS.apk} secondary>{t.ctaApk}</LinkButton>
            <LinkButton href={LINKS.github} secondary>{t.ctaGithub}</LinkButton>
          </div>
        </div>

        <div className="logoCard">
          <div className="musicIcon">𝄞</div>
          <div className="logoName">UAOS</div>
          <div className="logoSub">Universal Arranger OS</div>
        </div>
      </section>

      <section className="panel">
        <h2>{page.title}</h2>
        {page.text && <p>{page.text}</p>}

        {route === 'features' && (
          <div className="grid">
            <article>{t.f1}</article>
            <article>{t.f2}</article>
            <article>{t.f3}</article>
            <article>{t.f4}</article>
          </div>
        )}

        {route === 'pricing' && (
          <div className="paymentBox">
            {paypalReady ? (
              <LinkButton href={LINKS.paypal}>{t.paypalBtn}</LinkButton>
            ) : (
              <p className="warning">{t.paypalMissing}</p>
            )}
          </div>
        )}

        {route === 'downloads' && (
          <div className="actions">
            <LinkButton href={LINKS.apk}>{t.ctaApk}</LinkButton>
            <LinkButton href={LINKS.release} secondary>GitHub Release</LinkButton>
          </div>
        )}

        {route === 'demo' && (
          <div className="actions">
            <LinkButton href={LINKS.website}>{t.ctaDemo}</LinkButton>
            <LinkButton href={LINKS.github} secondary>{t.ctaGithub}</LinkButton>
          </div>
        )}
      </section>

      <footer>
        <p>{t.footer}</p>
      </footer>
    </main>
  );
}
<<<<<<< HEAD

export default function App() {
  const path = window.location.pathname;

  if (path === '/pricing') return withRuntimeStatus(<PricingPage />);
  if (path === '/status') return withRuntimeStatus(<StatusPage />);
  if (path === '/downloads') return withRuntimeStatus(<DownloadsPage />);
  if (path === '/demo') return withRuntimeStatus(<DemoPage />);
  if (path === '/features') return withRuntimeStatus(<FeaturesPage />);
  if (path === '/media') return withRuntimeStatus(<MediaPage />);
  if (path === '/app') return withRuntimeStatus(<UaosWorkspacePage />);
  if (path === '/keyboard') return withRuntimeStatus(<KeyboardManagerApp />);

  return withRuntimeStatus(<LandingPage />);
}



// UAOS_ANDROID_BRAIN_PHASE2_NOTE
// Safe Phase 2 applied:
// - index.html metadata/loading fallback
// - CSS loading/animation/topbar helpers
// - frontend/src/storage.js cache helper
// Next safe step: wire uaosCacheSet/uaosCacheGet into real app state after reviewing current App structure.
=======
>>>>>>> 53251bd (Fix Vite build and initialize UAOS launcher)
