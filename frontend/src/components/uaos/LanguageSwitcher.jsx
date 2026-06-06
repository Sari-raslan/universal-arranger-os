import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';

export default function LanguageSwitcher() {
  const { lang, setLang, languages } = useI18n();

  return (
    <select
      value={lang}
      onChange={(event) => setLang(event.target.value)}
      className="uaos-select"
      aria-label="Language"
    >
      {Object.values(languages).map((item) => (
        <option key={item.code} value={item.code}>
          {item.label}
        </option>
      ))}
    </select>
  );
}
