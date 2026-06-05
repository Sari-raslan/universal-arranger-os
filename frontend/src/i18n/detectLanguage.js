const supportedLanguages = ['ar', 'en', 'de', 'fr', 'es'];

export function detectLanguage() {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  const browserLanguage = navigator.language?.split('-')[0] || 'en';
  return supportedLanguages.includes(browserLanguage) ? browserLanguage : 'en';
}
