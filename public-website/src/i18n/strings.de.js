export default {
  meta: {
    lang: 'de',
    dir: 'ltr',
    title: 'UAOS / AE Platform — Arranger Studio · MIDI Toolkit · Singy',
    description:
      'UAOS von AE Platform: drei Kundenprodukte — Arranger Studio, MIDI Toolkit und Singy. Privater Founding Pilot. Kein öffentlicher Store-Release.',
  },
  skipLink: 'Zum Inhalt springen',
  nav: {
    brand: 'UAOS',
    home: 'Start',
    arranger: 'Arranger Studio',
    midi: 'MIDI Toolkit',
    singy: 'Singy',
    studio: 'Studio Services',
    status: 'Status',
    support: 'Support',
    languageLabel: 'Sprache',
  },
  hero: {
    eyebrow: 'AE Platform / UAOS',
    title: 'Drei Produkte. Eine musikalische Plattform.',
    subtitle:
      'Arranger Studio, MIDI Toolkit und Singy — Ein-Klick-Windows-Pakete mit ehrlichen Formatgrenzen. Keine Entwicklertools nötig.',
    ctaArranger: 'Arranger Studio',
    ctaMidi: 'MIDI Toolkit',
    ctaSingy: 'Singy',
    markAlt: 'UAOS Markenzeichen',
  },
  products: {
    arranger: {
      id: 'arranger-studio',
      path: '/products/arranger-studio/',
      title: 'UAOS Arranger Studio',
      tagline: 'Akkorde und Melodie → Arrangement → MIDI-Export',
      status: 'V14 Produktionskandidat · Privater Founding Pilot',
      proof: 'ONE_CLICK_START=PASS · P0=0 · P1=0 · ZIP UAOS_ARRANGER_STUDIO_V14.zip',
      points: [
        'Idee → Verstehen → Arrangieren → Sequenz → Play → Export',
        'Port-Konflikt-Wiederherstellung ohne Task-Manager',
        'EN / DE / AR mit arabischem RTL',
        'MIDI-SMF-Export wo verifiziert',
        'Proprietäres Keyboard-WRITE bleibt FORMAT_CONTRACT_REQUIRED',
      ],
      limitations: [
        'Kein Commander',
        'Kein öffentlicher Store-Release',
        'Musikalische Owner-Abnahme ist ein separates Gate',
        'Kein erfundenes proprietäres WRITE',
      ],
      howItWorks: [
        'ZIP entpacken',
        'START-UAOS-ARRANGER-STUDIO.bat doppelklicken',
        'Demo öffnen oder Projekt erstellen',
        'Play, speichern, MIDI exportieren',
      ],
      faq: [
        { q: 'Brauche ich Node oder Git?', a: 'Nein. Runtime ist gebündelt.' },
        { q: 'Öffentlicher Release?', a: 'Nein. Privater Founding Pilot.' },
        { q: 'Marktführerschaft?', a: 'Keine solchen Claims.' },
      ],
    },
    midi: {
      id: 'midi-toolkit',
      path: '/products/midi-toolkit/',
      title: 'UAOS MIDI Toolkit',
      tagline: 'Prüfen, bereinigen, normalisieren, konvertieren wo verifiziert',
      status: 'V14 Produktionskandidat · Privater Founding Pilot',
      proof: 'ONE_CLICK_START=PASS · P0=0 · P1=0 · ZIP UAOS_MIDI_TOOLKIT_V14.zip',
      points: [
        'AUDIO_TO_MIDI · MIDI_INSPECT · MIDI_CLEAN · MIDI_NORMALIZE',
        'FORMAT_INSPECT · CONVERT_WHERE_VERIFIED',
        'Format-Wahrheitsmatrix (kein erfundenes WRITE)',
        'Neutral-IR-Pfad · Roundtrip wo bewiesen',
      ],
      limitations: [
        'Korg/Yamaha/Roland/Ketron WRITE braucht vollständigen Vertragsnachweis',
        'Mikrofon-Live-Capture bleibt HARDWARE_REQUIRED',
      ],
      howItWorks: [
        'ZIP entpacken → START-UAOS-MIDI-TOOLKIT.bat',
        'Modus wählen',
        'Eingabe laden wo unterstützt',
        'Verarbeiten und exportieren',
      ],
      faq: [
        { q: 'Kann es .SET schreiben?', a: 'Nein — FORMAT_CONTRACT_REQUIRED.' },
        { q: 'Entwicklerumgebung?', a: 'Nicht erforderlich.' },
      ],
    },
    singy: {
      id: 'singy',
      path: '/products/singy/',
      title: 'Singy — Kids + Teen',
      tagline: 'Ein Familien-Launcher. Altersgerechtes musikalisches Coaching.',
      status: 'V14 Produktionskandidat · Musikalische Abnahme = Owner-Gate',
      proof: 'KIDS_FIRST_RUN=PASS · TEEN_FIRST_RUN=PASS · UNCLEARED_SHIPPED_ASSETS=0',
      points: [
        'Erster Bildschirm: KIDS oder TEEN wählen',
        'Geteiltes Musical Brain + Speicher + Lektionen',
        'Nur eingebauter Synth',
        'Datenschutzfreundliches Kids-UX · kreatives Teen-Studio',
      ],
      limitations: [
        'Keine unklaren KORG/MP3/Oud/Qanun/Ney-Samples',
        'FINAL_MUSICAL_ACCEPTANCE bleibt Owner-Entscheidung',
      ],
      howItWorks: [
        'ZIP entpacken → START-SINGY.bat',
        'KIDS oder TEEN wählen',
        'Lektion öffnen / erstellen',
        'Ergebnis hören · Session speichern',
      ],
      faq: [
        { q: 'Getrennte Produkte?', a: 'Eine Singy-Familie mit zwei Modi.' },
        { q: 'Konto nötig?', a: 'Nein für den Offline-Kernfluss.' },
      ],
    },
  },
  studioServices: {
    title: 'Studio Services',
    message:
      'Studio Services bleiben als separates Angebot erhalten. Diese Website fokussiert die drei Software-SKUs.',
  },
  statusPage: {
    title: 'Produktstatus',
    items: [
      'Arranger Studio V14 — INTERNAL_PRODUCT_COMPLETION=PASS',
      'MIDI Toolkit V14 — INTERNAL_PRODUCT_COMPLETION=PASS',
      'Singy V14 — INTERNAL_PRODUCT_COMPLETION=PASS',
      'PUBLIC_RELEASE=NO · PAYMENT_ACTIVE=NO · WEBSITE_PRODUCTION_DEPLOY=NO',
      'WHEA_GATE=NOT_CLEARED',
    ],
  },
  support: {
    title: 'Support',
    body: 'Founding-Pilot-Support nach bestem Bemühen. Kontakt: admin@aeplatform.app. Bitte Diagnose-Export anhängen.',
    email: 'admin@aeplatform.app',
  },
  footer: {
    platformName: 'AE Platform / UAOS',
    rights: 'Alle Rechte vorbehalten. Vorschau — kein öffentlicher Release.',
    impressum: 'Impressum',
    datenschutz: 'Datenschutz',
    terms: 'AGB (Entwurf)',
    support: 'Support',
  },
  legal: {
    pendingTitle: 'Angaben ausstehend',
    pendingBody:
      'Rechtliche Seiten brauchen Owner-Unternehmensdaten. Nur Entwürfe — nicht akzeptiert.',
    backHome: 'Zur Startseite',
  },
  cta: {
    pilot: 'Privater Founding Pilot — nur per Einladung',
    noPrice: 'Preis erst nach Owner-Freigabe',
  },
  sections: {
    how: 'So funktioniert es',
    features: 'Funktionen',
    limits: 'Echte Grenzen',
    faq: 'FAQ',
  },
};
