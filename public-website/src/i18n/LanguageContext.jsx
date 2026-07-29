import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from './strings.en.js';
import de from './strings.de.js';
import ar from './strings.ar.js';

const DICTS = { en, de, ar };
const SUPPORTED = Object.keys(DICTS);
const STORAGE_KEY = 'uaos-singy-lang';

function detectInitialLanguage() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch {
    // localStorage unavailable (privacy mode, etc.) — fall through to browser detection
  }
  const browserLangs = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language || 'en'];
  for (const raw of browserLangs) {
    const short = raw.slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(short)) return short;
  }
  return 'en';
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLanguage);
  const dict = DICTS[lang];

  useEffect(() => {
    document.documentElement.lang = dict.meta.lang;
    document.documentElement.dir = dict.meta.dir;
    document.title = dict.meta.title;

    const setMeta = (selector, attr, value) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };
    setMeta('meta[name="description"]', 'content', dict.meta.description);
    setMeta('meta[property="og:title"]', 'content', dict.meta.title);
    setMeta('meta[property="og:description"]', 'content', dict.meta.description);
    setMeta('meta[name="twitter:title"]', 'content', dict.meta.title);
    setMeta('meta[name="twitter:description"]', 'content', dict.meta.description);
  }, [dict]);

  const setLang = (next) => {
    if (!SUPPORTED.includes(next)) return;
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore persistence failure
    }
  };

  const value = useMemo(() => ({ lang, setLang, t: dict, supported: SUPPORTED }), [lang, dict]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
