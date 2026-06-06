import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getInitialLanguage, languages, messages } from './messages';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem('uaos-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = languages[lang]?.dir || 'ltr';
  }, [lang]);

  const value = useMemo(() => {
    const t = (key) => messages[lang]?.[key] || messages.en[key] || key;

    return {
      lang,
      setLang,
      t,
      dir: languages[lang]?.dir || 'ltr',
      languages,
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
